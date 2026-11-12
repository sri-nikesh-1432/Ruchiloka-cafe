/**
 * Centralized Frontend URL & Environment Configuration
 *
 * Rules enforced:
 * - Production builds MUST explicitly define NEXT_PUBLIC_API_BASE_URL (no silent localhost fallback).
 * - Public frontend code NEVER references secret keys or internal backend-only credentials.
 * - All API requests, OAuth initiation URLs, and external links derive from this module.
 */

export type AppEnvironment = 'development' | 'preview' | 'production';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function getAppEnvironment(): AppEnvironment {
  const explicit = process.env.NEXT_PUBLIC_APP_ENV;
  if (explicit === 'production' || explicit === 'preview' || explicit === 'development') {
    return explicit;
  }
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export interface UrlConfigState {
  environment: AppEnvironment;
  apiBaseUrl: string | null;
  appBaseUrl: string | null;
  isConfigured: boolean;
  configurationError: string | null;
}

export function resolveUrlConfig(): UrlConfigState {
  const environment = getAppEnvironment();
  const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const rawAppBase = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (rawApiBase) {
    const cleanApiBase = stripTrailingSlash(rawApiBase);
    if (environment === 'production' && isLocalhostUrl(cleanApiBase)) {
      const msg =
        'Configuration Error: NEXT_PUBLIC_API_BASE_URL points to localhost in a production environment.';
      console.error(`[Ruchiloka URL Config] ${msg}`);
      return {
        environment,
        apiBaseUrl: null,
        appBaseUrl: rawAppBase ? stripTrailingSlash(rawAppBase) : null,
        isConfigured: false,
        configurationError: msg,
      };
    }

    return {
      environment,
      apiBaseUrl: cleanApiBase,
      appBaseUrl: rawAppBase
        ? stripTrailingSlash(rawAppBase)
        : typeof window !== 'undefined'
          ? window.location.origin
          : null,
      isConfigured: true,
      configurationError: null,
    };
  }

  // Only allow explicit localhost fallback when strictly running in local development
  if (environment === 'development') {
    return {
      environment,
      apiBaseUrl: 'http://localhost:4000',
      appBaseUrl:
        rawAppBase && !rawAppBase.includes('undefined')
          ? stripTrailingSlash(rawAppBase)
          : typeof window !== 'undefined'
            ? window.location.origin
            : 'http://localhost:3000',
      isConfigured: true,
      configurationError: null,
    };
  }

  if (typeof window !== 'undefined' && !isLocalhostUrl(window.location.origin)) {
    const sameOrigin = stripTrailingSlash(window.location.origin);
    return {
      environment,
      apiBaseUrl: sameOrigin,
      appBaseUrl: rawAppBase ? stripTrailingSlash(rawAppBase) : sameOrigin,
      isConfigured: true,
      configurationError: null,
    };
  }

  const msg =
    'Backend API base URL (NEXT_PUBLIC_API_BASE_URL) is not configured for this environment.';
  console.error(`[Ruchiloka URL Config] ${msg}`);
  return {
    environment,
    apiBaseUrl: null,
    appBaseUrl:
      rawAppBase ? stripTrailingSlash(rawAppBase) : typeof window !== 'undefined' ? window.location.origin : null,
    isConfigured: false,
    configurationError: msg,
  };
}

export function buildApiV1Url(path: string): string {
  const config = resolveUrlConfig();
  if (!config.apiBaseUrl) {
    throw new Error(
      config.configurationError ??
        'Backend API URL is unavailable. Please configure NEXT_PUBLIC_API_BASE_URL.'
    );
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.apiBaseUrl}/api/v1${normalizedPath}`;
}

export function buildGoogleOAuthStartUrl(redirectAfterLogin?: string): string {
  const url = new URL(buildApiV1Url('/auth/google'));
  if (redirectAfterLogin && redirectAfterLogin.startsWith('/') && !redirectAfterLogin.startsWith('//')) {
    url.searchParams.set('next', redirectAfterLogin);
  }
  return url.toString();
}

export function validateSafeInternalRedirect(target: string | null | undefined, fallback = '/profile'): string {
  if (!target) return fallback;
  if (target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) {
    return target;
  }
  return fallback;
}
