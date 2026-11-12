'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { validateSafeInternalRedirect } from '@/config/urls';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth, pushToast } = useApp();

  const status = searchParams.get('status');
  const errorParam = searchParams.get('error');
  const nextUrl = validateSafeInternalRedirect(searchParams.get('next'), '/profile');

  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Completing your sign-in securely...');

  useEffect(() => {
    let active = true;

    async function finalize() {
      if (status === 'error' || errorParam) {
        if (!active) return;
        setState('error');
        setMessage(
          errorParam === 'access_denied'
            ? 'Google sign-in was cancelled before completion.'
            : 'Authentication could not be verified. Please try signing in again.'
        );
        return;
      }

      const authenticatedUser = await refreshAuth();
      if (!active) return;

      if (authenticatedUser) {
        setState('success');
        setMessage(`Welcome, ${authenticatedUser.name}. Redirecting...`);
        pushToast({ title: 'Signed in with Google', tone: 'accent' });
        setTimeout(() => {
          router.replace(nextUrl);
        }, 700);
      } else {
        setState('error');
        setMessage(
          'Your session cookie was not established. Please ensure cookies are allowed and try again.'
        );
      }
    }

    void finalize();
    return () => {
      active = false;
    };
  }, [status, errorParam, nextUrl, refreshAuth, pushToast, router]);

  return (
    <PageTransitionWrapper className="pt-36 pb-24">
      <div className="editorial-container max-w-md">
        <div className="rounded-[2rem] border border-beige-border bg-ivory p-10 text-center shadow-card space-y-5">
          {state === 'verifying' && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-cognac" />
              <h1 className="font-serif text-2xl font-semibold text-dark-brown">
                Verifying Account
              </h1>
            </>
          )}
          {state === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-sky-blue-deep" />
              <h1 className="font-serif text-2xl font-semibold text-dark-brown">
                Sign-In Complete
              </h1>
            </>
          )}
          {state === 'error' && (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-cognac" />
              <h1 className="font-serif text-2xl font-semibold text-dark-brown">
                Sign-In Interrupted
              </h1>
            </>
          )}

          <p className="text-sm text-coffee-muted">{message}</p>

          {state === 'error' && (
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex rounded-full bg-dark-brown px-7 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageTransitionWrapper>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-40 pb-24 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cognac" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
