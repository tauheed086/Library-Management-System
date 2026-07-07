import { Request, Response, NextFunction } from 'express';
import { Fine, Prisma } from '@prisma/client';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/audit';

export const issueBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isbn, memberId } = req.body;
    const issuedById = req.user?.id;

    if (!isbn || !memberId || !issuedById) {
      return next(new AppError('ISBN and Member ID are required', 400));
    }

    // Verify Active Session User
    const activeUser = await prisma.user.findUnique({ where: { id: issuedById } });
    if (!activeUser) {
      return next(new AppError('Your session is invalid (User not found). Please log out and log back in.', 401));
    }

    // 1. Verify Member
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        transactions: { where: { status: { in: ['ISSUED', 'RENEWED'] } } }
      }
    });

    if (!member) {
      return next(new AppError('Member not found', 404));
    }

    if (member.status !== 'ACTIVE') {
      return next(new AppError(`Member account is suspended or expired: Current status is ${member.status}`, 400));
    }

    // Check membership expiration
    if (new Date(member.membershipExpiry) < new Date()) {
      return next(new AppError('Member membership has expired. Please renew first.', 400));
    }

    // Check outstanding unpaid fines
    const outstandingFines = await prisma.fine.findMany({
      where: {
        memberId,
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] }
      }
    });

    const unpaidSum = outstandingFines.reduce((acc: number, f: Fine) => acc + (f.amount - f.paidAmount - f.waivedAmount), 0);
    if (unpaidSum > 10.0) {
      return next(new AppError(`Member has outstanding unpaid fines of $${unpaidSum.toFixed(2)}. Please settle fines before borrowing.`, 400));
    }

    // Check borrow limits
    if (member.transactions.length >= member.borrowLimit) {
      return next(new AppError(`Member has reached their borrow limit of ${member.borrowLimit} books.`, 400));
    }

    // 2. Verify Book
    const book = await prisma.book.findFirst({
      where: { isbn }
    });

    if (!book) {
      return next(new AppError(`Book with ISBN ${isbn} not found`, 404));
    }

    if (book.availableCopies <= 0 || book.status !== 'AVAILABLE') {
      return next(new AppError('No copies of this book are currently available', 400));
    }

    // Calculate Due Date based on member role (Faculty get longer checkouts)
    const durationDaysSetting = await prisma.setting.findUnique({
      where: { key: member.role === 'FACULTY' ? 'borrow_duration_faculty_days' : 'borrow_duration_student_days' }
    });
    const durationDays = Number(durationDaysSetting?.value) || (member.role === 'FACULTY' ? 30 : 14);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + durationDays);

    // Create Transaction & Decrement Available Copies
    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create Checkout record
      const trans = await tx.transaction.create({
        data: {
          bookId: book.id,
          memberId,
          issuedById,
          dueDate,
          status: 'ISSUED'
        }
      });

      // Fetch latest book quantities inside transaction to prevent race conditions
      const currentBook = await tx.book.findUnique({ where: { id: book.id } });
      if (!currentBook) throw new Error('Book not found');
      if (currentBook.availableCopies <= 0) throw new Error('No copies of this book are available');

      const newAvailable = currentBook.availableCopies - 1;
      await tx.book.update({
        where: { id: book.id },
        data: {
          availableCopies: newAvailable,
          status: newAvailable <= 0 ? 'RENTED' : 'AVAILABLE'
        }
      });

      return trans;
    });

    await logActivity(issuedById, 'BOOK_ISSUE', { transactionId: transaction.id, bookTitle: book.title, memberName: member.name }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, statusOverride } = req.body; // statusOverride: e.g. RETURNED, LOST, DAMAGED
    const returnedById = req.user?.id;

    if (!transactionId || !returnedById) {
      return next(new AppError('Transaction ID is required', 400));
    }

    // Verify Active Session User
    const activeUser = await prisma.user.findUnique({ where: { id: returnedById } });
    if (!activeUser) {
      return next(new AppError('Your session is invalid (User not found). Please log out and log back in.', 401));
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        book: true,
        member: true
      }
    });

    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }

    if (transaction.status !== 'ISSUED' && transaction.status !== 'RENEWED') {
      return next(new AppError('Book is already checked in or processed', 400));
    }

    const returnDate = new Date();
    let transStatus = statusOverride || 'RETURNED';

    // Calculate fine if late
    let fineAmount = 0;
    let daysOverdue = 0;
    const dueDate = new Date(transaction.dueDate);

    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Fetch grace period
      const graceSetting = await prisma.setting.findUnique({ where: { key: 'grace_period_days' } });
      const graceDays = Number(graceSetting?.value) || 3;

      if (daysOverdue > graceDays) {
        // Calculate fine
        const rateSetting = await prisma.setting.findUnique({
          where: { key: transaction.member.role === 'FACULTY' ? 'fine_rate_faculty' : 'fine_rate_student' }
        });
        const fineRate = Number(rateSetting?.value) || 2.0;
        fineAmount = daysOverdue * fineRate;
      }
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update checkout record status
      const updatedTrans = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          returnDate,
          returnedById,
          status: transStatus
        }
      });

      // 2. Adjust book inventory count (unless lost)
      let copiesIncrement = 1;
      let isLostOrDamaged = false;

      if (transStatus === 'LOST' || transStatus === 'DAMAGED') {
        copiesIncrement = 0; // Don't add back to active inventory
        isLostOrDamaged = true;
      }

      // Fetch latest book quantities inside transaction to prevent race conditions
      const currentBook = await tx.book.findUnique({ where: { id: transaction.bookId } });
      if (!currentBook) throw new Error('Book not found');

      const newAvailable = currentBook.availableCopies + copiesIncrement;

      // The book status is set to LOST or DAMAGED only if there are no copies left at all.
      // Otherwise, as long as newAvailable > 0, it remains AVAILABLE.
      let finalBookStatus = 'AVAILABLE';
      if (newAvailable <= 0) {
        finalBookStatus = isLostOrDamaged ? transStatus : 'RENTED';
      }

      await tx.book.update({
        where: { id: transaction.bookId },
        data: {
          availableCopies: newAvailable,
          status: finalBookStatus
        }
      });

      // 3. Create Fine if late or if book is lost/damaged
      if (fineAmount > 0 || transStatus === 'LOST' || transStatus === 'DAMAGED') {
        let reason = fineAmount > 0 ? `Late return of ${daysOverdue} days.` : '';
        if (transStatus === 'LOST') {
          fineAmount += transaction.book.purchasePrice || 50.0; // Charge purchase price for lost books
          reason += ' Book marked as lost.';
        } else if (transStatus === 'DAMAGED') {
          fineAmount += (transaction.book.purchasePrice || 50.0) * 0.5; // Charge 50% for damaged books
          reason += ' Book marked as damaged.';
        }

        await tx.fine.create({
          data: {
            transactionId,
            memberId: transaction.memberId,
            amount: fineAmount,
            reason,
            status: 'UNPAID'
          }
        });
      }

      return updatedTrans;
    });

    await logActivity(returnedById, 'BOOK_RETURN', { transactionId, status: transStatus, fineAmount }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: result,
      fineAmount
    });
  } catch (error) {
    next(error);
  }
};

