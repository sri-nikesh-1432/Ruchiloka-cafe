import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sha256Hex } from '../lib/crypto';
import { HttpError } from '../lib/errors';
import { getConfig } from '../config/env';

export const SESSION_COOKIE_NAME = 'ruchiloka_session';

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthenticatedRequestUser | null;
      sessionId?: string;
    }
  }
}

export async function attachSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!rawToken || typeof rawToken !== 'string') {
      req.currentUser = null;
      next();
      return;
    }

    const tokenHash = sha256Hex(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      }
      req.currentUser = null;
      next();
      return;
    }

    req.sessionId = session.id;
    req.currentUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      phone: session.user.phone,
      role: session.user.role,
      avatarUrl: session.user.avatarUrl,
      emailVerified: session.user.emailVerified,
      createdAt: session.user.createdAt,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUser) {
    next(new HttpError(401, 'Authentication is required for this resource.', 'UNAUTHORIZED'));
    return;
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUser) {
    next(new HttpError(401, 'Authentication is required.', 'UNAUTHORIZED'));
    return;
  }
  if (req.currentUser.role !== UserRole.ADMIN) {
    next(new HttpError(403, 'Administrator privileges required.', 'FORBIDDEN'));
    return;
  }
  next();
}

/**
 * Enforces Origin allowlist + custom header CSRF protection on state-changing requests.
 */
export function verifyCsrfOrigin(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const config = getConfig();
  const origin = req.headers.origin;

  if (origin) {
    const normalized = origin.replace(/\/+$/, '');
    if (!config.corsAllowedOrigins.includes(normalized)) {
      next(new HttpError(403, 'Request origin is not permitted.', 'CSRF_ORIGIN_BLOCKED'));
      return;
    }
  }

  next();
}
