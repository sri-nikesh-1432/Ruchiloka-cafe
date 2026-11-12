'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Instagram,
  MapPin,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AUTHENTIC_GALLERY_ITEMS,
  VERIFIED_LINKS,
  type GalleryPhotoDto,
} from '@ruchiloka/shared';
import { api } from '@/lib/api/endpoints';
import {
  BorderDrawReveal,
  EditorialReveal,
  PageTransitionWrapper,
  TextReveal,
} from '@/components/motion/MotionPrimitives';

const FALLBACK_GALLERY_PHOTOS: GalleryPhotoDto[] = AUTHENTIC_GALLERY_ITEMS.map((item, idx) => ({
  id: `static-${idx}`,
  ...item,
  isPublished: true,
  createdAt: '2026-11-12T00:00:00.000Z',
}));

export function GalleryView() {
  const [photos, setPhotos] = useState<GalleryPhotoDto[]>(FALLBACK_GALLERY_PHOTOS);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.gallery
      .list()
      .then((res) => {
        if (!active) return;
        if (res.photos && res.photos.length > 0) {
          setPhotos(res.photos);
        }
      })
      .catch(() => {
        // Retain curated manifest fallback smoothly
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openLightbox = useCallback(
    (photoId: string) => {
      const idx = photos.findIndex((p) => p.id === photoId);
      if (idx >= 0) {
        setZoomed(false);
        setLightboxIndex(idx);
      }
    },
    [photos]
  );

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setZoomed(false);
  }, []);

  const goPrev = useCallback(() => {
    setZoomed(false);
    setLightboxIndex((curr) => {
      if (curr === null || photos.length === 0) return null;
      return (curr - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const goNext = useCallback(() => {
    setZoomed(false);
    setLightboxIndex((curr) => {
      if (curr === null || photos.length === 0) return null;
      return (curr + 1) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  const currentPhoto =
    lightboxIndex !== null ? photos[lightboxIndex] ?? null : null;

  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <div className="editorial-container space-y-12">
        {/* Editorial Hero Header */}
        <div className="border-b border-beige-border pb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="editorial-kicker">Authentic Visual Archive · Kukatpally</span>
            <h1 className="editorial-heading text-4xl sm:text-6xl font-semibold leading-tight">
              <TextReveal>Ruchiloka Gallery</TextReveal>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-coffee-muted">
              Every photograph below is captured from our real courtyard on Road No. 25,
              Vivekananda Nagar — sourced directly from Ruchiloka Café&apos;s Google Business Profile
              and{' '}
              <a
                href={VERIFIED_LINKS.instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cognac underline underline-offset-4 hover:text-dark-brown"
              >
                @ruchilokacafe.in
              </a>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={VERIFIED_LINKS.instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-beige-border bg-ivory px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-dark-brown transition-colors hover:border-cognac"
            >
              <Instagram className="h-4 w-4 text-cognac" />
              Follow Us on Instagram
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={VERIFIED_LINKS.googleMapsCanonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-cognac"
            >
              <MapPin className="h-4 w-4" />
              View on Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-coffee-muted">
          <span>Showing all {photos.length} unified photographs from Google Business Profile &amp; @ruchilokacafe.in</span>
          <span>Click any photograph to open full-size lightbox</span>
        </div>

        <BorderDrawReveal>
          <div className="h-px w-full bg-beige-border" />
        </BorderDrawReveal>

        {loading && photos.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 animate-pulse rounded-3xl border border-beige-border bg-ivory"
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-3xl border border-beige-border bg-ivory p-12 text-center space-y-4">
            <Camera className="mx-auto h-10 w-10 text-cognac" />
            <h2 className="font-serif text-2xl font-semibold text-dark-brown">
              No photographs available yet
            </h2>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => {
              const isBroken = Boolean(failedImages[photo.id]);
              return (
                <article
                  key={photo.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-beige-border bg-ivory shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cognac/60 hover:shadow-editorial"
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(photo.id)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-beige/40 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac"
                    aria-label={`View full photograph: ${photo.title}`}
                  >
                    {!isBroken ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.imageUrl}
                        alt={photo.altText}
                        loading="lazy"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [photo.id]: true }))
                        }
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs text-coffee-muted">
                        Photograph preview unavailable
                      </div>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-full bg-dark-brown/80 p-2 text-cream opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-xl font-semibold text-dark-brown">
                        {photo.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-coffee-muted line-clamp-2">
                        {photo.caption}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-beige-border/70 pt-3 text-[11px] text-coffee-muted">
                      <span className="truncate pr-2">{photo.attribution}</span>
                      <a
                        href={photo.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 font-semibold text-cognac hover:text-dark-brown"
                      >
                        Source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Visit / Reviews Bottom Strip */}
        <EditorialReveal className="rounded-[2rem] border border-beige-border bg-beige-soft p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <span className="editorial-kicker">Experience It Live</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-dark-brown">
              Read Guest Stories or Reserve an Evening Table
            </h2>
            <p className="text-sm text-coffee-muted">
              Plot No. 174, Road No. 25, Vivekananda Nagar, Kukatpally · 6:30 AM – 11:00 PM IST
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/reviews"
              className="rounded-full border border-beige-border bg-ivory px-6 py-3 text-xs font-semibold uppercase tracking-wider text-dark-brown hover:border-cognac transition-colors"
            >
              Read Customer Reviews
            </Link>
            <Link
              href="/reserve"
              className="rounded-full bg-dark-brown px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
            >
              Reserve a Table
            </Link>
          </div>
        </EditorialReveal>
      </div>

      {/* Lightbox Modal */}
      {currentPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentPhoto.title}
          onClick={closeLightbox}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark-brown/92 p-4 sm:p-8 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-beige/20 bg-ivory shadow-editorial"
          >
            <div className="flex items-center justify-between border-b border-beige-border px-5 py-3.5">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cognac">
                  {(lightboxIndex ?? 0) + 1} / {photos.length}
                </span>
                <h2 className="truncate font-serif text-lg sm:text-xl font-semibold text-dark-brown">
                  {currentPhoto.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-beige-border bg-cream text-dark-brown hover:border-cognac"
                  aria-label={zoomed ? 'Zoom out image' : 'Zoom in image'}
                >
                  {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-beige-border bg-cream text-dark-brown hover:border-cognac"
                  aria-label="Close lightbox"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-auto bg-dark-brown/95 flex items-center justify-center p-4 min-h-[300px] sm:min-h-[480px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPhoto.imageUrl}
                alt={currentPhoto.altText}
                className={`rounded-xl object-contain transition-transform duration-300 ${
                  zoomed ? 'max-h-none scale-125 cursor-zoom-out' : 'max-h-[65vh] w-auto cursor-zoom-in'
                }`}
                onClick={() => setZoomed((z) => !z)}
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-dark-brown shadow-md hover:bg-cream"
                    aria-label="Previous photograph"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-dark-brown shadow-md hover:bg-cream"
                    aria-label="Next photograph"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-beige-border bg-ivory px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-coffee">{currentPhoto.caption}</p>
                <p className="text-xs text-coffee-muted">
                  Attribution: {currentPhoto.attribution}
                  {currentPhoto.permissionNote ? ` · ${currentPhoto.permissionNote}` : ''}
                </p>
              </div>
              <a
                href={currentPhoto.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-dark-brown px-5 py-2 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac"
              >
                Original Source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </PageTransitionWrapper>
  );
}