export const renewBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.body;
    const staffId = req.user?.id;

    if (!transactionId || !staffId) {
      return next(new AppError('Transaction ID is required', 400));
    }

    // Verify Active Session User
    const activeUser = await prisma.user.findUnique({ where: { id: staffId } });
    if (!activeUser) {
      return next(new AppError('Your session is invalid (User not found). Please log out and log back in.', 401));
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { member: true }
    });

    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }

    if (transaction.status !== 'ISSUED' && transaction.status !== 'RENEWED') {
      return next(new AppError('Only active checkouts can be renewed', 400));
    }

    // Overdue books cannot be renewed
    if (new Date(transaction.dueDate) < new Date()) {
      return next(new AppError('Overdue books cannot be renewed. Please return the book and settle fines.', 400));
    }

    if (transaction.renewalCount >= 3) {
      return next(new AppError('Maximum renewal limit (3) reached for this transaction', 400));
    }

    // Extend due date by standard borrow duration
    const durationSetting = await prisma.setting.findUnique({
      where: { key: transaction.member.role === 'FACULTY' ? 'borrow_duration_faculty_days' : 'borrow_duration_student_days' }
    });
    const days = Number(durationSetting?.value) || 14;

    const currentDue = new Date(transaction.dueDate);
    const newDueDate = new Date(currentDue.setDate(currentDue.getDate() + days));

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        dueDate: newDueDate,
        renewalCount: transaction.renewalCount + 1,
        status: 'RENEWED'
      }
    });

    await logActivity(staffId, 'BOOK_RENEW', { transactionId, renewalCount: updated.renewalCount, newDueDate }, req.ip);

    res.status(200).json({
      success: true,
      message: `Book renewed successfully. New due date is ${newDueDate.toLocaleDateString()}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, memberId } = req.query;

    const userRole = req.user?.role;
    const userId = req.user?.id;

    const where: any = {};
    if (status) {
      where.status = String(status);
    }

    if (userRole === 'STUDENT' || userRole === 'FACULTY' || userRole === 'STAFF') {
      where.memberId = userId;
    } else if (memberId) {
      where.memberId = String(memberId);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        book: { select: { title: true, isbn: true, barcode: true } },
        member: { select: { name: true, email: true } },
        issuedBy: { select: { name: true } },
        returnedBy: { select: { name: true } },
        fines: true
      },
      orderBy: { issueDate: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};
