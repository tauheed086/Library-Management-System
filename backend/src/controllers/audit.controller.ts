import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, userId, search, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (action) {
      where.action = String(action);
    }
    if (userId) {
      where.userId = String(userId);
    }

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { action: { contains: searchStr } },
        { details: { contains: searchStr } },
        { user: { name: { contains: searchStr } } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
