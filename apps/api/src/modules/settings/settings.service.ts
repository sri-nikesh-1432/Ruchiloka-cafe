import {
  BUSINESS_INFO,
  DEFAULT_OPERATING_WINDOWS,
  type AdminSettingsDto,
  type OperatingWindow,
  type PublicSiteSettingsDto,
} from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { getConfig } from '../../config/env';

function parseOperatingHours(raw: unknown): OperatingWindow[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw as OperatingWindow[];
  }
  return DEFAULT_OPERATING_WINDOWS;
}

export async function getOrCreateSettingsRecord() {
  const existing = await prisma.adminSetting.findUnique({ where: { key: 'default' } });
  if (existing) return existing;

  const config = getConfig();
  const defaultNotificationEmails = Array.from(
    new Set([BUSINESS_INFO.email, ...config.resend.adminNotificationEmails].map((e) => e.trim().toLowerCase()).filter(Boolean))
  );
  return prisma.adminSetting.create({
    data: {
      key: 'default',
      cafeName: BUSINESS_INFO.name,
      cafePhone: BUSINESS_INFO.phone,
      cafeAddress: BUSINESS_INFO.address.full,
      notificationEmails: defaultNotificationEmails,
      operatingHoursJson: DEFAULT_OPERATING_WINDOWS as unknown as object,
      reservationSlotMinutes: 30,
      maxGuestsPerSlot: 24,
      maxTablesPerSlot: 8,
      autoConfirmReservations: false,
      swiggyRestaurantId: config.ordering.swiggyRestaurantId ?? null,
      swiggyListingUrl: config.ordering.swiggyListingUrl ?? null,
      zomatoRestaurantId: config.ordering.zomatoRestaurantId ?? null,
      zomatoListingUrl: config.ordering.zomatoListingUrl ?? null,
    },
  });
}

export async function getPublicSettings(): Promise<PublicSiteSettingsDto> {
  const record = await getOrCreateSettingsRecord();
  const config = getConfig();

  return {
    cafeName: record.cafeName,
    cafeAddress: record.cafeAddress,
    cafePhone: record.cafePhone,
    operatingHours: parseOperatingHours(record.operatingHoursJson),
    reservationSlotMinutes: record.reservationSlotMinutes,
    maxGuestsPerSlot: record.maxGuestsPerSlot,
    instagramUrl: record.instagramUrl,
    facebookUrl: record.facebookUrl,
    swiggyListingUrl: record.swiggyListingUrl ?? config.ordering.swiggyListingUrl ?? null,
    zomatoListingUrl: record.zomatoListingUrl ?? config.ordering.zomatoListingUrl ?? null,
  };
}

export async function getAdminSettings(): Promise<AdminSettingsDto> {
  const record = await getOrCreateSettingsRecord();
  const config = getConfig();
  const publicView = await getPublicSettings();

  const mergedEmails = Array.from(
    new Set([
      ...record.notificationEmails.map((e) => e.trim().toLowerCase()),
      ...config.resend.adminNotificationEmails,
    ])
  ).filter(Boolean);

  return {
    ...publicView,
    notificationEmails: mergedEmails,
    maxTablesPerSlot: record.maxTablesPerSlot,
    autoConfirmReservations: record.autoConfirmReservations,
    swiggyRestaurantId: record.swiggyRestaurantId ?? config.ordering.swiggyRestaurantId ?? null,
    zomatoRestaurantId: record.zomatoRestaurantId ?? config.ordering.zomatoRestaurantId ?? null,
    swiggyApiHandoffEnabled: config.ordering.enableSwiggyApiHandoff,
    zomatoApiHandoffEnabled: config.ordering.enableZomatoApiHandoff,
  };
}

export async function getEffectiveNotificationRecipients(): Promise<string[]> {
  const adminCfg = await getAdminSettings();
  return adminCfg.notificationEmails;
}
