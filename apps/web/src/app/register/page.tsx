'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { RegisterSchema } from '@ruchiloka/shared';
import { z } from 'zod';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { buildGoogleOAuthStartUrl, validateSafeInternalRedirect } from '@/config/urls';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

type RegisterValues = z.infer<typeof RegisterSchema>;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth, pushToast } = useApp();
  const [serverError, setServerError] = useState<string | null>(null);

  const nextUrl = validateSafeInternalRedirect(searchParams.get('next'), '/profile');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      const res = await api.auth.register(values);
      await refreshAuth();
      pushToast({
        title: 'Account created',
        description: res.verificationEmailSent
          ? 'A verification link has been sent to your email.'
          : 'Welcome to Ruchiloka Café.',
        tone: 'accent',
      });
      router.push(nextUrl);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to register right now.');
    }
  };

  const handleGoogleSignUp = () => {
    try {
      window.location.href = buildGoogleOAuthStartUrl(nextUrl);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'OAuth URL configuration is unavailable.'
      );
    }
  };

  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <div className="editorial-container max-w-md">
        <div className="rounded-[2rem] border border-beige-border bg-ivory p-8 sm:p-10 shadow-editorial space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <BrandLogo variant="light" size="lg" href="/" />
            <div>
              <h1 className="font-serif text-3xl font-semibold text-dark-brown">
                Join Ruchiloka Café
              </h1>
              <p className="mt-1 text-sm text-coffee-muted">
                Save your tray, track table reservations, and manage bookings in one place.
              </p>
            </div>
          </div>

          {serverError && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-cognac/35 bg-cognac-light/25 p-3.5 text-xs text-dark-brown">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-cognac" />
              <span>{serverError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-beige-border bg-white px-5 py-3.5 text-sm font-semibold text-dark-brown shadow-sm transition-all hover:border-cognac hover:bg-cream"
          >
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center py-1">
            <span className="flex-1 border-t border-beige-border" />
            <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-coffee-soft">
              or create with email
            </span>
            <span className="flex-1 border-t border-beige-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-semibold uppercase tracking-[0.16em] text-coffee mb-1.5"
              >
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                {...register('name')}
                className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-cognac">{errors.name.message}</p>}
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold uppercase tracking-[0.16em] text-coffee mb-1.5"
              >
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-cognac">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-phone"
                className="block text-xs font-semibold uppercase tracking-[0.16em] text-coffee mb-1.5"
              >
                Phone Number (Optional)
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                {...register('phone')}
                className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-cognac">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold uppercase tracking-[0.16em] text-coffee mb-1.5"
              >
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                {...register('password')}
                className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-cognac">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-dark-brown px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-cognac disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-coffee-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-cognac hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-40 pb-24 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cognac" />
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
