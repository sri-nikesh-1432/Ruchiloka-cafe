import crypto from 'node:crypto';
import { Prisma, ReservationStatus } from '@prisma/client';
import {
  DEFAULT_OPERATING_WINDOWS,
  formatMinutesTo12Hour,
  generateDailyReservationSlots,
  getIstClockParts,
  parseTime24ToMinutes,
  type OperatingWindow,
  type ReservationDto,
  type ReservationSlotAvailabilityDto,
} from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { getOrCreateSettingsRecord } from '../settings/settings.service';
import { dispatchReservationNotifications } from '../email/email.service';
import { recordAuditLog } from '../audit/audit.service';

export function mapReservationToDto(r: {
  id: string;
  bookingCode: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequests: string | null;
  status: ReservationStatus;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ReservationDto {
  return {
    id: r.id,
    bookingCode: r.bookingCode,
    userId: r.userId,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone,
    reservationDate: r.reservationDate,
    reservationTime: r.reservationTime,
    guestCount: r.guestCount,
    specialRequests: r.specialRequests,
    status: r.status,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function parseOperatingHours(raw: unknown): OperatingWindow[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw as OperatingWindow[];
  }
  return DEFAULT_OPERATING_WINDOWS;
}

export function isValidIsoCalendarDate(dateIso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return false;
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function generateBookingCode(dateIso: string): string {
  const compact = dateIso.replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RC-${compact}-${rand}`;
}

export async function getReservationAvailability(
  dateIso: string,
  guestCount: number,
  now: Date = new Date()
): Promise<{ date: string; slots: ReservationSlotAvailabilityDto[] }> {
  if (!isValidIsoCalendarDate(dateIso)) {
    throw new HttpError(400, 'Invalid reservation date format.', 'INVALID_DATE');
  }
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
    throw new HttpError(400, 'Guest count must be between 1 and 20.', 'INVALID_GUEST_COUNT');
  }

  const settings = await getOrCreateSettingsRecord();
  const windows = parseOperatingHours(settings.operatingHoursJson);
  const generatedSlots = generateDailyReservationSlots(settings.reservationSlotMinutes, windows);

  const [activeReservations, slotOverrides] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        reservationDate: dateIso,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      },
      select: {
        reservationTime: true,
        guestCount: true,
      },
    }),
    prisma.reservationSlot.findMany({
      where: { slotDate: dateIso },
    }),
  ]);

  const overrideMap = new Map(slotOverrides.map((s) => [s.slotTime, s]));
  const bookedByTime = new Map<string, { guests: number; tables: number }>();

  for (const res of activeReservations) {
    const cur = bookedByTime.get(res.reservationTime) ?? { guests: 0, tables: 0 };
    cur.guests += res.guestCount;
    cur.tables += 1;
    bookedByTime.set(res.reservationTime, cur);
  }

  const ist = getIstClockParts(now);
  const isPastDate = dateIso < ist.dateIso;
  const isToday = dateIso === ist.dateIso;

  const slots: ReservationSlotAvailabilityDto[] = generatedSlots.map((slot) => {
    const override = overrideMap.get(slot.time24);
    const maxGuests = override?.capacityGuests ?? settings.maxGuestsPerSlot;
    const maxTables = override?.capacityTables ?? settings.maxTablesPerSlot;
    const booked = bookedByTime.get(slot.time24) ?? { guests: 0, tables: 0 };
    const remainingCapacity = Math.max(0, maxGuests - booked.guests);
    const slotMinutes = parseTime24ToMinutes(slot.time24);

    if (isPastDate) {
      return {
        time24: slot.time24,
        label12: slot.label12,
        available: false,
        remainingCapacity: 0,
        activeServices: slot.activeServices,
        reason: 'Date has already passed in IST.',
      };
    }

    if (isToday && slotMinutes <= ist.minutesSinceMidnight) {
      return {
        time24: slot.time24,
        label12: slot.label12,
        available: false,
        remainingCapacity: 0,
        activeServices: slot.activeServices,
        reason: 'Time slot has already passed in IST.',
      };
    }

    const hasTableRoom = booked.tables + 1 <= maxTables;
    const hasGuestRoom = booked.guests + guestCount <= maxGuests;
    const available = hasTableRoom && hasGuestRoom;

    return {
      time24: slot.time24,
      label12: slot.label12,
      available,
      remainingCapacity,
      activeServices: slot.activeServices,
      ...(available ? {} : { reason: 'Slot capacity reached for this party size.' }),
    };
  });

  return { date: dateIso, slots };
}

export async function createReservation(
  input: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    reservationDate: string;
    reservationTime: string;
    guestCount: number;
    specialRequests?: string;
  },
  actorUserId?: string | null,
  ipAddress?: string,
  now: Date = new Date()
): Promise<{ reservation: ReservationDto; emailNotificationQueued: boolean }> {
  if (!isValidIsoCalendarDate(input.reservationDate)) {
    throw new HttpError(400, 'Invalid reservation date.', 'INVALID_DATE');
  }

  const ist = getIstClockParts(now);
  if (input.reservationDate < ist.dateIso) {
    throw new HttpError(
      400,
      'Reservations cannot be created for a past date (IST).',
      'PAST_RESERVATION_DATE'
    );
  }

  const settings = await getOrCreateSettingsRecord();
  const windows = parseOperatingHours(settings.operatingHoursJson);
  const validSlots = generateDailyReservationSlots(settings.reservationSlotMinutes, windows);
  const matchingSlot = validSlots.find((s) => s.time24 === input.reservationTime);

  if (!matchingSlot) {
    throw new HttpError(
      400,
      'Selected time is outside Ruchiloka Café operating hours or slot intervals.',
      'OUTSIDE_OPERATING_HOURS'
    );
  }

  const slotMinutes = parseTime24ToMinutes(input.reservationTime);
  if (input.reservationDate === ist.dateIso && slotMinutes <= ist.minutesSinceMidnight) {
    throw new HttpError(
      400,
      'Selected time slot has already passed in Indian Standard Time.',
      'PAST_RESERVATION_TIME'
    );
  }

  const initialStatus = settings.autoConfirmReservations
    ? ReservationStatus.CONFIRMED
    : ReservationStatus.PENDING;

  let created: Awaited<ReturnType<typeof prisma.reservation.create>> | null = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      created = await prisma.$transaction(
        async (tx) => {
          const slotRecord = await tx.reservationSlot.upsert({
            where: {
              slotDate_slotTime: {
                slotDate: input.reservationDate,
                slotTime: input.reservationTime,
              },
            },
            update: {},
            create: {
              slotDate: input.reservationDate,
              slotTime: input.reservationTime,
              capacityGuests: settings.maxGuestsPerSlot,
              capacityTables: settings.maxTablesPerSlot,
            },
          });

          const existing = await tx.reservation.findMany({
            where: {
              reservationDate: input.reservationDate,
              reservationTime: input.reservationTime,
              status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
            },
            select: { guestCount: true },
          });

          const bookedTables = existing.length;
          const bookedGuests = existing.reduce((sum, item) => sum + item.guestCount, 0);

          if (
            bookedTables + 1 > slotRecord.capacityTables ||
            bookedGuests + input.guestCount > slotRecord.capacityGuests
          ) {
            throw new HttpError(
              409,
              'This time slot no longer has sufficient table capacity for your party.',
              'SLOT_CAPACITY_EXCEEDED'
            );
          }

          return tx.reservation.create({
            data: {
              bookingCode: generateBookingCode(input.reservationDate),
              userId: actorUserId ?? null,
              slotId: slotRecord.id,
              customerName: input.customerName.trim(),
              customerEmail: input.customerEmail.trim().toLowerCase(),
              customerPhone: input.customerPhone.trim(),
              reservationDate: input.reservationDate,
              reservationTime: input.reservationTime,
              guestCount: input.guestCount,
              specialRequests: input.specialRequests?.trim() || null,
              status: initialStatus,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      break;
    } catch (err) {
      const prismaCode =
        err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : null;
      if (prismaCode === 'P2034' && attempt < maxAttempts) {
        continue;
      }
      throw err;
    }
  }

  if (!created) {
    throw new HttpError(409, 'Could not reserve this slot due to concurrent bookings. Please try again.', 'CONCURRENCY_CONFLICT');
  }

  await recordAuditLog({
    actorUserId: actorUserId ?? null,
    actorEmail: created.customerEmail,
    action: 'RESERVATION_CREATED',
    entityType: 'Reservation',
    entityId: created.id,
    metadata: {
      bookingCode: created.bookingCode,
      reservationDate: created.reservationDate,
      reservationTime: created.reservationTime,
      guestCount: created.guestCount,
      status: created.status,
    },
    ipAddress,
  });

  let emailNotificationQueued = false;
  try {
    const emailResult = await dispatchReservationNotifications('RECEIVED', {
      bookingCode: created.bookingCode,
      customerName: created.customerName,
      customerEmail: created.customerEmail,
      customerPhone: created.customerPhone,
      reservationDate: created.reservationDate,
      reservationTime: formatMinutesTo12Hour(slotMinutes),
      guestCount: created.guestCount,
      status: created.status,
      specialRequests: created.specialRequests,
    });
    emailNotificationQueued =
      emailResult.customerResult.status === 'SENT' ||
      emailResult.adminResults.some((r) => r.status === 'SENT');
  } catch (err) {
    console.error('[Reservations] Email notification dispatch error:', err);
  }

  return {
    reservation: mapReservationToDto(created),
    emailNotificationQueued,
  };
}

export async function getUserReservations(userId: string): Promise<ReservationDto[]> {
  const rows = await prisma.reservation.findMany({
    where: { userId },
    orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(mapReservationToDto);
}

export async function getReservationByIdForActor(
  reservationId: string,
  actor: { id: string; role: string }
): Promise<ReservationDto> {
  const row = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!row) {
    throw new HttpError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  }
  if (actor.role !== 'ADMIN' && row.userId !== actor.id) {
    throw new HttpError(403, 'You do not have access to this reservation.', 'FORBIDDEN');
  }
  return mapReservationToDto(row);
}

export async function cancelReservationForActor(
  reservationId: string,
  actor: { id: string; email: string; role: string },
  ipAddress?: string,
  now: Date = new Date()
): Promise<ReservationDto> {
  const row = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!row) {
    throw new HttpError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  }
  if (actor.role !== 'ADMIN' && row.userId !== actor.id) {
    throw new HttpError(403, 'You can only cancel your own reservations.', 'FORBIDDEN');
  }
  if (row.status !== ReservationStatus.PENDING && row.status !== ReservationStatus.CONFIRMED) {
    throw new HttpError(
      409,
      `Reservation in status ${row.status} cannot be cancelled.`,
      'RESERVATION_NOT_CANCELLABLE'
    );
  }

  const ist = getIstClockParts(now);
  if (actor.role !== 'ADMIN' && row.reservationDate < ist.dateIso) {
    throw new HttpError(
      400,
      'Past reservations cannot be cancelled online.',
      'PAST_RESERVATION_CANNOT_CANCEL'
    );
  }

  const updated = await prisma.reservation.update({
    where: { id: row.id },
    data: { status: ReservationStatus.CANCELLED },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    action: 'RESERVATION_CANCELLED',
    entityType: 'Reservation',
    entityId: updated.id,
    metadata: { bookingCode: updated.bookingCode, cancelledByRole: actor.role },
    ipAddress,
  });

  try {
    const slotMinutes = parseTime24ToMinutes(updated.reservationTime);
    await dispatchReservationNotifications('CANCELLED', {
      bookingCode: updated.bookingCode,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      reservationDate: updated.reservationDate,
      reservationTime: formatMinutesTo12Hour(slotMinutes),
      guestCount: updated.guestCount,
      status: updated.status,
      specialRequests: updated.specialRequests,
    });
  } catch (err) {
    console.error('[Reservations] Cancel email error:', err);
  }

  return mapReservationToDto(updated);
}
