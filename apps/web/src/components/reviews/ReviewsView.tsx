'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  MessageSquarePlus,
  Search,
  Sparkles,
  Star,
  Store,
  Upload,
  X,
} from 'lucide-react';
import {
  ADDITIONAL_GOOGLE_REVIEWERS,
  GOOGLE_REVIEW_SUMMARY,
  SUPPLIED_GOOGLE_REVIEWS,
  VERIFIED_LINKS,
  type WebsiteReviewDto,
  type WebsiteReviewStatsDto,
} from '@ruchiloka/shared';
import { api } from '@/lib/api/endpoints';
import { useApp } from '@/context/AppContext';
import {
  BorderDrawReveal,
  EditorialReveal,
  PageTransitionWrapper,
  TextReveal,
} from '@/components/motion/MotionPrimitives';

type GoogleFilterKey =
  | 'all'
  | 'owner-replies'
  | 'breakfast-coffee'
  | 'shakes-juices'
  | 'ambience'
  | 'constructive';

export function ReviewsView() {
  const { pushToast } = useApp();

  // Dynamic approved Website Reviews from PostgreSQL
  const [websiteReviews, setWebsiteReviews] = useState<WebsiteReviewDto[]>([]);
  const [websiteStats, setWebsiteStats] = useState<WebsiteReviewStatsDto>({
    approvedCount: 0,
    averageRating: null,
  });
  const [loadingWebsiteReviews, setLoadingWebsiteReviews] = useState(true);

  // Supplied Google Reviews Filters
  const [googleSearch, setGoogleSearch] = useState('');
  const [googleFilter, setGoogleFilter] = useState<GoogleFilterKey>('all');
  const [showAdditionalNames, setShowAdditionalNames] = useState(false);

  // Write-a-Review Form State (no login required)
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingWebsiteReviews(true);
    api.reviews
      .listApproved()
      .then((res) => {
        if (!active) return;
        setWebsiteReviews(res.websiteReviews);
        setWebsiteStats(res.websiteStats);
      })
      .catch(() => {
        // Keep empty website reviews gracefully if offline
      })
      .finally(() => {
        if (active) setLoadingWebsiteReviews(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setFormError('Please select a JPG, PNG, WebP, or AVIF image file.');
      return;
    }
    if (file.size > 1500 * 1024) {
      setFormError('Uploaded photograph must be smaller than 1.5 MB.');
      return;
    }
    setFormError(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmittedConfirmation(null);

    const trimmedName = customerName.trim();
    const trimmedMessage = message.trim();
    if (trimmedName.length < 2) {
      setFormError('Please enter your name (minimum 2 characters).');
      return;
    }
    if (rating < 1 || rating > 5) {
      setFormError('Please choose a rating between 1 and 5 stars.');
      return;
    }
    if (trimmedMessage.length < 8) {
      setFormError('Please share at least 8 characters describing your experience.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.reviews.submit({
        customerName: trimmedName,
        rating,
        title: title.trim() || undefined,
        message: trimmedMessage,
        photoFile,
      });
      setSubmittedConfirmation(
        res.message ||
          'Thank you! Your review has been submitted and is pending admin moderation.'
      );
      setCustomerName('');
      setRating(5);
      setTitle('');
      setMessage('');
      setPhotoFile(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
        setPhotoPreviewUrl(null);
      }
      pushToast({
        title: 'Review Submitted',
        description: 'Pending moderation before appearing in the public feed.',
        tone: 'accent',
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not submit review right now. Please try again.';
      setFormError(msg);
      pushToast({
        title: 'Submission Failed',
        description: msg,
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGoogleReviews = useMemo(() => {
    const q = googleSearch.trim().toLowerCase();
    return SUPPLIED_GOOGLE_REVIEWS.filter((item) => {
      if (googleFilter === 'owner-replies' && !item.ownerResponse) return false;
      if (
        googleFilter === 'breakfast-coffee' &&
        !/pesarattu|breakfast|coffee|idli|break fast/i.test(
          `${item.reviewText} ${item.visitDetails ?? ''} ${item.ownerResponse ?? ''}`
        )
      ) {
        return false;
      }
      if (
        googleFilter === 'shakes-juices' &&
        !/thickshake|milkshake|strawberry|juice|sugarcane|kaju/i.test(item.reviewText)
      ) {
        return false;
      }
      if (
        googleFilter === 'ambience' &&
        !/ambience|ambiance|peaceful|chill|projector|outdoor|games|vibe|colony/i.test(
          item.reviewText
        )
      ) {
        return false;
      }
      if (
        googleFilter === 'constructive' &&
        !/disappointed|wait time|slower|speed|waiting|no maintenance|why only/i.test(
          item.reviewText
        )
      ) {
        return false;
      }
      if (q) {
        const hay = `${item.reviewerName} ${item.reviewTitle ?? ''} ${item.reviewText} ${
          item.ownerResponse ?? ''
        }`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [googleFilter, googleSearch]);

  const activeStarPreview = hoverRating ?? rating;

  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <div className="editorial-container space-y-14">
        {/* Header */}
        <div className="border-b border-beige-border pb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="editorial-kicker">Guest Voices · Kukatpally</span>
            <h1 className="editorial-heading text-4xl sm:text-6xl font-semibold leading-tight">
              <TextReveal>Customer Reviews &amp; Stories</TextReveal>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-coffee-muted">
              Verified Google Business Profile feedback supplied by our café team is displayed
              separately from reviews submitted directly on the Ruchiloka website.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="#write-review"
              className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Write a Review
            </a>
            <a
              href={VERIFIED_LINKS.googleMapsCanonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-ivory px-6 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac transition-colors"
            >
              Read Our Google Reviews
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Two Strictly Separate Rating Summaries */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* 1. Google Business Profile Card */}
          <EditorialReveal className="lg:col-span-7 rounded-[2rem] border border-beige-border bg-ivory p-7 sm:p-9 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-beige px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-coffee">
                  <Store className="h-3 w-3 text-cognac" />
                  Google Business Profile
                </span>
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="font-serif text-5xl font-semibold text-dark-brown">
                    {GOOGLE_REVIEW_SUMMARY.rating}
                  </span>
                  <span className="text-sm font-medium text-coffee-muted">/ 5.0</span>
                  <div className="flex items-center gap-1 pl-1" aria-label="4.7 out of 5 stars on Google">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= 5
                            ? 'fill-cognac text-cognac'
                            : 'text-beige-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-medium text-coffee-muted">
                  Based on {GOOGLE_REVIEW_SUMMARY.reviewCount} reviews on Google Maps · Not
                  combined with website submissions
                </p>
              </div>

              <a
                href={VERIFIED_LINKS.googleMapsCanonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-dark-brown px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
              >
                Open Google Listing
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="space-y-2 border-t border-beige-border/70 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-coffee-muted">
                Topics Frequently Mentioned on Google Maps
              </p>
              <div className="flex flex-wrap gap-2">
                {GOOGLE_REVIEW_SUMMARY.topicHighlights.map((topic) => (
                  <span
                    key={topic.label}
                    className="rounded-full border border-beige-border bg-cream px-3 py-1 text-xs font-medium text-coffee"
                  >
                    {topic.label}{' '}
                    <span className="font-mono text-[11px] text-cognac">({topic.count})</span>
                  </span>
                ))}
              </div>
            </div>
          </EditorialReveal>

          {/* 2. Separate Website Reviews Summary Card */}
          <EditorialReveal className="lg:col-span-5 rounded-[2rem] border border-beige-border bg-beige-soft p-7 sm:p-9 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cognac border border-beige-border">
                <Sparkles className="h-3 w-3" />
                Ruchiloka Website Reviews
              </span>
              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-serif text-5xl font-semibold text-dark-brown">
                  {websiteStats.averageRating !== null
                    ? websiteStats.averageRating.toFixed(1)
                    : '—'}
                </span>
                <span className="text-sm text-coffee-muted">
                  {websiteStats.approvedCount === 0
                    ? 'Awaiting first moderated review'
                    : `across ${websiteStats.approvedCount} verified website ${
                        websiteStats.approvedCount === 1 ? 'review' : 'reviews'
                      }`}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-coffee-muted">
                Reviews submitted directly on this website are moderated by Ruchiloka staff before
                publishing to prevent spam and keep ratings trustworthy.
              </p>
            </div>

            <div className="border-t border-beige-border pt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-coffee-muted">Visited us recently?</span>
              <a
                href="#write-review"
                className="inline-flex items-center gap-1.5 rounded-full border border-dark-brown px-4 py-2 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:bg-dark-brown hover:text-cream transition-colors"
              >
                Share Your Review
              </a>
            </div>
          </EditorialReveal>
        </div>

        <BorderDrawReveal>
          <div className="h-px w-full bg-beige-border" />
        </BorderDrawReveal>

        {/* Section A: Website Community Reviews + Write-a-Review Form */}
        <section className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Approved Website Reviews Feed */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <span className="editorial-kicker">Submitted via Website</span>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-dark-brown">
                Website Guest Reviews
              </h2>
            </div>

            {loadingWebsiteReviews ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-36 animate-pulse rounded-3xl border border-beige-border bg-ivory"
                  />
                ))}
              </div>
            ) : websiteReviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-beige-border bg-ivory/70 p-8 text-center space-y-2">
                <p className="font-serif text-xl font-semibold text-dark-brown">
                  Be the first to share a website review
                </p>
                <p className="text-xs text-coffee-muted max-w-sm mx-auto">
                  Approved submissions submitted on Ruchiloka&apos;s website appear right here once
                  reviewed by our team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {websiteReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="rounded-3xl border border-beige-border bg-ivory p-6 space-y-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-dark-brown">
                          {rev.customerName}
                        </h3>
                        <p className="font-mono text-[11px] text-coffee-muted">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5" aria-label={`${rev.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= rev.rating
                                ? 'fill-cognac text-cognac'
                                : 'text-beige-border'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.title && (
                      <p className="text-sm font-semibold text-dark-brown">{rev.title}</p>
                    )}
                    <p className="text-sm leading-relaxed text-coffee whitespace-pre-line">
                      {rev.message}
                    </p>

                    {rev.photoUrl && (
                      <div className="overflow-hidden rounded-2xl border border-beige-border max-w-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rev.photoUrl}
                          alt={`Guest photograph uploaded by ${rev.customerName}`}
                          loading="lazy"
                          className="h-44 w-full object-cover"
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Write a Review Form */}
          <div
            id="write-review"
            className="lg:col-span-6 scroll-mt-28 rounded-[2rem] border border-beige-border bg-ivory p-7 sm:p-9 shadow-sm space-y-6"
          >
            <div className="space-y-1.5">
              <span className="editorial-kicker">No Account Required</span>
              <h2 className="font-serif text-3xl font-semibold text-dark-brown">
                Write a Review
              </h2>
              <p className="text-xs text-coffee-muted">
                Tell others about your morning tiffins, thickshakes, filter coffee, or courtyard
                evening at Ruchiloka.
              </p>
            </div>

            {submittedConfirmation && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-emerald-700/20 bg-emerald-50/70 p-4 text-sm text-emerald-950"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-semibold">Thank you for sharing your visit!</p>
                  <p className="text-xs mt-0.5 text-emerald-900">{submittedConfirmation}</p>
                </div>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="rounded-2xl border border-red-700/25 bg-red-50 p-3.5 text-xs font-medium text-red-900"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Your Rating *
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      aria-label={`Rate ${starValue} out of 5 stars`}
                      className="rounded-full p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          starValue <= activeStarPreview
                            ? 'fill-cognac text-cognac'
                            : 'text-beige-border'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-mono text-xs font-semibold text-coffee-muted">
                    {activeStarPreview} / 5
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5"
                >
                  Your Name *
                </label>
                <input
                  id="review-name"
                  type="text"
                  required
                  maxLength={80}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Karthik Reddy"
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-2.5 text-sm text-dark-brown placeholder:text-coffee-muted/60 focus:border-cognac focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="review-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5"
                >
                  Review Title <span className="font-normal normal-case text-coffee-muted">(Optional)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Peaceful evening chai & strawberry milkshake"
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-2.5 text-sm text-dark-brown placeholder:text-coffee-muted/60 focus:border-cognac focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="review-message"
                  className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5"
                >
                  Your Experience *
                </label>
                <textarea
                  id="review-message"
                  required
                  rows={4}
                  maxLength={1500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What did you order, and how was the ambience & hospitality?"
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-2.5 text-sm text-dark-brown placeholder:text-coffee-muted/60 focus:border-cognac focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1.5">
                  Attach a Café Photo <span className="font-normal normal-case text-coffee-muted">(Optional, max 1.5 MB)</span>
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-beige-border bg-cream px-4 py-2 text-xs font-semibold text-dark-brown hover:border-cognac transition-colors">
                    <Upload className="h-3.5 w-3.5 text-cognac" />
                    Choose Photograph
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                  </label>
                  {photoPreviewUrl && (
                    <div className="flex items-center gap-2 rounded-full border border-beige-border bg-cream pl-2 pr-3 py-1">
                      <Camera className="h-3.5 w-3.5 text-cognac" />
                      <span className="max-w-[160px] truncate text-xs text-coffee">
                        {photoFile?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
                          setPhotoPreviewUrl(null);
                        }}
                        aria-label="Remove attached photo"
                        className="text-coffee-muted hover:text-dark-brown"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Submitting Review...' : 'Submit Review for Approval'}
              </button>
            </form>
          </div>
        </section>

        <BorderDrawReveal>
          <div className="h-px w-full bg-beige-border" />
        </BorderDrawReveal>

        {/* Section B: Supplied Google Reviews Record (All 37 + 20 Reviewer Names) */}
        <section className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2 max-w-2xl">
              <span className="editorial-kicker">
                Google Maps Archive · {SUPPLIED_GOOGLE_REVIEWS.length} Supplied Records
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-dark-brown">
                Reviews from Google Maps
              </h2>
              <p className="text-xs sm:text-sm text-coffee-muted">
                Preserved verbatim from owner-supplied Google Business records alongside owner
                replies. Individual star ratings not included in the supplied records are not
                fabricated.
              </p>
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee-muted" />
              <input
                type="search"
                value={googleSearch}
                onChange={(e) => setGoogleSearch(e.target.value)}
                placeholder="Filter by dish, ambience, name..."
                aria-label="Search supplied Google reviews"
                className="w-full rounded-full border border-beige-border bg-ivory pl-10 pr-4 py-2.5 text-xs text-dark-brown placeholder:text-coffee-muted/70 focus:border-cognac focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', `All Supplied (${SUPPLIED_GOOGLE_REVIEWS.length})`],
                ['owner-replies', 'With Owner Replies'],
                ['breakfast-coffee', 'Tiffins & Coffee'],
                ['shakes-juices', 'Milkshakes & Juices'],
                ['ambience', 'Courtyard & Ambience'],
                ['constructive', 'Constructive Feedback'],
              ] as Array<[GoogleFilterKey, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setGoogleFilter(key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                  googleFilter === key
                    ? 'bg-dark-brown text-cream shadow-sm'
                    : 'border border-beige-border bg-ivory text-coffee hover:border-cognac'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filteredGoogleReviews.length === 0 ? (
            <div className="rounded-3xl border border-beige-border bg-ivory p-10 text-center text-sm text-coffee-muted">
              No matching Google review records for this search or filter.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredGoogleReviews.map((review) => (
                <article
                  key={review.id}
                  className="flex flex-col justify-between rounded-3xl border border-beige-border bg-ivory p-6 space-y-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-dark-brown">
                          {review.reviewerName}
                        </h3>
                        <p className="text-[11px] text-coffee-muted">
                          {review.reviewerMeta} · {review.postedAgo}
                        </p>
                      </div>
                      <span className="rounded-full bg-beige px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coffee">
                        Google Review
                      </span>
                    </div>

                    {review.visitDetails && (
                      <p className="font-mono text-[11px] text-cognac">{review.visitDetails}</p>
                    )}

                    {review.reviewTitle && (
                      <p className="font-serif text-base font-semibold text-dark-brown">
                        &ldquo;{review.reviewTitle}&rdquo;
                      </p>
                    )}

                    <p className="text-sm leading-relaxed text-coffee whitespace-pre-line">
                      {review.reviewText}
                    </p>

                    {review.translationNote && (
                      <p className="text-[11px] italic text-coffee-muted">
                        Note: {review.translationNote}
                      </p>
                    )}

                    {review.isTruncated && (
                      <p className="text-[11px] text-coffee-muted">
                        Supplied excerpt truncated —{' '}
                        <a
                          href={VERIFIED_LINKS.googleMapsCanonicalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-cognac underline underline-offset-2"
                        >
                          read full review on Google
                        </a>
                        .
                      </p>
                    )}
                  </div>

                  {review.ownerResponse && (
                    <div className="rounded-2xl border border-beige-border/80 bg-cream/90 p-4 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cognac">
                        Response from Ruchiloka Owner
                      </p>
                      <p className="text-xs leading-relaxed text-coffee whitespace-pre-line">
                        {review.ownerResponse}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* 20 Additional Supplied Reviewer Names */}
          <div className="rounded-3xl border border-beige-border bg-beige-soft p-6 space-y-4">
            <button
              type="button"
              onClick={() => setShowAdditionalNames((s) => !s)}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={showAdditionalNames}
            >
              <div>
                <h3 className="font-serif text-xl font-semibold text-dark-brown">
                  Additional Google Reviewers Visible in Listing ({ADDITIONAL_GOOGLE_REVIEWERS.length})
                </h3>
                <p className="text-xs text-coffee-muted mt-0.5">
                  Reviewer profiles recorded from the Google listing whose review text was not
                  included in the supplied records.
                </p>
              </div>
              {showAdditionalNames ? (
                <ChevronUp className="h-5 w-5 text-dark-brown shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-dark-brown shrink-0" />
              )}
            </button>

            {showAdditionalNames && (
              <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4">
                {ADDITIONAL_GOOGLE_REVIEWERS.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-beige-border bg-ivory px-4 py-3 text-xs space-y-0.5"
                  >
                    <p className="font-semibold text-dark-brown">{entry.reviewerName}</p>
                    <p className="text-coffee-muted">
                      {entry.meta}
                      {entry.postedAgo ? ` · ${entry.postedAgo}` : ''}
                    </p>
                    <p className="text-[10px] italic text-coffee-muted/80">
                      Review text not supplied
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="text-center pt-2">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-ivory px-6 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac"
          >
            Explore Ruchiloka Photo Gallery
          </Link>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
