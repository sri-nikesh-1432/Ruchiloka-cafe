import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { getConfig } from '../../config/env';
import { HttpError } from '../../lib/errors';
import {
  generateOpaqueToken,
  sha256Hex,
  signHmacPayload,
  verifyHmacPayload,
} from '../../lib/crypto';
import { dispatchVerificationEmail } from '../email/email.service';

export function toAuthUserDto(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

export function getSessionCookieOptions() {
  const config = getConfig();
  const isProd = config.nodeEnv === 'production';
  const isCrossOrigin =
    isProd && new URL(config.frontendUrl).origin !== new URL(config.backendUrl).origin;

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isCrossOrigin ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: config.sessionTtlDays * 24 * 60 * 60 * 1000,
    ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
  };
}

export async function createUserSession(params: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const config = getConfig();
  const rawToken = generateOpaqueToken(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  return { rawToken, expiresAt };
}

export async function registerWithEmail(params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    throw new HttpError(
      409,
      'An account with this email already exists. Please sign in instead.',
      'EMAIL_ALREADY_REGISTERED'
    );
  }

  const passwordHash = await bcrypt.hash(params.password, 12);
  const rawVerificationToken = generateOpaqueToken(24);
  const verificationTokenHash = sha256Hex(rawVerificationToken);
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      name: params.name,
      email: params.email,
      phone: params.phone || null,
      passwordHash,
      role: UserRole.CUSTOMER,
      emailVerified: false,
      verificationTokenHash,
      verificationExpiresAt,
    },
  });

  const emailResult = await dispatchVerificationEmail({
    name: user.name,
    email: user.email,
    rawToken: rawVerificationToken,
  });

  return {
    user: toAuthUserDto(user),
    verificationEmailSent: emailResult.status === 'SENT',
  };
}

export async function loginWithEmail(params: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: params.email } });
  if (!user) {
    throw new HttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }
  if (!user.passwordHash) {
    throw new HttpError(
      400,
      'This account uses Google Sign-In. Please click "Continue with Google".',
      'OAUTH_ACCOUNT_ONLY'
    );
  }
  const ok = await bcrypt.compare(params.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }
  return toAuthUserDto(user);
}

export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const tokenHash = sha256Hex(rawToken);
  const user = await prisma.user.findFirst({
    where: {
      verificationTokenHash: tokenHash,
      verificationExpiresAt: { gt: new Date() },
    },
  });
  if (!user) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationTokenHash: null,
      verificationExpiresAt: null,
    },
  });
  return true;
}

interface OAuthStatePayload {
  state: string;
  next: string;
  exp: number;
}

export function sanitizeInternalNextPath(next: unknown): string {
  if (typeof next !== 'string') return '/profile';
  if (next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) {
    return next;
  }
  return '/profile';
}

export function createGoogleAuthInitiation(nextPath?: string) {
  const config = getConfig();
  if (
    !config.googleOAuth.enabled ||
    !config.googleOAuth.clientId ||
    !config.googleOAuth.clientSecret ||
    !config.googleOAuth.redirectUri
  ) {
    throw new HttpError(
      503,
      'Google Sign-In is not configured on the server yet.',
      'GOOGLE_OAUTH_UNCONFIGURED'
    );
  }

  const client = new OAuth2Client(
    config.googleOAuth.clientId,
    config.googleOAuth.clientSecret,
    config.googleOAuth.redirectUri
  );

  const state = generateOpaqueToken(24);
  const payload: OAuthStatePayload = {
    state,
    next: sanitizeInternalNextPath(nextPath),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const signedStateCookie = signHmacPayload(payload, config.sessionSecret);

  const authUrl = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });

  return { authUrl, signedStateCookie };
}

export async function handleGoogleOAuthCallback(params: {
  code?: string;
  state?: string;
  signedStateCookie?: string;
}) {
  const config = getConfig();
  if (
    !config.googleOAuth.enabled ||
    !config.googleOAuth.clientId ||
    !config.googleOAuth.clientSecret ||
    !config.googleOAuth.redirectUri
  ) {
    throw new HttpError(503, 'Google Sign-In is not configured.', 'GOOGLE_OAUTH_UNCONFIGURED');
  }

  if (!params.code || !params.state || !params.signedStateCookie) {
    throw new HttpError(400, 'Missing Google OAuth authorization parameters.', 'OAUTH_INVALID_REQUEST');
  }

  const verifiedState = verifyHmacPayload<OAuthStatePayload>(
    params.signedStateCookie,
    config.sessionSecret
  );

  if (
    !verifiedState ||
    verifiedState.exp < Date.now() ||
    verifiedState.state !== params.state
  ) {
    throw new HttpError(400, 'Invalid or expired OAuth state parameter.', 'OAUTH_STATE_MISMATCH');
  }

  const client = new OAuth2Client(
    config.googleOAuth.clientId,
    config.googleOAuth.clientSecret,
    config.googleOAuth.redirectUri
  );

  const { tokens } = await client.getToken(params.code);
  if (!tokens.id_token) {
    throw new HttpError(400, 'Google did not return an ID token.', 'OAUTH_MISSING_ID_TOKEN');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.googleOAuth.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new HttpError(400, 'Unable to read verified email from Google.', 'OAUTH_MISSING_EMAIL');
  }

  if (!payload.email_verified) {
    throw new HttpError(
      403,
      'Your Google email address must be verified before signing in.',
      'GOOGLE_EMAIL_UNVERIFIED'
    );
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  const displayName = payload.name?.trim() || normalizedEmail.split('@')[0];

  const user = await prisma.$transaction(async (tx) => {
    const existingAccount = await tx.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: payload.sub,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      return tx.user.update({
        where: { id: existingAccount.userId },
        data: {
          emailVerified: true,
          avatarUrl: existingAccount.user.avatarUrl ?? payload.picture ?? null,
        },
      });
    }

    const existingUser = await tx.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      await tx.account.create({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerAccountId: payload.sub,
        },
      });
      return tx.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: true,
          avatarUrl: existingUser.avatarUrl ?? payload.picture ?? null,
        },
      });
    }

    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        name: displayName,
        role: UserRole.CUSTOMER,
        emailVerified: true,
        avatarUrl: payload.picture ?? null,
      },
    });

    await tx.account.create({
      data: {
        userId: created.id,
        provider: 'google',
        providerAccountId: payload.sub,
      },
    });

    return created;
  });

  return {
    user: toAuthUserDto(user),
    nextPath: sanitizeInternalNextPath(verifiedState.next),
  };
}
