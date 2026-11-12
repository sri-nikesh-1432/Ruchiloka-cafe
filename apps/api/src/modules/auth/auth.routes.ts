import { Router } from 'express';
import { LoginSchema, RegisterSchema, UpdateProfileSchema } from '@ruchiloka/shared';
import { asyncHandler } from '../../lib/errors';
import { validateBody } from '../../middleware/validate';
import { requireAuth, SESSION_COOKIE_NAME } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import { getConfig } from '../../config/env';
import {
  createGoogleAuthInitiation,
  createUserSession,
  getSessionCookieOptions,
  handleGoogleOAuthCallback,
  loginWithEmail,
  registerWithEmail,
  sanitizeInternalNextPath,
  toAuthUserDto,
  verifyEmailToken,
} from './auth.service';

const OAUTH_STATE_COOKIE = 'ruchiloka_oauth_state';

export const authRouter = Router();

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.currentUser ? toAuthUserDto(req.currentUser) : null,
      },
    });
  })
);

authRouter.post(
  '/register',
  validateBody(RegisterSchema),
  asyncHandler(async (req, res) => {
    const { user, verificationEmailSent } = await registerWithEmail(req.body);
    const { rawToken } = await createUserSession({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.cookie(SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions());
    res.status(201).json({
      success: true,
      data: { user, verificationEmailSent },
    });
  })
);

authRouter.post(
  '/login',
  validateBody(LoginSchema),
  asyncHandler(async (req, res) => {
    const user = await loginWithEmail(req.body);
    const { rawToken } = await createUserSession({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.cookie(SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions());
    res.json({
      success: true,
      data: { user },
    });
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    if (req.sessionId) {
      await prisma.session.delete({ where: { id: req.sessionId } }).catch(() => undefined);
    }
    const cookieOpts = getSessionCookieOptions();
    res.clearCookie(SESSION_COOKIE_NAME, {
      path: cookieOpts.path,
      domain: cookieOpts.domain,
      httpOnly: true,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
    });
    res.json({ success: true, data: { success: true } });
  })
);

authRouter.patch(
  '/profile',
  requireAuth,
  validateBody(UpdateProfileSchema),
  asyncHandler(async (req, res) => {
    const updated = await prisma.user.update({
      where: { id: req.currentUser!.id },
      data: {
        name: req.body.name,
        phone: req.body.phone || null,
      },
    });
    res.json({ success: true, data: { user: toAuthUserDto(updated) } });
  })
);

authRouter.get(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const config = getConfig();
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const ok = await verifyEmailToken(token);
    res.redirect(`${config.frontendUrl}/profile?verified=${ok ? '1' : '0'}`);
  })
);

authRouter.get(
  '/google',
  asyncHandler(async (req, res) => {
    const config = getConfig();
    const nextPath = sanitizeInternalNextPath(req.query.next);
    const { authUrl, signedStateCookie } = createGoogleAuthInitiation(nextPath);

    res.cookie(OAUTH_STATE_COOKIE, signedStateCookie, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(authUrl);
  })
);

authRouter.get(
  '/google/callback',
  asyncHandler(async (req, res) => {
    const config = getConfig();
    const errorParam = typeof req.query.error === 'string' ? req.query.error : null;

    if (errorParam) {
      res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
      res.redirect(
        `${config.frontendUrl}/auth/callback?status=error&error=${encodeURIComponent(errorParam)}`
      );
      return;
    }

    try {
      const code = typeof req.query.code === 'string' ? req.query.code : undefined;
      const state = typeof req.query.state === 'string' ? req.query.state : undefined;
      const signedStateCookie = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;

      const { user, nextPath } = await handleGoogleOAuthCallback({
        code,
        state,
        signedStateCookie,
      });

      const { rawToken } = await createUserSession({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
      res.cookie(SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions());
      res.redirect(
        `${config.frontendUrl}/auth/callback?status=success&next=${encodeURIComponent(nextPath)}`
      );
    } catch (err) {
      res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
      console.error('[Google OAuth Callback Error]', err);
      res.redirect(`${config.frontendUrl}/auth/callback?status=error&error=oauth_failed`);
    }
  })
);
