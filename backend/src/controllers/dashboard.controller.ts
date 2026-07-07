import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Basic Counts
    const [
      totalBooks,
      availableBooks,
      issuedBooks,
      reservedBooks,
      overdueBooksCount,
      lostBooks,
      damagedBooks,
      totalMembers,
      activeMembers,
      finesSummary,
      recentTransactions,
      latestMembers,
      recentLogs
    ] = await Promise.all([
      // Total Books
      prisma.book.aggregate({ _sum: { numberOfCopies: true } }),
      // Available Books
      prisma.book.aggregate({ _sum: { availableCopies: true } }),
      // Issued Books
      prisma.transaction.count({ where: { status: { in: ['ISSUED', 'RENEWED'] } } }),
      // Reserved Books
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      // Overdue Books (where status is ISSUED/RENEWED and dueDate is in the past)
      prisma.transaction.count({
        where: {
          status: { in: ['ISSUED', 'RENEWED'] },
          dueDate: { lt: new Date() }
        }
      }),
      // Lost
      prisma.book.count({ where: { status: 'LOST' } }),
      // Damaged
      prisma.book.count({ where: { status: 'DAMAGED' } }),
      // Total members
      prisma.user.count({ where: { role: { in: ['STUDENT', 'FACULTY', 'STAFF'] } } }),
      // Active members
      prisma.user.count({ where: { role: { in: ['STUDENT', 'FACULTY', 'STAFF'] }, status: 'ACTIVE' } }),
      // Fine collection summary
      prisma.fine.aggregate({
        _sum: {
          amount: true,
          paidAmount: true,
          waivedAmount: true
        }
      }),
      // Recent transactions
      prisma.transaction.findMany({
        orderBy: { issueDate: 'desc' },
        take: 6,
        include: {
          book: { select: { title: true } },
          member: { select: { name: true, role: true } }
        }
      }),
      // Latest Members
      prisma.user.findMany({
        where: { role: { in: ['STUDENT', 'FACULTY', 'STAFF'] } },
        orderBy: { dateJoined: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          dateJoined: true,
          photoUrl: true
        }
      }),
      // Recent activity logs
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          user: { select: { name: true, role: true } }
        }
      })
    ]);

    const collectedFines = finesSummary._sum.paidAmount || 0;
    const pendingFines = (finesSummary._sum.amount || 0) - (finesSummary._sum.paidAmount || 0) - (finesSummary._sum.waivedAmount || 0);

    // 2. Charts Data (Last 6 Months Trend)
    const months = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth()
      });
    }

    // Issues & Returns trend
    const circulationTrends = await Promise.all(
      months.map(async (m) => {
        const start = new Date(m.year, m.monthNum, 1);
        const end = new Date(m.year, m.monthNum + 1, 0, 23, 59, 59);

        const [issues, returns] = await Promise.all([
          prisma.transaction.count({
            where: {
              issueDate: { gte: start, lte: end }
            }
          }),
          prisma.transaction.count({
            where: {
              returnDate: { gte: start, lte: end }
            }
          })
        ]);

        return {
          month: m.name,
          issues,
          returns
        };
      })
    );

    // Category Distribution
    const rawCategories = await prisma.book.groupBy({
      by: ['category'],
      _sum: { numberOfCopies: true }
    });

    const categoryDistribution = rawCategories.map((c) => ({
      name: c.category,
      value: c._sum.numberOfCopies || 0
    }));

    // Most Borrowed Books
    const rawBorrowed = await prisma.transaction.groupBy({
      by: ['bookId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const mostBorrowedBooks = await Promise.all(
      rawBorrowed.map(async (b) => {
        const book = await prisma.book.findUnique({
          where: { id: b.bookId },
          select: { title: true, authors: true }
        });
        return {
          title: book?.title || 'Unknown Book',
          borrowCount: b._count.id
        };
      })
    );

    // Fine Collection Trend
    const fineTrends = await Promise.all(
      months.map(async (m) => {
        const start = new Date(m.year, m.monthNum, 1);
        const end = new Date(m.year, m.monthNum + 1, 0, 23, 59, 59);

        const payment = await prisma.finePayment.aggregate({
          where: {
            paymentDate: { gte: start, lte: end }
          },
          _sum: { amountPaid: true }
        });

        return {
          month: m.name,
          amount: payment._sum.amountPaid || 0
        };
      })
    );

    // Membership Growth
    let runningTotal = await prisma.user.count({
      where: {
        role: { in: ['STUDENT', 'FACULTY', 'STAFF'] },
        dateJoined: { lt: new Date(months[0].year, months[0].monthNum, 1) }
      }
    });

    const membershipGrowth = [];
    for (const m of months) {
      const start = new Date(m.year, m.monthNum, 1);
      const end = new Date(m.year, m.monthNum + 1, 0, 23, 59, 59);

      const added = await prisma.user.count({
        where: {
          role: { in: ['STUDENT', 'FACULTY', 'STAFF'] },
          dateJoined: { gte: start, lte: end }
        }
      });

      runningTotal += added;
      membershipGrowth.push({
        month: m.name,
        members: runningTotal
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBooks: totalBooks._sum.numberOfCopies || 0,
          availableBooks: availableBooks._sum.availableCopies || 0,
          issuedBooks,
          reservedBooks,
          overdueBooks: overdueBooksCount,
          lostBooks,
          damagedBooks,
          totalMembers,
          activeMembers,
          fineCollection: collectedFines,
          pendingFines
        },
        trends: {
          circulation: circulationTrends,
          categories: categoryDistribution,
          popularBooks: mostBorrowedBooks,
          fines: fineTrends,
          members: membershipGrowth
        },
        widgets: {
          recentTransactions,
          latestMembers,
          activityTimeline: recentLogs
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
