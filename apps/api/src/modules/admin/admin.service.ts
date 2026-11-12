import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ReservationStatus } from '@prisma/client';
import {
  formatMinutesTo12Hour,
  parseTime24ToMinutes,
  type AdminSettingsDto,
  type MenuItemDto,
  type ReservationDto,
  type ReservationStatus as SharedReservationStatus,
} from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { getConfig } from '../../config/env';
import { mapMenuItemToDto } from '../menu/menu.service';
import { mapReservationToDto } from '../reservations/reservations.service';
import { getAdminSettings, getOrCreateSettingsRecord } from '../settings/settings.service';
import { dispatchReservationNotifications } from '../email/email.service';
import { recordAuditLog } from '../audit/audit.service';

function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || `item-${Date.now()}`;
}

export async function getAdminDashboard() {
  const [
    totalReservations,
    pendingReservations,
    confirmedReservations,
    totalUsers,
    totalMenuItems,
    availableMenuItems,
    recentReservations,
    recentEnquiries,
    recentEnquiriesCount,
  ] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: ReservationStatus.PENDING } }),
    prisma.reservation.count({ where: { status: ReservationStatus.CONFIRMED } }),
    prisma.user.count(),
    prisma.menuItem.count(),
    prisma.menuItem.count({ where: { isAvailable: true } }),
    prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.contactMessage.count(),
  ]);

  return {
    metrics: {
      totalReservations,
      pendingReservations,
      confirmedReservations,
      totalUsers,
      totalMenuItems,
      availableMenuItems,
      unavailableMenuItems: Math.max(0, totalMenuItems - availableMenuItems),
      recentEnquiriesCount,
    },
    recentReservations: recentReservations.map(mapReservationToDto),
    recentEnquiries: recentEnquiries.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      subject: e.subject,
      message: e.message,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function listAdminReservations(filters: {
  date?: string;
  status?: string;
  search?: string;
}): Promise<ReservationDto[]> {
  const where: Record<string, unknown> = {};

  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    where.reservationDate = filters.date;
  }
  if (
    filters.status &&
    ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(filters.status)
  ) {
    where.status = filters.status as ReservationStatus;
  }
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    where.OR = [
      { bookingCode: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { customerEmail: { contains: q, mode: 'insensitive' } },
      { customerPhone: { contains: q, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.reservation.findMany({
    where,
    orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });

  return rows.map(mapReservationToDto);
}

export async function updateAdminReservationStatus(params: {
  id: string;
  status: SharedReservationStatus;
  adminNotes?: string;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<ReservationDto> {
  const existing = await prisma.reservation.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new HttpError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  }

  const updated = await prisma.reservation.update({
    where: { id: existing.id },
    data: {
      status: params.status as ReservationStatus,
      ...(params.adminNotes !== undefined
        ? { adminNotes: params.adminNotes.trim() || null }
        : {}),
    },
  });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_RESERVATION_STATUS_UPDATED',
    entityType: 'Reservation',
    entityId: updated.id,
    metadata: {
      bookingCode: updated.bookingCode,
      fromStatus: existing.status,
      toStatus: updated.status,
    },
    ipAddress: params.ipAddress,
  });

  const emailEvent =
    params.status === 'CONFIRMED'
      ? 'APPROVED'
      : params.status === 'REJECTED'
      ? 'REJECTED'
      : params.status === 'CANCELLED'
      ? 'CANCELLED'
      : null;

  if (emailEvent) {
    try {
      const mins = parseTime24ToMinutes(updated.reservationTime);
      await dispatchReservationNotifications(emailEvent, {
        bookingCode: updated.bookingCode,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        customerPhone: updated.customerPhone,
        reservationDate: updated.reservationDate,
        reservationTime: formatMinutesTo12Hour(mins),
        guestCount: updated.guestCount,
        status: updated.status,
        specialRequests: updated.specialRequests,
        adminNotes: updated.adminNotes,
      });
    } catch (err) {
      console.error('[Admin] Reservation email notification error:', err);
    }
  }

  return mapReservationToDto(updated);
}

export async function listAllAdminMenuItems(): Promise<MenuItemDto[]> {
  const rows = await prisma.menuItem.findMany({
    include: {
      category: { select: { slug: true, name: true, displayOrder: true } },
      variants: { orderBy: { priceDeltaInr: 'asc' } },
      addons: { orderBy: { priceInr: 'asc' } },
    },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }, { name: 'asc' }],
  });

  return rows.map(mapMenuItemToDto);
}

interface MenuItemMutationInput {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  priceInr?: number;
  imageUrl?: string;
  isVegetarian?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  prepTimeMinutes?: number;
  displayOrder?: number;
  variants?: Array<{ name: string; priceDeltaInr: number; isAvailable: boolean }>;
  addons?: Array<{ name: string; priceInr: number; isAvailable: boolean }>;
}

async function generateUniqueMenuSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let candidate = slugifyName(baseSlug);
  for (let i = 0; i < 10; i++) {
    const existing = await prisma.menuItem.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slugifyName(baseSlug)}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return `${slugifyName(baseSlug)}-${Date.now()}`;
}

