import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: You do not have access to this resource', 403));
    }

    next();
  };
};
