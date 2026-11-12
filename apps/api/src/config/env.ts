import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  NETLIFY_DB_URL: z.string().min(1).optional(),
  NETLIFY: z.string().optional(),
  URL: z.string().url().optional(),
  DEPLOY_PRIME_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  BACKEND_URL: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  SESSION_SECRET: z
    .string()
    .min(16, 'SESSION_SECRET must be at least 16 characters (32+ recommended for production)')
    .optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(60).default(14),
  COOKIE_DOMAIN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  POSTMARK_FROM_EMAIL: z.string().optional(),
  POSTMARK_MESSAGE_STREAM: z.string().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().optional(),
  ENABLE_SWIGGY_API_HANDOFF: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  ENABLE_ZOMATO_API_HANDOFF: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  SWIGGY_RESTAURANT_ID: z.string().optional(),
  SWIGGY_LISTING_URL: z.string().optional(),
  SWIGGY_PARTNER_CLIENT_ID: z.string().optional(),
  SWIGGY_PARTNER_CLIENT_SECRET: z.string().optional(),
  ZOMATO_RESTAURANT_ID: z.string().optional(),
  ZOMATO_LISTING_URL: z.string().optional(),
  ZOMATO_PARTNER_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

function isLocalhost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  frontendUrl: string;
  backendUrl: string;
  corsAllowedOrigins: string[];
  sessionSecret: string;
  sessionTtlDays: number;
  cookieDomain?: string;
  googleOAuth: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  };
  resend: {
    enabled: boolean;
    apiKey?: string;
    fromEmail?: string;
    adminNotificationEmails: string[];
  };
  postmark: {
    enabled: boolean;
    serverToken?: string;
    fromEmail?: string;
    messageStream: string;
  };
  ordering: {
    enableSwiggyApiHandoff: boolean;
    enableZomatoApiHandoff: boolean;
    swiggyRestaurantId?: string;
    swiggyListingUrl?: string;
    swiggyClientId?: string;
    swiggyClientSecret?: string;
    zomatoRestaurantId?: string;
    zomatoListingUrl?: string;
    zomatoApiKey?: string;
  };
  cloudinary: {
    enabled: boolean;
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
  };
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid backend environment configuration: ${formatted}`);
  }

  const raw = parsed.data;
  const isProd = raw.NODE_ENV === 'production';

  const resolvedDatabaseUrl = raw.DATABASE_URL?.trim() || raw.NETLIFY_DB_URL?.trim();
  if (!resolvedDatabaseUrl) {
    throw new Error(
      'Invalid backend environment configuration: DATABASE_URL (or NETLIFY_DB_URL) is required.'
    );
  }

  const netlifyOrigin =
    raw.NETLIFY === 'true'
      ? raw.URL && !isLocalhost(raw.URL)
        ? raw.URL
        : raw.DEPLOY_PRIME_URL && !isLocalhost(raw.DEPLOY_PRIME_URL)
          ? raw.DEPLOY_PRIME_URL
          : undefined
      : undefined;

  const effectiveFrontendUrl = raw.FRONTEND_URL ?? netlifyOrigin;
  const effectiveBackendUrl = raw.BACKEND_URL ?? netlifyOrigin;

  if (isProd) {
    if (!effectiveFrontendUrl || isLocalhost(effectiveFrontendUrl)) {
      throw new Error('FRONTEND_URL must be explicitly set to a non-localhost origin in production.');
    }
    if (!effectiveBackendUrl || isLocalhost(effectiveBackendUrl)) {
      throw new Error('BACKEND_URL must be explicitly set to a non-localhost origin in production.');
    }
    if (!raw.SESSION_SECRET || raw.SESSION_SECRET.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters in production.');
    }
  }

  const frontendUrl = (effectiveFrontendUrl ?? 'http://localhost:3000').replace(/\/+$/, '');
  const backendUrl = (effectiveBackendUrl ?? `http://localhost:${raw.PORT}`).replace(/\/+$/, '');

  const rawCors = (raw.CORS_ALLOWED_ORIGINS ?? frontendUrl)
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (isProd && rawCors.some(isLocalhost)) {
    throw new Error('CORS_ALLOWED_ORIGINS cannot contain localhost in production.');
  }

  const adminNotificationEmails = (raw.ADMIN_NOTIFICATION_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const googleRedirectUri =
    raw.GOOGLE_REDIRECT_URI ?? `${backendUrl}/api/v1/auth/google/callback`;

  if (isProd && raw.GOOGLE_CLIENT_ID && isLocalhost(googleRedirectUri)) {
    throw new Error('GOOGLE_REDIRECT_URI cannot point to localhost in production.');
  }

  const googleEnabled = Boolean(raw.GOOGLE_CLIENT_ID && raw.GOOGLE_CLIENT_SECRET);
  const resendEnabled = Boolean(raw.RESEND_API_KEY && raw.RESEND_FROM_EMAIL);
  const postmarkToken = raw.POSTMARK_SERVER_TOKEN?.trim() || undefined;
  const postmarkEnabled = Boolean(postmarkToken);
  const postmarkFromEmail =
    raw.POSTMARK_FROM_EMAIL?.trim() || 'Ruchiloka Café <ruchiloka.in@gmail.com>';
  const postmarkMessageStream = raw.POSTMARK_MESSAGE_STREAM?.trim() || 'outbound';
  const cloudinaryEnabled = Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET
  );

  cachedConfig = {
    nodeEnv: raw.NODE_ENV,
    port: raw.PORT,
    databaseUrl: resolvedDatabaseUrl,
    frontendUrl,
    backendUrl,
    corsAllowedOrigins: Array.from(new Set(rawCors)),
    sessionSecret:
      raw.SESSION_SECRET ?? 'dev-only-insecure-session-secret-change-in-prod-1234',
    sessionTtlDays: raw.SESSION_TTL_DAYS,
    cookieDomain: raw.COOKIE_DOMAIN || undefined,
    googleOAuth: {
      enabled: googleEnabled,
      clientId: raw.GOOGLE_CLIENT_ID,
      clientSecret: raw.GOOGLE_CLIENT_SECRET,
      redirectUri: googleRedirectUri,
    },
    resend: {
      enabled: resendEnabled,
      apiKey: raw.RESEND_API_KEY,
      fromEmail: raw.RESEND_FROM_EMAIL,
      adminNotificationEmails,
    },
    postmark: {
      enabled: postmarkEnabled,
      serverToken: postmarkToken,
      fromEmail: postmarkFromEmail,
      messageStream: postmarkMessageStream,
    },
    ordering: {
      enableSwiggyApiHandoff: raw.ENABLE_SWIGGY_API_HANDOFF,
      enableZomatoApiHandoff: raw.ENABLE_ZOMATO_API_HANDOFF,
      swiggyRestaurantId: raw.SWIGGY_RESTAURANT_ID || undefined,
      swiggyListingUrl: raw.SWIGGY_LISTING_URL || undefined,
      swiggyClientId: raw.SWIGGY_PARTNER_CLIENT_ID || undefined,
      swiggyClientSecret: raw.SWIGGY_PARTNER_CLIENT_SECRET || undefined,
      zomatoRestaurantId: raw.ZOMATO_RESTAURANT_ID || undefined,
      zomatoListingUrl: raw.ZOMATO_LISTING_URL || undefined,
      zomatoApiKey: raw.ZOMATO_PARTNER_API_KEY || undefined,
    },
    cloudinary: {
      enabled: cloudinaryEnabled,
      cloudName: raw.CLOUDINARY_CLOUD_NAME,
      apiKey: raw.CLOUDINARY_API_KEY,
      apiSecret: raw.CLOUDINARY_API_SECRET,
    },
  };

  return cachedConfig;
}

export function resetConfigCacheForTests() {
  cachedConfig = null;
}
