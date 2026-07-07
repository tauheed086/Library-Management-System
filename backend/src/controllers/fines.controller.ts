import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/audit';

export const getFines = async (req: Request, res: Response, next: NextFunction) => {
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

    const fines = await prisma.fine.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, email: true, role: true } },
        transaction: {
          include: {
            book: { select: { title: true, isbn: true } }
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: fines
    });
  } catch (error) {
    next(error);
  }
};

export const waiveFine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body; // amount to waive
    const staffId = req.user?.id;

    if (!id || amount === undefined || !staffId) {
      return next(new AppError('Fine ID and waive amount are required', 400));
    }

    const fine = await prisma.fine.findUnique({ where: { id } });
    if (!fine) {
      return next(new AppError('Fine record not found', 404));
    }

    const remainingToPay = fine.amount - fine.paidAmount - fine.waivedAmount;
    const waiveAmt = Number(amount);
    
    if (waiveAmt > remainingToPay) {
      return next(new AppError(`Cannot waive $${waiveAmt}. Remaining fine is $${remainingToPay}.`, 400));
    }

    const newWaived = fine.waivedAmount + waiveAmt;
    const isPaid = fine.paidAmount + newWaived >= fine.amount;

    const updated = await prisma.fine.update({
      where: { id },
      data: {
        waivedAmount: newWaived,
        status: isPaid ? 'WAIVED' : 'PARTIALLY_PAID',
        reason: reason || fine.reason
      }
    });

    await logActivity(staffId, 'FINE_WAIVE', { fineId: fine.id, amountWaived: waiveAmt, reason }, req.ip);

    res.status(200).json({
      success: true,
      message: `Successfully waived $${waiveAmt.toFixed(2)} from fine.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMethod } = req.body;
    const staffId = req.user?.id;

    if (!id || amountPaid === undefined || !paymentMethod || !staffId) {
      return next(new AppError('Required fields: amountPaid, paymentMethod', 400));
    }

    const fine = await prisma.fine.findUnique({ where: { id } });
    if (!fine) {
      return next(new AppError('Fine record not found', 404));
    }

    const remaining = fine.amount - fine.paidAmount - fine.waivedAmount;
    const payAmt = Number(amountPaid);

    if (payAmt > remaining) {
      return next(new AppError(`Payment amount $${payAmt} exceeds outstanding balance of $${remaining}`, 400));
    }

    const newPaid = fine.paidAmount + payAmt;
    const isSettle = newPaid + fine.waivedAmount >= fine.amount;
    const receiptNumber = `REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create Payment record
      const payment = await tx.finePayment.create({
        data: {
          fineId: id,
          amountPaid: payAmt,
          paymentMethod,
          receiptNumber,
          recordedById: staffId
        }
      });

      // 2. Update Fine record status
      const updatedFine = await tx.fine.update({
        where: { id },
        data: {
          paidAmount: newPaid,
          status: isSettle ? 'PAID' : 'PARTIALLY_PAID'
        }
      });

      return { payment, updatedFine };
    });

    await logActivity(staffId, 'FINE_PAYMENT', { fineId: fine.id, amountPaid: payAmt, receiptNumber }, req.ip);

    res.status(200).json({
      success: true,
      message: `Recorded payment of $${payAmt.toFixed(2)} successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
