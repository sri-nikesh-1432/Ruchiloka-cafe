'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import { LoginSchema } from '@ruchiloka/shared';
import { z } from 'zod';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { buildGoogleOAuthStartUrl, validateSafeInternalRedirect } from '@/config/urls';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

type LoginValues = z.infer<typeof LoginSchema>;

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshAuth, pushToast } = useApp();
  const [serverError, setServerError] = useState<string | null>(null);

  const nextUrl = validateSafeInternalRedirect(searchParams.get('next'), '/profile');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (oauthError) {
      setServerError(
        oauthError === 'access_denied'
          ? 'Google sign-in was cancelled. You can retry below or sign in with email.'
          : 'Google authentication could not be completed. Please try again.'
      );
    }
  }, [oauthError]);

  useEffect(() => {
    if (user) {
      router.replace(nextUrl);
    }
  }, [user, nextUrl, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await api.auth.login(values);
      await refreshAuth();
      pushToast({ title: 'Welcome back to Ruchiloka Café', tone: 'accent' });
      router.push(nextUrl);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Invalid email or password.');
    }
  };

  const handleGoogleSignIn = () => {
    try {
      const target = buildGoogleOAuthStartUrl(nextUrl);
      window.location.href = target;
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
              <h1 className="font-serif text-3xl font-semibold text-dark-brown">Welcome Back</h1>
              <p className="mt-1 text-sm text-coffee-muted">
                Sign in to sync your tray, view reservations, and manage bookings.
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
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-beige-border bg-white px-5 py-3.5 text-sm font-semibold text-dark-brown shadow-sm transition-all hover:border-cognac hover:bg-cream"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center py-1">
            <span className="flex-1 border-t border-beige-border" />
            <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-coffee-soft">
              or with email
            </span>
            <span className="flex-1 border-t border-beige-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-[0.16em] text-coffee mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
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
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-[0.16em] text-coffee mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
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
                <LogIn className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-coffee-muted">
            New to Ruchiloka Café?{' '}
            <Link
              href={`/register${nextUrl !== '/profile' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
              className="font-semibold text-cognac hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-40 pb-24 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cognac" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