export async function createAdminMenuItem(params: {
  input: Required<Omit<MenuItemMutationInput, 'slug'>> & { slug?: string };
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<MenuItemDto> {
  const category = await prisma.menuCategory.findUnique({
    where: { id: params.input.categoryId },
  });
  if (!category) {
    throw new HttpError(400, 'Selected menu category does not exist.', 'CATEGORY_NOT_FOUND');
  }

  const slug = await generateUniqueMenuSlug(params.input.slug || params.input.name);

  const created = await prisma.menuItem.create({
    data: {
      categoryId: params.input.categoryId,
      name: params.input.name.trim(),
      slug,
      description: params.input.description.trim(),
      priceInr: params.input.priceInr,
      imageUrl: params.input.imageUrl.trim(),
      isVegetarian: params.input.isVegetarian,
      isAvailable: params.input.isAvailable,
      isFeatured: params.input.isFeatured,
      prepTimeMinutes: params.input.prepTimeMinutes,
      displayOrder: params.input.displayOrder,
      variants: {
        create: params.input.variants.map((v) => ({
          name: v.name.trim(),
          priceDeltaInr: v.priceDeltaInr,
          isAvailable: v.isAvailable,
        })),
      },
      addons: {
        create: params.input.addons.map((a) => ({
          name: a.name.trim(),
          priceInr: a.priceInr,
          isAvailable: a.isAvailable,
        })),
      },
    },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { orderBy: { priceDeltaInr: 'asc' } },
      addons: { orderBy: { priceInr: 'asc' } },
    },
  });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_MENU_ITEM_CREATED',
    entityType: 'MenuItem',
    entityId: created.id,
    metadata: { name: created.name, priceInr: created.priceInr, categorySlug: category.slug },
    ipAddress: params.ipAddress,
  });

  return mapMenuItemToDto(created);
}

