'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';
import {
  BUSINESS_INFO,
  CreateReservationSchema,
  formatIstDateDisplay,
  getIstClockParts,
  type ReservationDto,
  type ReservationSlotAvailabilityDto,
} from '@ruchiloka/shared';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

type ReservationFormValues = z.infer<typeof CreateReservationSchema>;

export default function ReservePage() {
  const { user, publicSettings, pushToast } = useApp();
  const todayIst = getIstClockParts().dateIso;

  const [slots, setSlots] = useState<ReservationSlotAvailabilityDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ReservationDto | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(CreateReservationSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      reservationDate: todayIst,
      reservationTime: '',
      guestCount: 2,
      specialRequests: '',
    },
  });

  useEffect(() => {
    if (user) {
      setValue('customerName', user.name);
      setValue('customerEmail', user.email);
      if (user.phone) setValue('customerPhone', user.phone);
    }
  }, [user, setValue]);

  const selectedDate = watch('reservationDate');
  const selectedTime = watch('reservationTime');
  const guestCount = watch('guestCount');

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);

    api.reservations
      .availability(selectedDate, Number(guestCount) || 2)
      .then((res) => {
        if (cancelled) return;
        setSlots(res.slots);
        // Clear selected slot if no longer available
        if (selectedTime) {
          const matching = res.slots.find((s) => s.time24 === selectedTime);
          if (!matching || !matching.available) {
            setValue('reservationTime', '');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSlots([]);
          setSlotsError(
            err instanceof Error ? err.message : 'Unable to check table availability right now.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, guestCount, selectedTime, setValue]);

  const onSubmit = async (values: ReservationFormValues) => {
    try {
      const response = await api.reservations.create(values);
      setConfirmedBooking(response.reservation);
      pushToast({
        title:
          response.reservation.status === 'CONFIRMED'
            ? 'Table confirmed'
            : 'Reservation request received',
        description: `Reference: ${response.reservation.bookingCode}`,
        tone: 'accent',
      });
    } catch (err) {
      pushToast({
        title: 'Could not complete reservation',
        description: err instanceof Error ? err.message : 'Please select another slot and retry.',
        tone: 'error',
      });
    }
  };

  return (
    <PageTransitionWrapper className="pt-28 pb-24">
      <div className="editorial-container">
        <div className="border-b border-beige-border pb-8 max-w-3xl">
          <span className="editorial-kicker">Table Bookings · Kukatpally</span>
          <h1 className="mt-2 editorial-heading text-4xl sm:text-5xl font-semibold">
            Reserve Your Table
          </h1>
          <p className="mt-3 text-base leading-relaxed text-coffee-muted">
            Select your date and party size to view live seating availability in Indian Standard
            Time (`Asia/Kolkata`). Breakfast tiffins are served 6:30 AM – 11:30 AM, coffee &amp; tea
            all day until 11:00 PM, and continental &amp; snacks from 3:00 PM – 11:00 PM.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 items-start">
          {/* Left Form or Confirmation */}
          <div className="lg:col-span-7">
            {confirmedBooking ? (
              <div className="rounded-[2rem] border border-beige-border bg-ivory p-8 sm:p-10 shadow-card space-y-6">
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      confirmedBooking.status === 'CONFIRMED'
                        ? 'bg-sky-blue-soft text-sky-blue-deep'
                        : 'bg-cognac-light/40 text-cognac'
                    }`}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="inline-block rounded-full bg-beige px-3 py-1 font-mono text-xs font-semibold text-coffee">
                      Status: {confirmedBooking.status}
                    </span>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-dark-brown">
                      {confirmedBooking.status === 'CONFIRMED'
                        ? 'Your table is confirmed!'
                        : 'Reservation Request Received'}
                    </h2>
                    <p className="mt-1.5 text-sm text-coffee-muted">
                      {confirmedBooking.status === 'CONFIRMED'
                        ? 'We look forward to welcoming you at Ruchiloka Café. A confirmation email has been dispatched.'
                        : 'Our café team has received your booking request and notified the host desk. Once reviewed, you will receive an email confirmation.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 rounded-2xl border border-beige-border bg-cream p-5 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-coffee-muted">
                      Booking Code
                    </span>
                    <p className="mt-0.5 font-mono text-base font-bold text-dark-brown">
                      {confirmedBooking.bookingCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-coffee-muted">
                      Party Size
                    </span>
                    <p className="mt-0.5 font-semibold text-dark-brown">
                      {confirmedBooking.guestCount}{' '}
                      {confirmedBooking.guestCount === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-coffee-muted">
                      Date (IST)
                    </span>
                    <p className="mt-0.5 font-semibold text-dark-brown">
                      {formatIstDateDisplay(confirmedBooking.reservationDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-coffee-muted">
                      Time Slot (IST)
                    </span>
                    <p className="mt-0.5 font-mono font-semibold text-dark-brown">
                      {confirmedBooking.reservationTime} IST
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmedBooking(null)}
                    className="rounded-full border border-beige-border bg-cream px-6 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac"
                  >
                    Make Another Reservation
                  </button>
                  {user && (
                    <Link
                      href="/profile/bookings"
                      className="rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-coffee"
                    >
                      View My Bookings
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="rounded-[2rem] border border-beige-border bg-ivory p-6 sm:p-10 shadow-card space-y-6"
                noValidate
              >
                {/* Date & Guest selector */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reservationDate"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Reservation Date (IST)
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cognac" />
                      <input
                        id="reservationDate"
                        type="date"
                        min={todayIst}
                        {...register('reservationDate')}
                        className="w-full rounded-2xl border border-beige-border bg-cream py-3 pl-11 pr-4 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                      />
                    </div>
                    {errors.reservationDate && (
                      <p className="mt-1.5 text-xs text-cognac">{errors.reservationDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="guestCount"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Number of Guests
                    </label>
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cognac" />
                      <select
                        id="guestCount"
                        {...register('guestCount', { valueAsNumber: true })}
                        className="w-full rounded-2xl border border-beige-border bg-cream py-3 pl-11 pr-4 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((count) => (
                          <option key={count} value={count}>
                            {count} {count === 1 ? 'Guest' : 'Guests'}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.guestCount && (
                      <p className="mt-1.5 text-xs text-cognac">{errors.guestCount.message}</p>
                    )}
                  </div>
                </div>

                {/* Live Available Time Slots */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-coffee">
                      Available Time Slots (IST)
                    </span>
                    {slotsLoading && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-coffee-muted">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cognac" />
                        Checking tables...
                      </span>
                    )}
                  </div>

                  {slotsError ? (
                    <div className="rounded-2xl border border-cognac/35 bg-cognac-light/25 p-4 text-xs text-dark-brown">
                      {slotsError}
                    </div>
                  ) : slots.length === 0 && !slotsLoading ? (
                    <div className="rounded-2xl border border-beige-border bg-cream p-4 text-xs text-coffee-muted">
                      No open seating slots remain for this date and party size. Please select
                      another date or call {publicSettings.cafePhone}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time24;
                        return (
                          <button
                            key={slot.time24}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setValue('reservationTime', slot.time24, { shouldValidate: true })}
                            title={slot.reason ?? `${slot.remainingCapacity} seats open`}
                            className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                              isSelected
                                ? 'border-cognac bg-dark-brown text-cream shadow-sm'
                                : slot.available
                                  ? 'border-beige-border bg-cream text-dark-brown hover:border-cognac'
                                  : 'cursor-not-allowed border-beige-border/50 bg-beige-soft/50 text-coffee-soft line-through'
                            }`}
                          >
                            <span className="block font-mono text-xs font-semibold">
                              {slot.label12}
                            </span>
                            {slot.available && (
                              <span
                                className={`block text-[10px] mt-0.5 ${
                                  isSelected ? 'text-beige' : 'text-coffee-muted'
                                }`}
                              >
                                {slot.remainingCapacity} left
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <input type="hidden" {...register('reservationTime')} />
                  {errors.reservationTime && (
                    <p className="text-xs text-cognac">{errors.reservationTime.message}</p>
                  )}
                </div>

                {/* Guest Details */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="customerName"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      placeholder="Your full name"
                      {...register('customerName')}
                      className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                    />
                    {errors.customerName && (
                      <p className="mt-1.5 text-xs text-cognac">{errors.customerName.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="customerEmail"
                      type="email"
                      placeholder="you@example.com"
                      {...register('customerEmail')}
                      className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                    />
                    {errors.customerEmail && (
                      <p className="mt-1.5 text-xs text-cognac">{errors.customerEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      {...register('customerPhone')}
                      className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                    />
                    {errors.customerPhone && (
                      <p className="mt-1.5 text-xs text-cognac">{errors.customerPhone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="specialRequests"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                  >
                    Special Requests (Optional)
                  </label>
                  <textarea
                    id="specialRequests"
                    rows={3}
                    placeholder="Window corner, baby high-chair, quiet table, anniversary note..."
                    {...register('specialRequests')}
                    className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                  />
                  {errors.specialRequests && (
                    <p className="mt-1.5 text-xs text-cognac">{errors.specialRequests.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-dark-brown px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-cognac disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Reservation...
                    </>
                  ) : (
                    'Request Table Reservation'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Info Column */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-beige-border bg-beige-soft p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                Service Schedule (IST)
              </h2>
              <ul className="space-y-4 text-sm">
                {publicSettings.operatingHours.map((slot) => (
                  <li key={slot.key} className="border-b border-beige-border pb-3 last:border-none last:pb-0">
                    <div className="flex items-center justify-between font-semibold text-dark-brown">
                      <span>{slot.label}</span>
                      <span className="font-mono text-xs text-cognac">{slot.displayHours}</span>
                    </div>
                    <p className="mt-1 text-xs text-coffee-muted">{slot.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-beige-border bg-ivory p-6 sm:p-8 space-y-4 text-sm text-coffee">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cognac" />
                <span>{publicSettings.cafeAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-cognac" />
                <a href={BUSINESS_INFO.phoneHref} className="font-mono hover:text-cognac">
                  {publicSettings.cafePhone}
                </a>
              </div>
              <div className="flex items-start gap-3 pt-1 text-xs text-coffee-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-blue-deep" />
                <span>
                  Parties larger than 12 guests or private group mornings can call our Kukatpally
                  desk directly.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
