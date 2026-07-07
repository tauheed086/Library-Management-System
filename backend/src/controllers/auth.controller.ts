import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_lms_system_2026_enterprise';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role, phone, address, department, course, semester } = req.body;

    if (!email || !password || !name) {
      return next(new AppError('Email, password, and name are required', 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Set expiry to 1 year from now
    const membershipExpiry = new Date();
    membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1);

    // Determine borrow limit based on role
    let borrowLimit = 5;
    if (role === 'FACULTY') borrowLimit = 10;
    else if (role === 'SUPER_ADMIN' || role === 'LIBRARIAN') borrowLimit = 100;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'STUDENT',
        phone,
        address,
        department,
        course,
        semester,
        membershipExpiry,
        borrowLimit,
        status: 'ACTIVE'
      }
    });

    await logActivity(user.id, 'USER_REGISTER', { email: user.email, role: user.role }, req.ip);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.status !== 'ACTIVE') {
      return next(new AppError(`User account is ${user.status.toLowerCase()}`, 403));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    await logActivity(user.id, 'USER_LOGIN', { email: user.email }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photoUrl: user.photoUrl,
        borrowLimit: user.borrowLimit,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        createdAt: true
      }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError('Current and new passwords are required', 400));
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    await logActivity(user.id, 'PASSWORD_CHANGE', { email: user.email }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 for security reasons to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email (simulated)'
      });
      return;
    }

    // Mock reset token creation
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, action: 'RESET_PASSWORD' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await logActivity(user.id, 'PASSWORD_FORGOT_REQUEST', { email: user.email }, req.ip);

    // Normally send email here. We return the token for testing convenience in frontend mock flow.
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email (simulated)',
      resetToken // Returned for development/demo ease
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return next(new AppError('Token and new password are required', 400));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next(new AppError('Invalid or expired password reset token', 400));
    }

    if (decoded.action !== 'RESET_PASSWORD') {
      return next(new AppError('Invalid token usage', 400));
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    await logActivity(user.id, 'PASSWORD_RESET', { email: user.email }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};