export async function updateAdminMenuItem(params: {
  id: string;
  input: MenuItemMutationInput;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<MenuItemDto> {
  const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new HttpError(404, 'Menu item not found.', 'MENU_ITEM_NOT_FOUND');
  }

  if (params.input.categoryId) {
    const category = await prisma.menuCategory.findUnique({
      where: { id: params.input.categoryId },
    });
    if (!category) {
      throw new HttpError(400, 'Selected category does not exist.', 'CATEGORY_NOT_FOUND');
    }
  }

  let nextSlug: string | undefined;
  if (params.input.slug) {
    nextSlug = await generateUniqueMenuSlug(params.input.slug, existing.id);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (params.input.variants !== undefined) {
      await tx.menuItemVariant.deleteMany({ where: { menuItemId: existing.id } });
    }
    if (params.input.addons !== undefined) {
      await tx.menuAddon.deleteMany({ where: { menuItemId: existing.id } });
    }

    return tx.menuItem.update({
      where: { id: existing.id },
      data: {
        ...(params.input.categoryId ? { categoryId: params.input.categoryId } : {}),
        ...(params.input.name ? { name: params.input.name.trim() } : {}),
        ...(nextSlug ? { slug: nextSlug } : {}),
        ...(params.input.description ? { description: params.input.description.trim() } : {}),
        ...(params.input.priceInr !== undefined ? { priceInr: params.input.priceInr } : {}),
        ...(params.input.imageUrl ? { imageUrl: params.input.imageUrl.trim() } : {}),
        ...(params.input.isVegetarian !== undefined
          ? { isVegetarian: params.input.isVegetarian }
          : {}),
        ...(params.input.isAvailable !== undefined
          ? { isAvailable: params.input.isAvailable }
          : {}),
        ...(params.input.isFeatured !== undefined
          ? { isFeatured: params.input.isFeatured }
          : {}),
        ...(params.input.prepTimeMinutes !== undefined
          ? { prepTimeMinutes: params.input.prepTimeMinutes }
          : {}),
        ...(params.input.displayOrder !== undefined
          ? { displayOrder: params.input.displayOrder }
          : {}),
        ...(params.input.variants !== undefined
          ? {
              variants: {
                create: params.input.variants.map((v) => ({
                  name: v.name.trim(),
                  priceDeltaInr: v.priceDeltaInr,
                  isAvailable: v.isAvailable,
                })),
              },
            }
          : {}),
        ...(params.input.addons !== undefined
          ? {
              addons: {
                create: params.input.addons.map((a) => ({
                  name: a.name.trim(),
                  priceInr: a.priceInr,
                  isAvailable: a.isAvailable,
                })),
              },
            }
          : {}),
      },
      include: {
        category: { select: { slug: true, name: true } },
        variants: { orderBy: { priceDeltaInr: 'asc' } },
        addons: { orderBy: { priceInr: 'asc' } },
      },
    });
  });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_MENU_ITEM_UPDATED',
    entityType: 'MenuItem',
    entityId: updated.id,
    metadata: { name: updated.name, priceInr: updated.priceInr, isAvailable: updated.isAvailable },
    ipAddress: params.ipAddress,
  });

  return mapMenuItemToDto(updated);
}

export async function deleteAdminMenuItem(params: {
  id: string;
  actor: { id: string; email: string };
  ipAddress?: string;
}) {
  const existing = await prisma.menuItem.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new HttpError(404, 'Menu item not found.', 'MENU_ITEM_NOT_FOUND');
  }

  await prisma.menuItem.delete({ where: { id: existing.id } });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_MENU_ITEM_DELETED',
    entityType: 'MenuItem',
    entityId: existing.id,
    metadata: { name: existing.name },
    ipAddress: params.ipAddress,
  });

  return { deleted: true };
}

function detectImageExtension(buffer: Buffer, mimetype: string): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  // AVIF: ....ftypavif
  if (
    buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
    buffer.subarray(8, 12).toString('ascii').includes('avif')
  ) {
    return 'avif';
  }

  if (mimetype === 'image/jpeg') return 'jpg';
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/webp') return 'webp';
  return null;
}

