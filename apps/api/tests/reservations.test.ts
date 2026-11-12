import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationStatus } from '@prisma/client';
import { applyTestEnvDefaults, createMockPrisma, DEFAULT_TEST_SETTINGS } from './helpers/mockPrisma';

const prismaMock = vi.hoisted(() => ({
  client: null as unknown as ReturnType<typeof createMockPrisma>,
}));

vi.mock('../src/lib/prisma', async () => {
  const helper = await import('./helpers/mockPrisma');
  prismaMock.client = helper.createMockPrisma();
  return { prisma: prismaMock.client };
});

import { resetConfigCacheForTests } from '../src/config/env';
import {
  cancelReservationForActor,
  createReservation,
  getReservationAvailability,
} from '../src/modules/reservations/reservations.service';

describe('Table reservations, IST slot validation, and capacity locking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfigCacheForTests();
    applyTestEnvDefaults();
    prismaMock.client.adminSetting.findUnique.mockResolvedValue(DEFAULT_TEST_SETTINGS);
  });

  it('marks past IST time slots unavailable on the current date and shows future slots open', async () => {
    // 2026-11-12 06:00 UTC = 11:30 IST -> 11:30 and earlier unavailable, 12:00 available
    const nowAt1130Ist = new Date('2026-11-12T06:00:00.000Z');
    const result = await getReservationAvailability('2026-11-12', 2, nowAt1130Ist);

    const slot0900 = result.slots.find((s) => s.time24 === '09:00');
    const slot1130 = result.slots.find((s) => s.time24 === '11:30');
    const slot1200 = result.slots.find((s) => s.time24 === '12:00');
    const slot1800 = result.slots.find((s) => s.time24 === '18:00');

    expect(slot0900?.available).toBe(false);
    expect(slot1130?.available).toBe(false);
    expect(slot1200?.available).toBe(true);
    expect(slot1800?.available).toBe(true);
  });

  it('rejects past IST dates and out-of-hours reservation times', async () => {
    const nowAt1130Ist = new Date('2026-11-12T06:00:00.000Z');

    await expect(
      createReservation(
        {
          customerName: 'Sneha Reddy',
          customerEmail: 'sneha@example.com',
          customerPhone: '+91 9876543210',
          reservationDate: '2026-11-11',
          reservationTime: '18:00',
          guestCount: 2,
        },
        null,
        '127.0.0.1',
        nowAt1130Ist
      )
    ).rejects.toMatchObject({ status: 400, code: 'PAST_RESERVATION_DATE' });

    await expect(
      createReservation(
        {
          customerName: 'Sneha Reddy',
          customerEmail: 'sneha@example.com',
          customerPhone: '+91 9876543210',
          reservationDate: '2026-11-15',
          reservationTime: '02:00',
          guestCount: 2,
        },
        null,
        '127.0.0.1',
        nowAt1130Ist
      )
    ).rejects.toMatchObject({ status: 400, code: 'OUTSIDE_OPERATING_HOURS' });
  });

  it('returns 409 SLOT_CAPACITY_EXCEEDED when transactional slot check finds capacity full', async () => {
    const futureNow = new Date('2026-11-12T06:00:00.000Z');
    prismaMock.client.reservationSlot.upsert.mockResolvedValueOnce({
      id: 'slot-1',
      slotDate: '2026-11-20',
      slotTime: '19:00',
      capacityGuests: 10,
      capacityTables: 4,
    });
    // Already 8 guests booked in this slot
    prismaMock.client.reservation.findMany.mockResolvedValueOnce([
      { guestCount: 4 },
      { guestCount: 4 },
    ]);

    await expect(
      createReservation(
        {
          customerName: 'Ravi Varma',
          customerEmail: 'ravi@example.com',
          customerPhone: '+91 9876543210',
          reservationDate: '2026-11-20',
          reservationTime: '19:00',
          guestCount: 4,
        },
        null,
        '127.0.0.1',
        futureNow
      )
    ).rejects.toMatchObject({ status: 409, code: 'SLOT_CAPACITY_EXCEEDED' });
  });

  it('creates PENDING reservation and prevents unrelated users from cancelling it', async () => {
    const nowAt1130Ist = new Date('2026-11-12T06:00:00.000Z');
    prismaMock.client.reservationSlot.upsert.mockResolvedValueOnce({
      id: 'slot-2',
      slotDate: '2026-11-20',
      slotTime: '19:00',
      capacityGuests: 24,
      capacityTables: 8,
    });
    prismaMock.client.reservation.findMany.mockResolvedValueOnce([]);
    prismaMock.client.reservation.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'res-uuid-1',
      bookingCode: data.bookingCode,
      userId: data.userId,
      slotId: data.slotId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      reservationDate: data.reservationDate,
      reservationTime: data.reservationTime,
      guestCount: data.guestCount,
      specialRequests: data.specialRequests,
      status: ReservationStatus.PENDING,
      adminNotes: null,
      createdAt: new Date('2026-11-12T06:00:00.000Z'),
      updatedAt: new Date('2026-11-12T06:00:00.000Z'),
    }));

    const created = await createReservation(
      {
        customerName: 'Divya Nair',
        customerEmail: 'divya@example.com',
        customerPhone: '+91 9876543210',
        reservationDate: '2026-11-20',
        reservationTime: '19:00',
        guestCount: 3,
      },
      'owner-user-id',
      '127.0.0.1',
      nowAt1130Ist
    );

    expect(created.reservation.bookingCode).toMatch(/^RC-20261120-/);
    expect(created.reservation.status).toBe('PENDING');

    // Other user attempts to cancel -> 403
    prismaMock.client.reservation.findUnique.mockResolvedValueOnce({
      id: 'res-uuid-1',
      bookingCode: created.reservation.bookingCode,
      userId: 'owner-user-id',
      reservationDate: '2026-11-20',
      reservationTime: '19:00',
      status: ReservationStatus.PENDING,
    });

    await expect(
      cancelReservationForActor(
        'res-uuid-1',
        { id: 'other-user-id', email: 'other@example.com', role: 'CUSTOMER' },
        '127.0.0.1',
        nowAt1130Ist
      )
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
