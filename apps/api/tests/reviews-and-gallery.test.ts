import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GallerySourcePlatform, ReviewModerationStatus, UserRole } from '@prisma/client';
import { AUTHENTIC_GALLERY_ITEMS } from '@ruchiloka/shared';
import { sha256Hex } from '../src/lib/crypto';
import { SESSION_COOKIE_NAME } from '../src/middleware/auth';
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

import { resetConfigCacheForTests } from '../src/config/env';
import { createApp } from '../src/app';

describe('Customer Website Reviews, Moderation & Authentic Gallery API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfigCacheForTests();
    applyTestEnvDefaults();
    prismaMock.client.adminSetting.findUnique.mockResolvedValue(DEFAULT_TEST_SETTINGS);
  });

  it('creates a submitted website review as PENDING without authentication and sanitizes HTML', async () => {
    const app = createApp();
    let savedData: Record<string, unknown> = {};

    prismaMock.client.websiteReview.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      savedData = data;
      return {
        id: '11111111-1111-4111-8111-111111111111',
        customerName: data.customerName,
        rating: data.rating,
        title: data.title,
        message: data.message,
        photoUrl: data.photoUrl,
        status: ReviewModerationStatus.PENDING,
        adminNote: null,
        moderatedById: null,
        moderatedAt: null,
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-11-12T08:00:00Z'),
        updatedAt: new Date('2026-11-12T08:00:00Z'),
      };
    });

    const res = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/reviews',
      headers: {
        Origin: 'https://ruchiloka.netlify.app',
        'X-Ruchiloka-CSRF': '1',
      },
      body: {
        customerName: '<b>Ananya Rao</b>',
        rating: 5,
        title: '<script>alert(1)</script>Great Pesarattu!',
        message: 'Visited in the morning and enjoyed crispy pesarattu and filter coffee in the courtyard.',
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.review.status).toBe('PENDING');
    expect(savedData.status).toBe(ReviewModerationStatus.PENDING);
    expect(savedData.customerName).toBe('Ananya Rao');
    expect(savedData.title).toBe('alert(1)Great Pesarattu!');
  });

  it('lists ONLY APPROVED reviews publicly and keeps PENDING reviews hidden', async () => {
    const app = createApp();

    prismaMock.client.websiteReview.findMany.mockResolvedValueOnce([
      {
        id: '22222222-2222-4222-8222-222222222222',
        customerName: 'Approved Diner',
        rating: 4,
        title: 'Lovely evening chai',
        message: 'Calm seating and polite team at Kukatpally.',
        photoUrl: null,
        status: ReviewModerationStatus.APPROVED,
        adminNote: null,
        createdAt: new Date('2026-11-12T09:00:00Z'),
        updatedAt: new Date('2026-11-12T09:00:00Z'),
      },
    ]);

    const res = await invokeApp(app, { method: 'GET', path: '/api/v1/reviews' });

    expect(res.status).toBe(200);
    expect(prismaMock.client.websiteReview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: ReviewModerationStatus.APPROVED },
      })
    );
    expect(res.body.data.websiteReviews).toHaveLength(1);
    expect(res.body.data.websiteStats).toEqual({
      approvedCount: 1,
      averageRating: 4,
    });
  });

  it('allows ADMIN to moderate (approve/reject) and delete reviews while blocking unauthenticated access', async () => {
    const app = createApp();
    const unauth = await invokeApp(app, { method: 'GET', path: '/api/v1/admin/reviews' });
    expect(unauth.status).toBe(401);

    const rawToken = 'admin-review-token';
    prismaMock.client.session.findUnique.mockResolvedValue({
      id: 'sess-admin',
      tokenHash: sha256Hex(rawToken),
      expiresAt: new Date(Date.now() + 60_000),
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
    });

    const reviewId = '33333333-3333-4333-8333-333333333333';
    prismaMock.client.websiteReview.findUnique.mockResolvedValue({
      id: reviewId,
      customerName: 'Karthik',
      rating: 5,
      title: null,
      message: 'Amazing courtyard',
      photoUrl: null,
      status: ReviewModerationStatus.PENDING,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.client.websiteReview.update.mockResolvedValue({
      id: reviewId,
      customerName: 'Karthik',
      rating: 5,
      title: null,
      message: 'Amazing courtyard',
      photoUrl: null,
      status: ReviewModerationStatus.APPROVED,
      adminNote: 'Verified guest photo',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const approveRes = await invokeApp(app, {
      method: 'PATCH',
      path: `/api/v1/admin/reviews/${reviewId}`,
      headers: {
        Origin: 'https://ruchiloka.netlify.app',
        'X-Ruchiloka-CSRF': '1',
        Cookie: `${SESSION_COOKIE_NAME}=${rawToken}`,
      },
      body: {
        status: 'APPROVED',
        adminNote: 'Verified guest photo',
      },
    });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('APPROVED');

    const badRes = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/reviews',
      headers: {
        Origin: 'https://ruchiloka.netlify.app',
        'X-Ruchiloka-CSRF': '1',
      },
      body: {
        customerName: 'A',
        rating: 9,
        message: 'short',
      },
    });
    expect(badRes.status).toBe(400);
  });

  it('serves authentic gallery items and filters categories accurately', async () => {
    const app = createApp();
    prismaMock.client.galleryPhoto.count.mockResolvedValue(AUTHENTIC_GALLERY_ITEMS.length);
    prismaMock.client.galleryPhoto.findMany.mockResolvedValue(
      AUTHENTIC_GALLERY_ITEMS.map((item, idx) => ({
        id: `gal-${idx}`,
        ...item,
        sourcePlatform: item.sourcePlatform as GallerySourcePlatform,
        isPublished: true,
        createdAt: new Date('2026-11-12T00:00:00Z'),
        updatedAt: new Date('2026-11-12T00:00:00Z'),
      }))
    );

    const res = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/gallery?category=breakfast',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.photos.length).toBeGreaterThan(0);
    expect(
      res.body.data.photos.every((p: { categorySlug: string }) => p.categorySlug === 'breakfast')
    ).toBe(true);
    expect(res.body.data.categories.length).toBeGreaterThan(0);
  });
});
