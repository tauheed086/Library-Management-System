import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/audit';

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbSettings = await prisma.setting.findMany();
    
    // Format settings as a simple key-value object for frontend ease
    const settingsMap: Record<string, string> = {};
    dbSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settingsData = req.body; // e.g. { fine_rate_student: "2.5", grace_period_days: "5" }
    const staffId = req.user?.id || null;

    if (typeof settingsData !== 'object' || settingsData === null) {
      return next(new AppError('Settings body must be a valid key-value object', 400));
    }

    const updatedKeys = [];

    // Loop keys and upsert
    for (const [key, value] of Object.entries(settingsData)) {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      await prisma.setting.upsert({
        where: { key },
        update: { value: valStr },
        create: { key, value: valStr }
      });
      updatedKeys.push(key);
    }

    await logActivity(staffId, 'SETTINGS_UPDATE', { updatedKeys }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Library settings updated successfully',
      data: settingsData
    });
  } catch (error) {
    next(error);
  }
};
