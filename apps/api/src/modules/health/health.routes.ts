import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/errors';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    let database = 'ok';
    let status = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'unreachable';
      status = 'degraded';
    }

    const code = status === 'ok' ? 200 : 503;
    res.status(code).json({
      success: status === 'ok',
      data: {
        status,
        database,
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
      },
    });
  })
);
