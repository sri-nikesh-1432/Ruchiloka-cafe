import { GallerySourcePlatform } from '@prisma/client';
import {
  AUTHENTIC_GALLERY_ITEMS,
  GALLERY_CATEGORY_LABELS,
  type GalleryCategorySlug,
  type GalleryPhotoDto,
  type PublicGalleryPayloadDto,
} from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { recordAuditLog } from '../audit/audit.service';

function slugifyGalleryTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'gallery-photo'}-${Date.now().toString(36)}`;
}

export function mapGalleryPhotoToDto(row: {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  imageUrl: string;
  width: number;
  height: number;
  caption: string;
  altText: string;
  sourcePlatform: GallerySourcePlatform;
  sourceUrl: string;
  attribution: string;
  isCustomerOrCreator: boolean;
  permissionNote: string | null;
  isFeaturedOnHome: boolean;
  showInInstagramPreview: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: Date;
}): GalleryPhotoDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    categorySlug: row.categorySlug as GalleryCategorySlug,
    imageUrl: row.imageUrl,
    width: row.width,
    height: row.height,
    caption: row.caption,
    altText: row.altText,
    sourcePlatform: row.sourcePlatform,
    sourceUrl: row.sourceUrl,
    attribution: row.attribution,
    isCustomerOrCreator: row.isCustomerOrCreator,
    permissionNote: row.permissionNote,
    isFeaturedOnHome: row.isFeaturedOnHome,
    showInInstagramPreview: row.showInInstagramPreview,
    isPublished: row.isPublished,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Ensures the verified authentic Ruchiloka photo manifest exists in the database on fresh deployments.
 */
export async function ensureBaselineGalleryPhotos(): Promise<void> {
  const existingCount = await prisma.galleryPhoto.count();
  if (existingCount > 0) return;

  for (const item of AUTHENTIC_GALLERY_ITEMS) {
    await prisma.galleryPhoto.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        slug: item.slug,
        title: item.title,
        categorySlug: item.categorySlug,
        imageUrl: item.imageUrl,
        width: item.width,
        height: item.height,
        caption: item.caption,
        altText: item.altText,
        sourcePlatform: item.sourcePlatform as GallerySourcePlatform,
        sourceUrl: item.sourceUrl,
        attribution: item.attribution,
        isCustomerOrCreator: item.isCustomerOrCreator,
        permissionNote: item.permissionNote,
        isFeaturedOnHome: item.isFeaturedOnHome,
        showInInstagramPreview: item.showInInstagramPreview,
        isPublished: true,
        displayOrder: item.displayOrder,
      },
    });
  }
}

export async function listPublicGallery(category?: string): Promise<PublicGalleryPayloadDto> {
  await ensureBaselineGalleryPhotos();

  const publishedRows = await prisma.galleryPhoto.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const categoryCounts = new Map<GalleryCategorySlug, number>();
  for (const row of publishedRows) {
    const slug = row.categorySlug as GalleryCategorySlug;
    categoryCounts.set(slug, (categoryCounts.get(slug) ?? 0) + 1);
  }

  const activeCategories = (Object.keys(GALLERY_CATEGORY_LABELS) as GalleryCategorySlug[])
    .filter((slug) => (categoryCounts.get(slug) ?? 0) > 0)
    .map((slug) => ({
      slug,
      label: GALLERY_CATEGORY_LABELS[slug],
      count: categoryCounts.get(slug) ?? 0,
    }));

  const filtered =
    category && category !== 'all'
      ? publishedRows.filter((row) => row.categorySlug === category)
      : publishedRows;

  return {
    photos: filtered.map(mapGalleryPhotoToDto),
    categories: activeCategories,
  };
}

export async function listAdminGalleryPhotos(): Promise<GalleryPhotoDto[]> {
  await ensureBaselineGalleryPhotos();
  const rows = await prisma.galleryPhoto.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map(mapGalleryPhotoToDto);
}

export async function createAdminGalleryPhoto(params: {
  input: {
    title: string;
    categorySlug: GalleryCategorySlug;
    imageUrl: string;
    width: number;
    height: number;
    caption: string;
    altText: string;
    sourcePlatform: 'GOOGLE_MAPS' | 'INSTAGRAM' | 'OWNER_UPLOAD';
    sourceUrl: string;
    attribution: string;
    isCustomerOrCreator: boolean;
    permissionNote?: string | null;
    isFeaturedOnHome: boolean;
    showInInstagramPreview: boolean;
    isPublished: boolean;
    displayOrder: number;
  };
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<GalleryPhotoDto> {
  const created = await prisma.galleryPhoto.create({
    data: {
      slug: slugifyGalleryTitle(params.input.title),
      title: params.input.title,
      categorySlug: params.input.categorySlug,
      imageUrl: params.input.imageUrl,
      width: params.input.width,
      height: params.input.height,
      caption: params.input.caption,
      altText: params.input.altText,
      sourcePlatform: params.input.sourcePlatform as GallerySourcePlatform,
      sourceUrl: params.input.sourceUrl,
      attribution: params.input.attribution,
      isCustomerOrCreator: params.input.isCustomerOrCreator,
      permissionNote: params.input.permissionNote ?? null,
      isFeaturedOnHome: params.input.isFeaturedOnHome,
      showInInstagramPreview: params.input.showInInstagramPreview,
      isPublished: params.input.isPublished,
      displayOrder: params.input.displayOrder,
    },
  });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_GALLERY_PHOTO_CREATED',
    entityType: 'GalleryPhoto',
    entityId: created.id,
    metadata: { title: created.title, categorySlug: created.categorySlug },
    ipAddress: params.ipAddress,
  });

  return mapGalleryPhotoToDto(created);
}

export async function updateAdminGalleryPhoto(params: {
  id: string;
  input: Record<string, unknown>;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<GalleryPhotoDto> {
  const existing = await prisma.galleryPhoto.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new HttpError(404, 'Gallery photo not found.', 'GALLERY_PHOTO_NOT_FOUND');
  }

  const updated = await prisma.galleryPhoto.update({
    where: { id: params.id },
    data: params.input as Record<string, never>,
  });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_GALLERY_PHOTO_UPDATED',
    entityType: 'GalleryPhoto',
    entityId: updated.id,
    metadata: { updatedFields: Object.keys(params.input) },
    ipAddress: params.ipAddress,
  });

  return mapGalleryPhotoToDto(updated);
}

export async function deleteAdminGalleryPhoto(params: {
  id: string;
  actor: { id: string; email: string };
  ipAddress?: string;
}): Promise<{ deleted: boolean }> {
  const existing = await prisma.galleryPhoto.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new HttpError(404, 'Gallery photo not found.', 'GALLERY_PHOTO_NOT_FOUND');
  }

  await prisma.galleryPhoto.delete({ where: { id: params.id } });

  await recordAuditLog({
    actorUserId: params.actor.id,
    actorEmail: params.actor.email,
    action: 'ADMIN_GALLERY_PHOTO_DELETED',
    entityType: 'GalleryPhoto',
    entityId: existing.id,
    metadata: { title: existing.title },
    ipAddress: params.ipAddress,
  });

  return { deleted: true };
}
