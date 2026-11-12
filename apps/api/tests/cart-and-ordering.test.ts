import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';
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
import { priceCartSelectionsFromDb } from '../src/modules/cart/cart.service';

const MENU_DOSA_ID = '11111111-1111-4111-8111-111111111111';
const MENU_COFFEE_ID = '22222222-2222-4222-8222-222222222222';
const VARIANT_GHEE_ID = '33333333-3333-4333-8333-333333333333';
const ADDON_PODI_ID = '44444444-4444-4444-8444-444444444444';

describe('Server-side cart pricing & Swiggy/Zomato ordering handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfigCacheForTests();
    applyTestEnvDefaults();
    prismaMock.client.adminSetting.findUnique.mockResolvedValue({
      ...DEFAULT_TEST_SETTINGS,
      swiggyListingUrl: 'https://www.swiggy.com/city/hyderabad/ruchiloka-kukatpally',
      zomatoListingUrl: null,
    });
  });

  it('calculates INR totals strictly from PostgreSQL menu items, variants, and add-ons', async () => {
    prismaMock.client.menuItem.findMany.mockResolvedValueOnce([
      {
        id: MENU_DOSA_ID,
        name: 'Masala Dosa',
        imageUrl: '/images/exp-tiffins.webp',
        priceInr: 110,
        isAvailable: true,
        isVegetarian: true,
        category: { slug: 'tiffins' },
        variants: [{ id: VARIANT_GHEE_ID, name: 'Ghee Roast', priceDeltaInr: 30, isAvailable: true }],
        addons: [{ id: ADDON_PODI_ID, name: 'Gunpowder Podi', priceInr: 20, isAvailable: true }],
      },
      {
        id: MENU_COFFEE_ID,
        name: 'Filter Coffee',
        imageUrl: '/images/exp-coffee-tea.webp',
        priceInr: 60,
        isAvailable: true,
        isVegetarian: true,
        category: { slug: 'beverages' },
        variants: [],
        addons: [],
      },
    ]);

    const priced = await priceCartSelectionsFromDb(
      [
        {
          menuItemId: MENU_DOSA_ID,
          variantId: VARIANT_GHEE_ID,
          addonIds: [ADDON_PODI_ID],
          quantity: 2,
          specialInstructions: 'Crisp please',
        },
        {
          menuItemId: MENU_COFFEE_ID,
          quantity: 1,
        },
      ],
      { failOnUnavailable: true }
    );

    expect(priced.itemCount).toBe(3);
    expect(priced.subtotalInr).toBe(380);
    expect(priced.lines[0].lineTotalInr).toBe(320);
    expect(priced.lines[1].lineTotalInr).toBe(60);
  });

  it('rejects ordering preparation when an item is unavailable in DB', async () => {
    prismaMock.client.menuItem.findMany.mockResolvedValueOnce([
      {
        id: MENU_DOSA_ID,
        name: 'Masala Dosa',
        imageUrl: '/images/exp-tiffins.webp',
        priceInr: 110,
        isAvailable: false,
        isVegetarian: true,
        category: { slug: 'tiffins' },
        variants: [],
        addons: [],
      },
    ]);

    await expect(
      priceCartSelectionsFromDb(
        [{ menuItemId: MENU_DOSA_ID, quantity: 1 }],
        { failOnUnavailable: true }
      )
    ).rejects.toMatchObject({ status: 409, code: 'MENU_ITEM_UNAVAILABLE' });
  });

  it('exposes honest Swiggy/Zomato provider status and persists verified listing fallback handoffs', async () => {
    const app = createApp();

    const statusRes = await invokeApp(app, {
      method: 'GET',
      path: '/api/v1/ordering/providers',
    });
    expect(statusRes.status).toBe(200);
    const swiggy = statusRes.body.data.find((p: { provider: string }) => p.provider === 'SWIGGY');
    const zomato = statusRes.body.data.find((p: { provider: string }) => p.provider === 'ZOMATO');
    expect(swiggy.mode).toBe('VERIFIED_LISTING_FALLBACK');
    expect(swiggy.listingConfigured).toBe(true);
    expect(zomato.mode).toBe('UNCONFIGURED');
    expect(zomato.listingConfigured).toBe(false);

    const rawToken = 'cust-order-token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    prismaMock.client.session.findUnique.mockImplementation(async ({ where }: { where: { tokenHash: string } }) => {
      if (where.tokenHash !== tokenHash) return null;
      return {
        id: 'sess-order',
        expiresAt: new Date(Date.now() + 3600_000),
        user: {
          id: 'user-order-1',
          email: 'diner@example.com',
          name: 'Diner',
          phone: null,
          role: UserRole.CUSTOMER,
          avatarUrl: null,
          emailVerified: true,
          createdAt: new Date(),
        },
      };
    });

    prismaMock.client.menuItem.findMany.mockResolvedValueOnce([
      {
        id: MENU_COFFEE_ID,
        name: 'Filter Coffee',
        imageUrl: '/images/exp-coffee-tea.webp',
        priceInr: 60,
        isAvailable: true,
        isVegetarian: true,
        category: { slug: 'beverages' },
        variants: [],
        addons: [],
      },
    ]);
    prismaMock.client.orderHandoff.create.mockResolvedValueOnce({
      id: 'handoff-1',
      createdAt: new Date('2026-11-11T11:00:00Z'),
    });

    const handoffRes = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/ordering/swiggy/handoff',
      cookies: [`ruchiloka_session=${rawToken}`],
      body: {
        provider: 'SWIGGY',
        items: [{ menuItemId: MENU_COFFEE_ID, quantity: 3 }],
      },
    });

    expect(handoffRes.status).toBe(201);
    expect(handoffRes.body.data.cartTransferred).toBe(false);
    expect(handoffRes.body.data.mode).toBe('VERIFIED_LISTING_FALLBACK');
    expect(handoffRes.body.data.subtotalInr).toBe(180);
    expect(handoffRes.body.data.redirectUrl).toBe(
      'https://www.swiggy.com/city/hyderabad/ruchiloka-kukatpally'
    );
    expect(handoffRes.body.data.orderSummaryText).toContain('Filter Coffee × 3');
  });

  it('returns 400 EMPTY_CART if prepare is called with no items', async () => {
    const app = createApp();
    const res = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/ordering/prepare',
      body: {},
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EMPTY_CART');
  });
});
