import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { BUSINESS_INFO, DEFAULT_OPERATING_WINDOWS } from '@ruchiloka/shared';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed the 4 authoritative Menu Categories (NO fabricated menu items or prices)
  const categories = [
    {
      slug: 'tiffins',
      name: 'Tiffins',
      description: 'Traditional South Indian morning breakfast served 6:30 AM – 11:30 AM IST.',
      serviceWindowKey: 'tiffins',
      displayOrder: 1,
    },
    {
      slug: 'beverages',
      name: 'Tea and Coffee',
      description: 'Freshly brewed filter coffee, espresso classics, and aromatic chai (6:30 AM – 11:00 PM IST).',
      serviceWindowKey: 'beverages',
      displayOrder: 2,
    },
    {
      slug: 'continental',
      name: 'Continental',
      description: 'Warm artisanal sandwiches, pastas, and café plates served 3:00 PM – 11:00 PM IST.',
      serviceWindowKey: 'continental_snacks',
      displayOrder: 3,
    },
    {
      slug: 'snacks',
      name: 'Snacks',
      description: 'Crisp savouries, bakes, and evening bites served 3:00 PM – 11:00 PM IST.',
      serviceWindowKey: 'continental_snacks',
      displayOrder: 4,
    },
  ];

  for (const cat of categories) {
    await prisma.menuCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        serviceWindowKey: cat.serviceWindowKey,
        displayOrder: cat.displayOrder,
      },
      create: cat,
    });
  }

  // 2. Seed singleton Admin Settings with verified Kukatpally business info
  const adminEmailsFromEnv = Array.from(
    new Set(
      [
        BUSINESS_INFO.email,
        ...(process.env.ADMIN_NOTIFICATION_EMAIL ?? '').split(','),
      ]
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  await prisma.adminSetting.upsert({
    where: { key: 'default' },
    update: {},
    create: {
      key: 'default',
      cafeName: BUSINESS_INFO.name,
      cafePhone: BUSINESS_INFO.phone,
      cafeAddress: BUSINESS_INFO.address.full,
      notificationEmails: adminEmailsFromEnv,
      operatingHoursJson: DEFAULT_OPERATING_WINDOWS as unknown as object,
      reservationSlotMinutes: 30,
      maxGuestsPerSlot: 24,
      maxTablesPerSlot: 8,
      autoConfirmReservations: false,
      swiggyRestaurantId: process.env.SWIGGY_RESTAURANT_ID || null,
      swiggyListingUrl: process.env.SWIGGY_LISTING_URL || null,
      zomatoRestaurantId: process.env.ZOMATO_RESTAURANT_ID || null,
      zomatoListingUrl: process.env.ZOMATO_LISTING_URL || null,
    },
  });

  // 3. Seed External Platforms
  await prisma.externalPlatform.upsert({
    where: { code: 'SWIGGY' },
    update: { apiEnabled: process.env.ENABLE_SWIGGY_API_HANDOFF === 'true' },
    create: {
      code: 'SWIGGY',
      displayName: 'Swiggy',
      apiEnabled: process.env.ENABLE_SWIGGY_API_HANDOFF === 'true',
    },
  });

  await prisma.externalPlatform.upsert({
    where: { code: 'ZOMATO' },
    update: { apiEnabled: process.env.ENABLE_ZOMATO_API_HANDOFF === 'true' },
    create: {
      code: 'ZOMATO',
      displayName: 'Zomato',
      apiEnabled: process.env.ENABLE_ZOMATO_API_HANDOFF === 'true',
    },
  });

  // 4. Optional initial Admin account (strictly driven by env vars, never hardcoded password)
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  const seedAdminName = process.env.SEED_ADMIN_NAME?.trim() || 'Ruchiloka Admin';

  if (seedAdminEmail && seedAdminPassword && seedAdminPassword.length >= 8) {
    const passwordHash = await bcrypt.hash(seedAdminPassword, 12);
    await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: { role: UserRole.ADMIN, emailVerified: true },
      create: {
        email: seedAdminEmail,
        name: seedAdminName,
        passwordHash,
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });
    console.log(`Seeded admin account: ${seedAdminEmail}`);
  } else {
    console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set; skipping admin user seed.');
  }

  console.log('Ruchiloka Café baseline database seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
