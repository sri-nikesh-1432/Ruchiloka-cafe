'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Loader2, Users, XCircle } from 'lucide-react';
import { formatIstDateDisplay, type ReservationDto } from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { ProfileShell } from '@/components/profile/ProfileShell';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

export default function ProfileBookingsPage() {
  const { user, pushToast } = useApp();
  const [bookings, setBookings] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await api.reservations.myBookings();
      setBookings(list);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      const updated = await api.reservations.cancel(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      pushToast({
        title: 'Reservation cancelled',
        description: `Booking ${updated.bookingCode} has been cancelled.`,
        tone: 'info',
      });
    } catch (err) {
      pushToast({
        title: 'Cannot cancel reservation',
        description: err instanceof Error ? err.message : 'Please call +91 91216 78449.',
        tone: 'error',
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <PageTransitionWrapper>
      <ProfileShell
        title="My Reservations"
        subtitle="Track upcoming table bookings, confirmation updates, and past visits."
      >
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-ivory border border-beige-border" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-beige-border bg-ivory p-12 text-center space-y-4">
            <Calendar className="mx-auto h-9 w-9 text-cognac" />
            <h2 className="font-serif text-2xl font-semibold text-dark-brown">
              No reservations found
            </h2>
            <p className="text-sm text-coffee-muted">
              Reserve your favourite table in Kukatpally in under a minute.
            </p>
            <Link
              href="/reserve"
              className="inline-flex rounded-full bg-dark-brown px-7 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac"
            >
              Book a Table
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
              return (
                <div
                  key={booking.id}
                  className="flex flex-col gap-4 rounded-3xl border border-beige-border bg-ivory p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-dark-brown">
                        {booking.bookingCode}
                      </span>
                      <span
                        className={`rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-sky-blue-soft text-sky-blue-deep'
                            : booking.status === 'PENDING'
                              ? 'bg-cognac-light/40 text-coffee'
                              : 'bg-beige text-coffee-muted'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-coffee">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-cognac" />
                        {formatIstDateDisplay(booking.reservationDate)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                        <Clock className="h-3.5 w-3.5 text-cognac" />
                        {booking.reservationTime} IST
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-cognac" />
                        {booking.guestCount} guests
                      </span>
                    </div>

                    {booking.specialRequests && (
                      <p className="text-xs italic text-coffee-muted">
                        Request: &ldquo;{booking.specialRequests}&rdquo;
                      </p>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      disabled={cancellingId === booking.id}
                      onClick={() => void handleCancel(booking.id)}
                      className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full border border-beige-border bg-cream px-4 py-2 text-xs font-semibold text-coffee hover:border-cognac hover:text-cognac disabled:opacity-50"
                    >
                      {cancellingId === booking.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Cancel Booking
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ProfileShell>
    </PageTransitionWrapper>
  );
}