export async function storeMenuImageUpload(params: {
  file: Express.Multer.File;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<{ imageUrl: string }> {
  const ext = detectImageExtension(params.file.buffer, params.file.mimetype);
  if (!ext) {
    throw new HttpError(
      400,
      'Unsupported or invalid image file. Upload JPG, PNG, WebP, or AVIF up to 5 MB.',
      'INVALID_IMAGE_FILE'
    );
  }

  const config = getConfig();

  if (
    config.cloudinary.enabled &&
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'ruchiloka/menu';
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${config.cloudinary.apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const form = new FormData();
    const mime =
      ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const blob = new Blob([new Uint8Array(params.file.buffer)], { type: mime });
    form.append('file', blob, `dish-${timestamp}.${ext}`);
    form.append('api_key', config.cloudinary.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinary.cloudName)}/image/upload`,
      {
        method: 'POST',
        body: form,
      }
    );
    const payload = (await response.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };
    if (!response.ok || !payload.secure_url) {
      throw new HttpError(
        502,
        payload.error?.message || 'Cloudinary image upload failed.',
        'IMAGE_UPLOAD_FAILED'
      );
    }

    await recordAuditLog({
      actorUserId: params.actor.id,
      actorEmail: params.actor.email,
      action: 'ADMIN_MENU_IMAGE_UPLOADED',
      entityType: 'Media',
      metadata: { storage: 'cloudinary', url: payload.secure_url },
      ipAddress: params.ipAddress,
    });

    return { imageUrl: payload.secure_url };
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `menu-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const targetPath = path.join(uploadsDir, filename);
  await fs.writeFile(targetPath, params.file.buffer);

  const publicUrl = `${config.backendUrl}/uploads/${filename}`;
  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_MENU_IMAGE_UPLOADED',
    entityType: 'Media',
    metadata: { storage: 'local', url: publicUrl },
    ipAddress: params.ipAddress,
  });

  return { imageUrl: publicUrl };
}

export async function listAdminCustomers(search?: string) {
  const q = search?.trim();
  const rows = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          reservations: true,
          handoffs: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    _count: {
      reservations: u._count.reservations,
      orderHandoffs: u._count.handoffs,
    },
  }));
}

export async function updateAdminSettings(params: {
  input: Record<string, unknown>;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<AdminSettingsDto> {
  await getOrCreateSettingsRecord();

  const data: Record<string, unknown> = {};
  const strOrNull = (val: unknown) => {
    if (val === undefined) return undefined;
    if (val === null || String(val).trim() === '') return null;
    return String(val).trim();
  };

  if (typeof params.input.cafePhone === 'string') data.cafePhone = params.input.cafePhone.trim();
  if (typeof params.input.cafeAddress === 'string') data.cafeAddress = params.input.cafeAddress.trim();
  if (Array.isArray(params.input.notificationEmails)) {
    data.notificationEmails = Array.from(
      new Set(
        params.input.notificationEmails
          .map((e) => String(e).trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }
  if (typeof params.input.reservationSlotMinutes === 'number') {
    data.reservationSlotMinutes = params.input.reservationSlotMinutes;
  }
  if (typeof params.input.maxGuestsPerSlot === 'number') {
    data.maxGuestsPerSlot = params.input.maxGuestsPerSlot;
  }
  if (typeof params.input.maxTablesPerSlot === 'number') {
    data.maxTablesPerSlot = params.input.maxTablesPerSlot;
  }
  if (typeof params.input.autoConfirmReservations === 'boolean') {
    data.autoConfirmReservations = params.input.autoConfirmReservations;
  }

  const swiggyId = strOrNull(params.input.swiggyRestaurantId);
  if (swiggyId !== undefined) data.swiggyRestaurantId = swiggyId;
  const swiggyUrl = strOrNull(params.input.swiggyListingUrl);
  if (swiggyUrl !== undefined) data.swiggyListingUrl = swiggyUrl;
  const zomatoId = strOrNull(params.input.zomatoRestaurantId);
  if (zomatoId !== undefined) data.zomatoRestaurantId = zomatoId;
  const zomatoUrl = strOrNull(params.input.zomatoListingUrl);
  if (zomatoUrl !== undefined) data.zomatoListingUrl = zomatoUrl;
  const igUrl = strOrNull(params.input.instagramUrl);
  if (igUrl !== undefined) data.instagramUrl = igUrl;
  const fbUrl = strOrNull(params.input.facebookUrl);
  if (fbUrl !== undefined) data.facebookUrl = fbUrl;

  if (Array.isArray(params.input.operatingHoursJson)) {
    data.operatingHoursJson = params.input.operatingHoursJson;
  }

  await prisma.adminSetting.update({
    where: { key: 'default' },
    data,
  });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_SETTINGS_UPDATED',
    entityType: 'AdminSetting',
    entityId: 'default',
    metadata: { updatedFields: Object.keys(data) },
    ipAddress: params.ipAddress,
  });

  return getAdminSettings();
}

export async function listAuditLogs() {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 150,
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actorEmail: row.actorEmail,
    metadata: row.metadataJson,
    createdAt: row.createdAt.toISOString(),
  }));
}
