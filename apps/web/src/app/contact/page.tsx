'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, CheckCircle2, Clock, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { BUSINESS_INFO, ContactFormSchema } from '@ruchiloka/shared';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

type ContactValues = z.infer<typeof ContactFormSchema>;

export default function ContactPage() {
  const { publicSettings, pushToast } = useApp();
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactValues) => {
    try {
      const res = await api.contact.submit(values);
      setSubmittedId(res.id);
      reset();
      pushToast({
        title: 'Enquiry sent',
        description: 'Our Kukatpally team will respond to your email shortly.',
        tone: 'accent',
      });
    } catch (err) {
      pushToast({
        title: 'Could not send enquiry',
        description: err instanceof Error ? err.message : 'Please try again or call us directly.',
        tone: 'error',
      });
    }
  };

  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <div className="editorial-container">
        <div className="border-b border-beige-border pb-8 max-w-3xl">
          <span className="editorial-kicker">Get in Touch</span>
          <h1 className="mt-2 editorial-heading text-4xl sm:text-5xl font-semibold">
            Contact Ruchiloka Café
          </h1>
          <p className="mt-3 text-base text-coffee-muted">
            Questions about private group mornings, allergen details, catering enquiries, or feedback?
            Write to us below or reach our Kukatpally desk directly.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            {submittedId ? (
              <div className="rounded-[2rem] border border-beige-border bg-ivory p-8 sm:p-10 shadow-card space-y-5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-blue-soft text-sky-blue-deep">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <h2 className="font-serif text-3xl font-semibold text-dark-brown">
                  Thank you for writing to us
                </h2>
                <p className="text-sm leading-relaxed text-coffee-muted">
                  Your message has been logged (Reference:{' '}
                  <span className="font-mono text-dark-brown">{submittedId.slice(0, 8)}</span>) and
                  forwarded to the Ruchiloka Café team via email.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedId(null)}
                  className="rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="rounded-[2rem] border border-beige-border bg-ivory p-6 sm:p-10 shadow-card space-y-5"
                noValidate
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Full name"
                      {...register('name')}
                      className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-cognac">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      {...register('email')}
                      className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-cognac">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Phone (Optional)
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
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
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      placeholder="Group booking, feedback, menu query..."
                      {...register('subject')}
                      className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-xs text-cognac">{errors.subject.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-coffee mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us how we can make your visit special..."
                    {...register('message')}
                    className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown focus:border-cognac focus:outline-none"
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-cognac">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-cognac disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Info & Map */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-beige-border bg-beige-soft p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-cognac" />
                <div>
                  <h2 className="font-serif text-xl font-semibold text-dark-brown">Café Address</h2>
                  <p className="mt-1 text-sm leading-relaxed text-coffee-muted">
                    {publicSettings.cafeAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-cognac" />
                <div>
                  <h2 className="font-serif text-xl font-semibold text-dark-brown">Phone</h2>
                  <a
                    href={BUSINESS_INFO.phoneHref}
                    className="mt-1 inline-block font-mono text-sm text-coffee hover:text-cognac"
                  >
                    {publicSettings.cafePhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-cognac" />
                <div>
                  <h2 className="font-serif text-xl font-semibold text-dark-brown">Official Email</h2>
                  <a
                    href={BUSINESS_INFO.emailHref}
                    className="mt-1 inline-block font-sans text-sm font-medium text-coffee hover:text-cognac"
                  >
                    {BUSINESS_INFO.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-cognac" />
                <div className="space-y-1.5 text-xs text-coffee-muted">
                  <p className="font-serif text-base font-semibold text-dark-brown">Hours (IST)</p>
                  {publicSettings.operatingHours.map((slot) => (
                    <p key={slot.key}>
                      <span className="font-semibold text-dark-brown">{slot.label}:</span>{' '}
                      <span className="font-mono">{slot.displayHours}</span>
                    </p>
                  ))}
                </div>
              </div>

              <a
                href={BUSINESS_INFO.googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
              >
                Get Directions
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="overflow-hidden rounded-3xl border border-beige-border bg-beige aspect-[16/10]">
              <iframe
                title="Ruchiloka Café Map"
                src={BUSINESS_INFO.googleMapsEmbedUrl}
                loading="lazy"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
