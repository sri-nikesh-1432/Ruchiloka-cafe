import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import serverless from 'serverless-http';
import { getConfig, resetConfigCacheForTests } from '../src/config/env';
import { normalizeNetlifyEvent, normalizeServerlessPath } from '../src/lib/serverless';

const ORIGINAL_ENV = { ...process.env };

function createMockEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://ruchiloka.netlify.app/api/v1/health',
    rawQuery: '',
    path: '/.netlify/functions/api/v1/health',
    httpMethod: 'GET',
    headers: {
      host: 'ruchiloka.netlify.app',
      'x-nf-client-connection-ip': '203.0.113.10',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
    ...overrides,
  };
}

describe('Serverless path normalization and Netlify runtime config', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetConfigCacheForTests();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetConfigCacheForTests();
    vi.restoreAllMocks();
  });

  it('normalizes rewritten Netlify function paths, direct API paths, and uploads paths', () => {
    expect(normalizeServerlessPath('/.netlify/functions/api/v1/health')).toBe('/api/v1/health');
    expect(normalizeServerlessPath('/.netlify/functions/api/api/v1/health')).toBe('/api/v1/health');
    expect(normalizeServerlessPath('/api/v1/settings/public')).toBe('/api/v1/settings/public');
    expect(normalizeServerlessPath('/.netlify/functions/api/uploads/dish.jpg')).toBe('/uploads/dish.jpg');
    expect(normalizeServerlessPath('/uploads/dish.jpg')).toBe('/uploads/dish.jpg');
    expect(normalizeServerlessPath('/.netlify/functions/api')).toBe('/');
    expect(normalizeServerlessPath('/.netlify/functions/api/')).toBe('/');
  });

  it('normalizes HandlerEvent for serverless-http with non-null body and sourceIp context', () => {
    const normalized = normalizeNetlifyEvent(createMockEvent(), {
      awsRequestId: 'req-abc-123',
    } as HandlerContext);

    expect(normalized.path).toBe('/api/v1/health');
    expect(normalized.body).toBe('');
    expect(normalized.requestContext.requestId).toBe('req-abc-123');
    expect(normalized.requestContext.identity.sourceIp).toBe('203.0.113.10');
  });

  it('accepts NETLIFY_DB_URL and Netlify production URL fallbacks safely', () => {
    delete process.env.DATABASE_URL;
    delete process.env.FRONTEND_URL;
    delete process.env.BACKEND_URL;
    process.env.NODE_ENV = 'production';
    process.env.NETLIFY_DB_URL = 'postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require';
    process.env.NETLIFY = 'true';
    process.env.URL = 'https://ruchiloka.netlify.app';
    process.env.SESSION_SECRET = 'a-very-secure-production-session-secret-of-at-least-32-chars';

    const cfg = getConfig();
    expect(cfg.databaseUrl).toBe('postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require');
    expect(cfg.frontendUrl).toBe('https://ruchiloka.netlify.app');
    expect(cfg.backendUrl).toBe('https://ruchiloka.netlify.app');
    expect(cfg.corsAllowedOrigins).toContain('https://ruchiloka.netlify.app');
  });

  it('rejects localhost URLs even when NETLIFY=true in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NETLIFY_DB_URL = 'postgresql://user:pass@ep-example.neon.tech/neondb';
    process.env.NETLIFY = 'true';
    process.env.URL = 'https://ruchiloka.netlify.app';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.SESSION_SECRET = 'a-very-secure-production-session-secret-of-at-least-32-chars';

    expect(() => getConfig()).toThrow(/FRONTEND_URL/);
  });

  it('executes createApp() through serverless-http and returns JSON 404 on unknown API routes', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
    process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters-long';

    const { createApp } = await import('../src/app');
    const wrapped = serverless(createApp());
    const normalized = normalizeNetlifyEvent(
      createMockEvent({ path: '/.netlify/functions/api/v1/does-not-exist' })
    );

    const res = (await wrapped(normalized, {} as HandlerContext)) as {
      statusCode: number;
      body?: string;
    };

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body ?? '{}')).toMatchObject({
      success: false,
      code: 'NOT_FOUND',
    });
  }, 15000);
});
