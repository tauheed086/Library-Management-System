import { prisma } from './db';

export const logActivity = async (
  userId: string | null,
  action: string,
  details: any,
  ipAddress?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress: ipAddress || null
      }
    });
  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
};
