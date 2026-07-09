import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/error.middleware';
import * as bcrypt from 'bcryptjs';
import { logActivity } from '../utils/audit';
import { generateReadableUserId } from '../utils/idGenerator';

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, role, status } = req.query;

    const where: any = {};
    
    // Filter non-members (staff, super admin can be excluded or included, we filter out non-students/faculty if needed or let them view all users)
    if (role) {
      where.role = String(role);
    } else {
      where.role = { in: ['STUDENT', 'FACULTY', 'STAFF'] };
    }

    if (status) {
      where.status = String(status);
    }

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { phone: { contains: searchStr, mode: 'insensitive' } },
        { department: { contains: searchStr, mode: 'insensitive' } },
        { id: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        photoUrl: true,
        department: true,
        course: true,
        semester: true,
        dateJoined: true,
        membershipExpiry: true,
        borrowLimit: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            transactions: { where: { status: 'ISSUED' } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Append fine balance to each member dynamically
    const membersWithFines = await Promise.all(
      members.map(async (m) => {
        const fines = await prisma.fine.aggregate({
          where: {
            memberId: m.id,
            status: { in: ['UNPAID', 'PARTIALLY_PAID'] }
          },
          _sum: {
            amount: true,
            paidAmount: true,
            waivedAmount: true
          }
        });

        const totalFine = (fines._sum.amount || 0) - (fines._sum.paidAmount || 0) - (fines._sum.waivedAmount || 0);

        return {
          ...m,
          currentBorrowedBooks: m._count.transactions,
          fineBalance: Math.max(0, totalFine)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: membersWithFines
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if ((userRole === 'STUDENT' || userRole === 'FACULTY' || userRole === 'STAFF') && userId !== id) {
      return next(new AppError('You do not have permission to view other members profiles', 403));
    }

    const m = await prisma.user.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { issueDate: 'desc' },
          include: { book: { select: { title: true, isbn: true } } }
        },
        reservations: {
          orderBy: { reserveDate: 'desc' },
          include: { book: { select: { title: true } } }
        },
        fines: {
          orderBy: { createdAt: 'desc' },
          include: { transaction: { select: { book: { select: { title: true } } } } }
        }
      }
    });

    if (!m) {
      return next(new AppError('Member not found', 404));
    }

    // Calculate dynamic fine balance
    const unpaidFines = m.fines.filter(f => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID');
    const fineBalance = unpaidFines.reduce((acc, f) => acc + (f.amount - f.paidAmount - f.waivedAmount), 0);

    const memberData = {
      id: m.id,
      email: m.email,
      name: m.name,
      role: m.role,
      phone: m.phone,
      address: m.address,
      photoUrl: m.photoUrl,
      department: m.department,
      course: m.course,
      semester: m.semester,
      dateJoined: m.dateJoined,
      membershipExpiry: m.membershipExpiry,
      borrowLimit: m.borrowLimit,
      status: m.status,
      transactions: m.transactions,
      reservations: m.reservations,
      fines: m.fines,
      fineBalance: Math.max(0, fineBalance),
      currentBorrowedBooks: m.transactions.filter(t => t.status === 'ISSUED').length
    };

    res.status(200).json({
      success: true,
      data: memberData
    });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role, phone, address, department, course, semester } = req.body;

    if (!email || !name || !role) {
      return next(new AppError('Email, name and role are required', 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('A user with this email already exists', 400));
    }

    // Default password if not provided
    const pass = password || 'MemberPass123!';
    const hashedPassword = await bcrypt.hash(pass, 10);

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    let borrowLimit = 5;
    if (role === 'FACULTY') borrowLimit = 10;
    else if (role === 'STAFF') borrowLimit = 7;

    const customId = await generateReadableUserId(role);

    const member = await prisma.user.create({
      data: {
        id: customId,
        email,
        password: hashedPassword,
        name,
        role,
        phone,
        address,
        department,
        course,
        semester,
        membershipExpiry: expiry,
        borrowLimit,
        status: 'ACTIVE'
      }
    });

    await logActivity(req.user?.id || null, 'MEMBER_CREATE', { id: member.id, email: member.email }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Member account created successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const member = await prisma.user.findUnique({ where: { id } });
    if (!member) {
      return next(new AppError('Member not found', 404));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        photoUrl: data.photoUrl,
        department: data.department,
        course: data.course,
        semester: data.semester,
        borrowLimit: data.borrowLimit ? Number(data.borrowLimit) : undefined,
        membershipExpiry: data.membershipExpiry ? new Date(data.membershipExpiry) : undefined,
        status: data.status
      }
    });

    await logActivity(req.user?.id || null, 'MEMBER_UPDATE', { id: member.id, email: member.email }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Member details updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const suspendMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const member = await prisma.user.findUnique({ where: { id } });
    if (!member) {
      return next(new AppError('Member not found', 404));
    }

    const newStatus = member.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    await logActivity(req.user?.id || null, `MEMBER_${newStatus === 'ACTIVE' ? 'UNSUSPEND' : 'SUSPEND'}`, { id: member.id }, req.ip);

    res.status(200).json({
      success: true,
      message: `Member status updated to ${newStatus}`
    });
  } catch (error) {
    next(error);
  }
};

export const renewMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const member = await prisma.user.findUnique({ where: { id } });
    if (!member) {
      return next(new AppError('Member not found', 404));
    }

    const currentExpiry = new Date(member.membershipExpiry);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setFullYear(baseDate.getFullYear() + 1);

    await prisma.user.update({
      where: { id },
      data: {
        membershipExpiry: baseDate,
        status: 'ACTIVE' // Reset status to active if it was expired
      }
    });

    await logActivity(req.user?.id || null, 'MEMBER_MEMBERSHIP_RENEW', { id: member.id }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Membership renewed successfully for 1 year'
    });
  } catch (error) {
    next(error);
  }
};
