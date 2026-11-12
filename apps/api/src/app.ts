import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { getConfig } from './config/env';
import { errorHandler, HttpError } from './lib/errors';
import { attachSession, verifyCsrfOrigin } from './middleware/auth';
import { healthRouter } from './modules/health/health.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { categoriesRouter, menuRouter } from './modules/menu/menu.routes';
import { authRouter } from './modules/auth/auth.routes';
import { cartRouter } from './modules/cart/cart.routes';
import { reservationsRouter } from './modules/reservations/reservations.routes';
import { orderingRouter } from './modules/ordering/ordering.routes';
import { contactRouter } from './modules/contact/contact.routes';
import { adminRouter } from './modules/admin/admin.routes';

export function createApp() {
  const config = getConfig();
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const normalized = origin.replace(/\/+$/, '');
        if (config.corsAllowedOrigins.includes(normalized)) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, 'CORS origin is not allowed.', 'CORS_FORBIDDEN'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With', 'X-Ruchiloka-CSRF'],
      maxAge: 600,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      fallthrough: true,
      maxAge: '7d',
    })
  );

  const isTest = config.nodeEnv === 'test';
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 5000 : 400,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 5000 : 45,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests from this network. Please wait a few minutes and try again.',
    },
  });

  app.use('/api', generalLimiter);
  app.use('/api/v1/auth/login', sensitiveLimiter);
  app.use('/api/v1/auth/register', sensitiveLimiter);
  app.use('/api/v1/contact', sensitiveLimiter);
  app.use('/api/v1/reservations', (req, res, next) => {
    if (req.method === 'POST') {
      return sensitiveLimiter(req, res, next);
    }
    return next();
  });

  app.use('/api/v1', verifyCsrfOrigin);
  app.use('/api/v1', attachSession);

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/menu', menuRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/reservations', reservationsRouter);
  app.use('/api/v1/ordering', orderingRouter);
  app.use('/api/v1/contact', contactRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use((_req, _res, next) => {
    next(new HttpError(404, 'API endpoint not found.', 'NOT_FOUND'));
  });

  app.use(errorHandler);

  return app;
}
