'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { UpdateProfileSchema } from '@ruchiloka/shared';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { ProfileShell } from '@/components/profile/ProfileShell';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

type ProfileFormValues = z.infer<typeof UpdateProfileSchema>;

export default function ProfilePage() {
  const { user, refreshAuth, pushToast } = useApp();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, phone: user.phone ?? '' });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await api.auth.updateProfile(values);
      await refreshAuth();
      pushToast({ title: 'Profile updated', tone: 'accent' });
    } catch (err) {
      pushToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      });
    }
  };

  return (
    <PageTransitionWrapper>
      <ProfileShell
        title="Your Profile"
        subtitle="Manage your contact details used across table reservations and communications."
      >
        {user && (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="lg:col-span-7 rounded-3xl border border-beige-border bg-ivory p-6 sm:p-8 space-y-5 shadow-sm"
            >
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                >
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  {...register('name')}
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-cognac">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2">
                  Email Address
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-beige-border bg-beige-soft px-4 py-3 text-sm text-coffee-muted">
                  <span>{user.email}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-ivory px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dark-brown">
                    {user.emailVerified && <CheckCircle2 className="h-3 w-3 text-sky-blue-deep" />}
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-cognac">{errors.phone.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Changes</span>
              </button>
            </form>

            <div className="lg:col-span-5 rounded-3xl border border-beige-border bg-beige-soft p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-xl font-semibold text-dark-brown">Account Status</h2>
              <div className="space-y-3 text-sm text-coffee">
                <div className="flex justify-between">
                  <span className="text-coffee-muted">Role</span>
                  <span className="font-mono font-semibold text-dark-brown">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-coffee-muted">Member Since</span>
                  <span className="font-mono text-xs text-dark-brown">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ProfileShell>
    </PageTransitionWrapper>
  );
}
