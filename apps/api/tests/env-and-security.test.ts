import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTestEnvDefaults, createMockPrisma, DEFAULT_TEST_SETTINGS } from './helpers/mockPrisma';
import { invokeApp } from './helpers/httpInvoke';

const prismaMock = vi.hoisted(() => ({
  client: null as unknown as ReturnType<typeof createMockPrisma>,
}));

vi.mock('../src/lib/prisma', async () => {
  const helper = await import('./helpers/mockPrisma');
  prismaMock.client = helper.createMockPrisma();
  return { prisma: prismaMock.client };
});

import { getConfig, resetConfigCacheForTests } from '../src/config/env';
import { createApp } from '../src/app';

describe('Environment validation, URL configuration, CORS & CSRF security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfigCacheForTests();
    applyTestEnvDefaults();
    prismaMock.client.adminSetting.findUnique.mockResolvedValue(DEFAULT_TEST_SETTINGS);
  });

  it('rejects localhost URLs and weak session secrets when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.BACKEND_URL = 'https://api.ruchiloka.in';
    process.env.SESSION_SECRET = 'super-strong-production-secret-at-least-32-chars';
    resetConfigCacheForTests();

    expect(() => getConfig()).toThrow(/FRONTEND_URL/);

    process.env.FRONTEND_URL = 'https://ruchiloka.netlify.app';
    process.env.CORS_ALLOWED_ORIGINS = 'https://ruchiloka.netlify.app,http://127.0.0.1:3000';
    resetConfigCacheForTests();

    expect(() => getConfig()).toThrow(/CORS_ALLOWED_ORIGINS/);

    process.env.CORS_ALLOWED_ORIGINS = 'https://ruchiloka.netlify.app';
    process.env.SESSION_SECRET = 'too-short';
    resetConfigCacheForTests();

    expect(() => getConfig()).toThrow(/SESSION_SECRET/);
  });

  it('parses comma-separated ADMIN_NOTIFICATION_EMAIL cleanly in lowercase', () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = ' Owner@Ruchiloka.in , manager@ruchiloka.in ';
    resetConfigCacheForTests();

    const cfg = getConfig();
    expect(cfg.resend.adminNotificationEmails).toEqual([
      'owner@ruchiloka.in',
      'manager@ruchiloka.in',
    ]);
  });

  it('allows configured CORS origin and blocks unauthorized origins with 403', async () => {
    const app = createApp();

    const allowedRes = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/settings/public',
      headers: { Origin: 'https://ruchiloka.netlify.app' },
    });
    expect(allowedRes.status).toBe(200);
    expect(allowedRes.headers['access-control-allow-origin']).toBe(
      'https://ruchiloka.netlify.app'
    );
    expect(allowedRes.headers['access-control-allow-credentials']).toBe('true');

    const blockedCors = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/settings/public',
      headers: { Origin: 'https://evil-phish.example' },
    });
    expect(blockedCors.status).toBe(403);

    const blockedCsrf = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/contact',
      headers: { Origin: 'https://evil-phish.example' },
      body: {
        name: 'Attacker',
        email: 'a@b.com',
        subject: 'Hello',
        message: 'Testing unauthorized origin mutation.',
      },
    });
    expect(blockedCsrf.status).toBe(403);
  });
});
