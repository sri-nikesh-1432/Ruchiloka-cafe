import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { applyTestEnvDefaults, createMockPrisma } from './helpers/mockPrisma';
import { invokeApp } from './helpers/httpInvoke';

const prismaMock = vi.hoisted(() => ({
  client: null as unknown as ReturnType<typeof createMockPrisma>,
}));

vi.mock('../src/lib/prisma', async () => {
  const helper = await import('./helpers/mockPrisma');
  prismaMock.client = helper.createMockPrisma();
  return { prisma: prismaMock.client };
});

import { resetConfigCacheForTests } from '../src/config/env';
import { createApp } from '../src/app';

function makeTokenHash(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

describe('Authentication, OAuth CSRF state, and Role-Based Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfigCacheForTests();
    applyTestEnvDefaults();
  });

  it('registers a customer without allowing role escalation, hashes password, and sets HttpOnly session cookie', async () => {
    const app = createApp();
    prismaMock.client.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.client.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'user-1',
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      role: data.role,
      avatarUrl: null,
      emailVerified: false,
      createdAt: new Date('2026-11-11T10:00:00Z'),
    }));
    prismaMock.client.session.create.mockResolvedValueOnce({ id: 'sess-1' });

    const res = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        name: 'Karthik Sharma',
        email: 'KARTHIK@example.com',
        phone: '+91 9876543210',
        password: 'StrongPassword123',
        role: 'ADMIN',
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.user.email).toBe('karthik@example.com');
    const cookies = res.headers['set-cookie'];
    const cookieStr = Array.isArray(cookies) ? cookies[0] : String(cookies ?? '');
    expect(cookieStr).toContain('ruchiloka_session=');
    expect(cookieStr).toContain('HttpOnly');

    const createCall = prismaMock.client.user.create.mock.calls[0][0];
    expect(createCall.data.role).toBe(UserRole.CUSTOMER);
    expect(createCall.data.passwordHash).not.toBe('StrongPassword123');
    expect(await bcrypt.compare('StrongPassword123', createCall.data.passwordHash)).toBe(true);
  });

  it('rejects duplicate registration with 409 and rejects bad login password with 401', async () => {
    const app = createApp();

    prismaMock.client.user.findUnique.mockResolvedValueOnce({
      id: 'existing-1',
      email: 'karthik@example.com',
    });

    const dupRes = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        name: 'Karthik Sharma',
        email: 'karthik@example.com',
        password: 'StrongPassword123',
      },
    });
    expect(dupRes.status).toBe(409);

    const realHash = await bcrypt.hash('CorrectPassword99', 10);
    prismaMock.client.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
      email: 'guest@example.com',
      name: 'Guest',
      phone: null,
      role: UserRole.CUSTOMER,
      passwordHash: realHash,
      avatarUrl: null,
      emailVerified: true,
      createdAt: new Date(),
    });

    const badLogin = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: {
        email: 'guest@example.com',
        password: 'WrongPassword',
      },
    });
    expect(badLogin.status).toBe(401);
  });

  it('enforces RBAC: blocks unauthenticated (401) and CUSTOMER (403), allows ADMIN (200) on /admin routes', async () => {
    const app = createApp();

    const unauthRes = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/admin/dashboard',
    });
    expect(unauthRes.status).toBe(401);

    const customerToken = 'cust-raw-token';
    prismaMock.client.session.findUnique.mockImplementation(async ({ where }: { where: { tokenHash: string } }) => {
      if (where.tokenHash === makeTokenHash(customerToken)) {
        return {
          id: 'sess-cust',
          expiresAt: new Date(Date.now() + 3600_000),
          user: {
            id: 'cust-1',
            email: 'customer@example.com',
            name: 'Customer User',
            phone: null,
            role: UserRole.CUSTOMER,
            avatarUrl: null,
            emailVerified: true,
            createdAt: new Date(),
          },
        };
      }
      if (where.tokenHash === makeTokenHash('admin-raw-token')) {
        return {
          id: 'sess-admin',
          expiresAt: new Date(Date.now() + 3600_000),
          user: {
            id: 'admin-1',
            email: 'owner@ruchilokacafe.com',
            name: 'Owner',
            phone: null,
            role: UserRole.ADMIN,
            avatarUrl: null,
            emailVerified: true,
            createdAt: new Date(),
          },
        };
      }
      return null;
    });

    const forbiddenDash = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/admin/dashboard',
      cookies: [`ruchiloka_session=${customerToken}`],
    });
    expect(forbiddenDash.status).toBe(403);

    const forbiddenMenu = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/admin/menu',
      cookies: [`ruchiloka_session=${customerToken}`],
      body: { name: 'Injected Dish' },
    });
    expect(forbiddenMenu.status).toBe(403);

    const adminRes = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/admin/dashboard',
      cookies: ['ruchiloka_session=admin-raw-token'],
    });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.metrics).toBeDefined();
  });

  it('rejects Google OAuth callback when signed state cookie does not match query state', async () => {
    process.env.GOOGLE_CLIENT_ID = 'fake-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'fake-client-secret';
    resetConfigCacheForTests();

    const app = createApp();
    const res = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/auth/google/callback?code=auth-code&state=forged-state',
      cookies: ['ruchiloka_oauth_state=different-state.badsig'],
    });

    expect(res.status).toBe(302);
    expect(String(res.headers.location)).toContain('https://ruchiloka.netlify.app/auth/callback');
    expect(String(res.headers.location)).toContain('error=');
  });
});
