import { vi } from 'vitest';

export function createMockPrisma() {
  const prismaMock = {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prismaMock)),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    menuCategory: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    menuItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    menuItemVariant: {
      deleteMany: vi.fn(),
    },
    menuAddon: {
      deleteMany: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    cartItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    reservationSlot: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
    },
    reservation: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    externalPlatform: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    orderHandoff: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    },
    contactMessage: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    emailLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
    adminSetting: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    websiteReview: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    galleryPhoto: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  };

  return prismaMock;
}

export const DEFAULT_TEST_SETTINGS = {
  id: 'setting-default-id',
  key: 'default',
  cafeName: 'Ruchiloka Café',
  cafePhone: '+91 91216 78449',
  cafeAddress:
    '174, Road Number 25, Vivekananda Nagar, Kukatpally, Hyderabad, Telangana 500072, India.',
  notificationEmails: ['owner@ruchilokacafe.com'],
  operatingHoursJson: [
    {
      key: 'tiffins',
      label: 'Tiffins',
      startTime24: '06:30',
      endTime24: '11:30',
      displayHours: '6:30 AM – 11:30 AM',
      description: 'Traditional South Indian morning breakfast served piping hot.',
    },
    {
      key: 'beverages',
      label: 'Tea and Coffee',
      startTime24: '06:30',
      endTime24: '23:00',
      displayHours: '6:30 AM – 11:00 PM',
      description: 'Freshly brewed filter coffee, espresso classics, and aromatic chai all day.',
    },
    {
      key: 'continental_snacks',
      label: 'Continental and Snacks',
      startTime24: '15:00',
      endTime24: '23:00',
      displayHours: '3:00 PM – 11:00 PM',
      description: 'Warm sandwiches, pastas, flaky bakes, and evening café bites.',
    },
  ],
  reservationSlotMinutes: 30,
  maxGuestsPerSlot: 24,
  maxTablesPerSlot: 8,
  autoConfirmReservations: false,
  swiggyRestaurantId: null,
  swiggyListingUrl: null,
  zomatoRestaurantId: null,
  zomatoListingUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  updatedAt: new Date('2026-11-11T00:00:00Z'),
};

export function applyTestEnvDefaults() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ruchiloka_test';
  process.env.FRONTEND_URL = 'https://ruchiloka.netlify.app';
  process.env.BACKEND_URL = 'https://api.ruchiloka.in';
  process.env.CORS_ALLOWED_ORIGINS = 'https://ruchiloka.netlify.app';
  process.env.SESSION_SECRET = 'test-session-secret-must-be-at-least-32-chars-long';
  delete process.env.ADMIN_NOTIFICATION_EMAIL;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REDIRECT_URI;
  delete process.env.ENABLE_SWIGGY_API_HANDOFF;
  delete process.env.ENABLE_ZOMATO_API_HANDOFF;
  delete process.env.SWIGGY_LISTING_URL;
  delete process.env.ZOMATO_LISTING_URL;
}
