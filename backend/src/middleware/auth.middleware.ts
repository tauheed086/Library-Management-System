import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_lms_system_2026_enterprise';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication credentials not provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};
