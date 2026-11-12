import { ReviewModerationStatus } from '@prisma/client';
import type {
  PublicReviewsPayloadDto,
  ReviewModerationStatus as SharedReviewStatus,
  WebsiteReviewDto,
} from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { storeUploadedImage } from '../../lib/uploads';
import { recordAuditLog } from '../audit/audit.service';

/**
 * Strips HTML tags and normalizes whitespace without destroying natural line breaks.
 */
export function sanitizeReviewText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function mapWebsiteReviewToDto(row: {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  message: string;
  photoUrl: string | null;
  status: ReviewModerationStatus;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WebsiteReviewDto {
  return {
    id: row.id,
    customerName: row.customerName,
    rating: row.rating,
    title: row.title,
    message: row.message,
    photoUrl: row.photoUrl,
    status: row.status as SharedReviewStatus,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listApprovedWebsiteReviews(): Promise<PublicReviewsPayloadDto> {
  const rows = await prisma.websiteReview.findMany({
    where: { status: ReviewModerationStatus.APPROVED },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const approvedCount = rows.length;
  const averageRating =
    approvedCount > 0
      ? Number(
          (rows.reduce((sum, item) => sum + item.rating, 0) / approvedCount).toFixed(1)
        )
      : null;

  return {
    websiteReviews: rows.map(mapWebsiteReviewToDto),
    websiteStats: {
      approvedCount,
      averageRating,
    },
  };
}

export async function createWebsiteReview(params: {
  customerName: string;
  rating: number;
  title?: string;
  message: string;
  file?: Express.Multer.File;
  ipAddress?: string;
  actorUserId?: string | null;
}): Promise<WebsiteReviewDto> {
  const cleanName = sanitizeReviewText(params.customerName);
  const cleanTitle = params.title ? sanitizeReviewText(params.title) : '';
  const cleanMessage = sanitizeReviewText(params.message);

  if (cleanName.length < 2) {
    throw new HttpError(400, 'Please enter a valid name.', 'VALIDATION_ERROR');
  }
  if (cleanMessage.length < 8) {
    throw new HttpError(
      400,
      'Please enter a review message of at least 8 characters.',
      'VALIDATION_ERROR'
    );
  }

  let photoUrl: string | null = null;
  if (params.file) {
    const uploaded = await storeUploadedImage({
      file: params.file,
      folder: 'ruchiloka/reviews',
      prefix: 'review',
      strictMagicBytes: true,
      allowDataUriFallbackInServerless: true,
    });
    photoUrl = uploaded.imageUrl;
  }

  const created = await prisma.websiteReview.create({
    data: {
      customerName: cleanName,
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      title: cleanTitle || null,
      message: cleanMessage,
      photoUrl,
      status: ReviewModerationStatus.PENDING,
      ipAddress: params.ipAddress ?? null,
    },
  });

  await recordAuditLog({
    actorUserId: params.actorUserId ?? null,
    action: 'WEBSITE_REVIEW_SUBMITTED',
    entityType: 'WebsiteReview',
    entityId: created.id,
    metadata: {
      rating: created.rating,
      hasPhoto: Boolean(photoUrl),
      status: created.status,
    },
    ipAddress: params.ipAddress,
  });

  return mapWebsiteReviewToDto(created);
}

export async function listAdminWebsiteReviews(statusFilter?: string) {
  const where =
    statusFilter && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)
      ? { status: statusFilter as ReviewModerationStatus }
      : undefined;

  const [rows, counts] = await Promise.all([
    prisma.websiteReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 250,
    }),
    prisma.websiteReview.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  const summary = {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
  };
  for (const row of counts) {
    const c = row._count._all;
    summary.totalCount += c;
    if (row.status === ReviewModerationStatus.PENDING) summary.pendingCount = c;
    if (row.status === ReviewModerationStatus.APPROVED) summary.approvedCount = c;
    if (row.status === ReviewModerationStatus.REJECTED) summary.rejectedCount = c;
  }

  return {
    reviews: rows.map(mapWebsiteReviewToDto),
    counts: summary,
  };
}

export async function moderateWebsiteReview(params: {
  id: string;
  status: SharedReviewStatus;
  adminNote?: string;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<WebsiteReviewDto> {
  const existing = await prisma.websiteReview.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new HttpError(404, 'Review not found.', 'REVIEW_NOT_FOUND');
  }

  const updated = await prisma.websiteReview.update({
    where: { id: params.id },
    data: {
      status: params.status as ReviewModerationStatus,
      adminNote: params.adminNote ? sanitizeReviewText(params.adminNote) : existing.adminNote,
      moderatedById: params.actor.id,
      moderatedAt: new Date(),
    },
  });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: `ADMIN_REVIEW_${params.status}`,
    entityType: 'WebsiteReview',
    entityId: updated.id,
    metadata: { customerName: updated.customerName, rating: updated.rating },
    ipAddress: params.ipAddress,
  });

  return mapWebsiteReviewToDto(updated);
}

export async function deleteWebsiteReview(params: {
  id: string;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<{ deleted: boolean }> {
  const existing = await prisma.websiteReview.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new HttpError(404, 'Review not found.', 'REVIEW_NOT_FOUND');
  }

  await prisma.websiteReview.delete({ where: { id: params.id } });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_REVIEW_DELETED',
    entityType: 'WebsiteReview',
    entityId: existing.id,
    metadata: { customerName: existing.customerName },
    ipAddress: params.ipAddress,
  });

  return { deleted: true };
}
