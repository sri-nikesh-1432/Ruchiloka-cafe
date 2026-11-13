import { describe, expect, it } from 'vitest';
import {
  AdminSettingsSchema,
  BUSINESS_INFO,
  CreateReservationSchema,
  DEFAULT_OPERATING_WINDOWS,
  formatIstDateDisplay,
  generateDailyReservationSlots,
  getCategoryServiceStatus,
  getIstClockParts,
  getIstFullTimings,
  getServiceStatuses,
  isCafeCurrentlyOpen,
  RegisterSchema,
} from '../src';

describe('@ruchiloka/shared IST hours & validation rules', () => {
  it('computes exact IST operating statuses across morning, midday, afternoon, and night windows', () => {
    // 06:30 IST = 01:00 UTC -> Tiffins Open, Tea & Coffee Open, Continental/Snacks Closed
    const at630Ist = new Date('2026-11-12T01:00:00.000Z');
    const morningStatuses = getServiceStatuses(at630Ist, DEFAULT_OPERATING_WINDOWS);
    expect(getIstClockParts(at630Ist).time24).toBe('06:30');
    expect(morningStatuses.find((s) => s.key === 'tiffins')?.isOpen).toBe(true);
    expect(morningStatuses.find((s) => s.key === 'beverages')?.isOpen).toBe(true);
    expect(morningStatuses.find((s) => s.key === 'continental_snacks')?.isOpen).toBe(false);
    expect(isCafeCurrentlyOpen(at630Ist)).toBe(true);

    // 11:35 IST = 06:05 UTC -> Tiffins Closed, Tea & Coffee Open, Continental Closed
    const at1135Ist = new Date('2026-11-12T06:05:00.000Z');
    const middayStatuses = getServiceStatuses(at1135Ist, DEFAULT_OPERATING_WINDOWS);
    expect(middayStatuses.find((s) => s.key === 'tiffins')?.isOpen).toBe(false);
    expect(middayStatuses.find((s) => s.key === 'beverages')?.isOpen).toBe(true);
    expect(getCategoryServiceStatus('continental', at1135Ist).isOpen).toBe(false);

    // 15:00 IST = 09:30 UTC -> Beverages Open, Continental & Snacks Open
    const at1500Ist = new Date('2026-11-12T09:30:00.000Z');
    const eveningStatuses = getServiceStatuses(at1500Ist, DEFAULT_OPERATING_WINDOWS);
    expect(eveningStatuses.find((s) => s.key === 'continental_snacks')?.isOpen).toBe(true);
    expect(getCategoryServiceStatus('snacks', at1500Ist).statusText).toBe('Open Now');

    // 23:00 IST = 17:30 UTC -> All closed (half-open end boundaries)
    const at2300Ist = new Date('2026-11-12T17:30:00.000Z');
    expect(isCafeCurrentlyOpen(at2300Ist)).toBe(false);
  });

  it('computes rich full timings data, service boundaries, and countdowns accurately', () => {
    // 1. Morning Breakfast (08:30 IST)
    const morningDate = new Date('2026-11-12T03:00:00.000Z'); // 08:30 IST
    const morning = getIstFullTimings(morningDate, DEFAULT_OPERATING_WINDOWS);
    expect(morning.isCafeOpen).toBe(true);
    expect(morning.overallStatus).toBe('OPEN');
    expect(morning.overallStatusText).toBe('Open Now');
    expect(morning.activeServiceNames).toContain('Tiffins');
    expect(morning.activeServiceNames).toContain('Tea and Coffee');
    expect(morning.nextChangeHeadline).toContain('11:30 AM IST');
    expect(morning.formattedClock12).toBe('8:30 AM IST');

    // 2. Midday Tea Only (13:00 IST)
    const middayDate = new Date('2026-11-12T07:30:00.000Z'); // 13:00 IST
    const midday = getIstFullTimings(middayDate, DEFAULT_OPERATING_WINDOWS);
    expect(midday.isCafeOpen).toBe(true);
    expect(midday.overallStatus).toBe('OPEN');
    expect(midday.activeServiceNames).toEqual(['Tea and Coffee']);
    expect(midday.nextChangeHeadline).toContain('3:00 PM IST');

    // 3. Evening Dining (18:00 IST)
    const eveningDate = new Date('2026-11-12T12:30:00.000Z'); // 18:00 IST
    const evening = getIstFullTimings(eveningDate, DEFAULT_OPERATING_WINDOWS);
    expect(evening.isCafeOpen).toBe(true);
    expect(evening.activeServiceNames).toContain('Continental and Snacks');
    expect(evening.nextChangeHeadline).toContain('11:00 PM IST');

    // 4. Night Closed (23:45 IST)
    const nightDate = new Date('2026-11-12T18:15:00.000Z'); // 23:45 IST
    const night = getIstFullTimings(nightDate, DEFAULT_OPERATING_WINDOWS);
    expect(night.isCafeOpen).toBe(false);
    expect(night.overallStatus).toBe('CLOSED');
    expect(night.overallStatusText).toBe('Closed Now');
    expect(night.statusBadgeText).toBe('CLOSED NOW · OPENS 6:30 AM');
    expect(night.nextChangeHeadline).toContain('tomorrow morning at 6:30 AM IST');

    // 5. Early Morning Closed (05:00 IST)
    const dawnDate = new Date('2026-11-11T23:30:00.000Z'); // 05:00 IST next day
    const dawn = getIstFullTimings(dawnDate, DEFAULT_OPERATING_WINDOWS);
    expect(dawn.isCafeOpen).toBe(false);
    expect(dawn.nextChangeHeadline).toContain('this morning at 6:30 AM IST');
  });

  it('generates reservation slots aligned with operating hours and 30-minute intervals', () => {
    const slots = generateDailyReservationSlots(30, DEFAULT_OPERATING_WINDOWS);
    expect(slots[0].time24).toBe('06:30');
    expect(slots[0].activeServices).toEqual(['tiffins', 'beverages']);

    const afternoonStart = slots.find((s) => s.time24 === '15:00');
    expect(afternoonStart?.activeServices).toEqual(['beverages', 'continental_snacks']);

    const lateSlot = slots[slots.length - 1];
    expect(lateSlot.time24).toBe('22:30');
    expect(slots.find((s) => s.time24 === '23:00')).toBeUndefined();
  });

  it('validates business info constants & IST date display formatting', () => {
    expect(BUSINESS_INFO.name).toBe('Ruchiloka Café');
    expect(BUSINESS_INFO.phone).toBe('+91 91216 78449');
    expect(BUSINESS_INFO.timezone).toBe('Asia/Kolkata');
    expect(formatIstDateDisplay('2026-11-12')).toContain('Nov');
  });

  it('enforces reservation, registration, and settings Zod schemas', () => {
    expect(
      CreateReservationSchema.safeParse({
        customerName: 'Ananya Rao',
        customerEmail: 'ANANYA@EXAMPLE.COM',
        customerPhone: '+91 98765 43210',
        reservationDate: '2026-12-20',
        reservationTime: '18:30',
        guestCount: 4,
      }).success
    ).toBe(true);

    expect(
      CreateReservationSchema.safeParse({
        customerName: 'Ananya',
        customerEmail: 'bad-email',
        customerPhone: '123',
        reservationDate: '20-12-2026',
        reservationTime: '18:30',
        guestCount: 25,
      }).success
    ).toBe(false);

    expect(
      RegisterSchema.safeParse({
        name: 'Vikram',
        email: 'vikram@example.com',
        password: 'short',
      }).success
    ).toBe(false);

    expect(
      AdminSettingsSchema.safeParse({
        notificationEmails: ['owner@ruchiloka.in', 'manager@ruchiloka.in'],
        swiggyListingUrl: 'https://www.swiggy.com/city/hyderabad',
      }).success
    ).toBe(true);
  });
});
