'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { EDITORIAL_EASE } from '@/components/motion/MotionPrimitives';

export function ToastViewport() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.tone === 'error';
          const isInfo = toast.tone === 'info';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.25, ease: EDITORIAL_EASE }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-editorial backdrop-blur-md ${
                isError
                  ? 'border-cognac bg-dark-brown text-cream'
                  : isInfo
                    ? 'border-sky-blue bg-ivory text-dark-brown'
                    : 'border-beige-border bg-dark-brown text-cream'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {isError ? (
                  <AlertCircle className="h-4 w-4 text-cognac-light" />
                ) : isInfo ? (
                  <Info className="h-4 w-4 text-sky-blue-deep" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-cognac-light" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug">{toast.title}</p>
                {toast.description && (
                  <p
                    className={`mt-0.5 text-xs leading-relaxed ${
                      isInfo ? 'text-coffee-muted' : 'text-beige/85'
                    }`}
                  >
                    {toast.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className={`rounded-full p-1 transition-colors ${
                  isInfo ? 'text-coffee-muted hover:bg-beige' : 'text-beige/70 hover:bg-white/10'
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
