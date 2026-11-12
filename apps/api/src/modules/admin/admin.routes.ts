import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  AdminGalleryPhotoSchema,
  AdminMenuItemSchema,
  AdminModerateReviewSchema,
  AdminSettingsSchema,
  AdminUpdateGalleryPhotoSchema,
  ReservationStatusSchema,
} from '@ruchiloka/shared';
import { asyncHandler, HttpError } from '../../lib/errors';
import { requireAdmin } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { storeUploadedImage } from '../../lib/uploads';
import { recordAuditLog } from '../audit/audit.service';
import { getAdminSettings } from '../settings/settings.service';
import {
  createAdminGalleryPhoto,
  deleteAdminGalleryPhoto,
  listAdminGalleryPhotos,
  updateAdminGalleryPhoto,
} from '../gallery/gallery.service';
import {
  deleteWebsiteReview,
  listAdminWebsiteReviews,
  moderateWebsiteReview,
} from '../reviews/reviews.service';
import {
  createAdminMenuItem,
  deleteAdminMenuItem,
  getAdminDashboard,
  listAdminCustomers,
  listAdminReservations,
  listAllAdminMenuItems,
  listAuditLogs,
  storeMenuImageUpload,
  updateAdminMenuItem,
  updateAdminReservationStatus,
  updateAdminSettings,
} from './admin.service';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowed.includes(file.mimetype)) {
      cb(new HttpError(400, 'Only JPG, PNG, WebP, and AVIF images are allowed.', 'INVALID_IMAGE_TYPE'));
      return;
    }
    cb(null, true);
  },
});

const AdminUpdateReservationSchema = z.object({
  status: ReservationStatusSchema,
  adminNotes: z.string().trim().max(500).optional(),
});

const AdminUpdateMenuItemSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(120).optional(),
    slug: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(4).max(800).optional(),
    priceInr: z.coerce.number().int().min(1).max(100000).optional(),
    imageUrl: z.string().trim().min(1).max(1000).optional(),
    isVegetarian: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    prepTimeMinutes: z.coerce.number().int().min(1).max(120).optional(),
    displayOrder: z.coerce.number().int().min(0).max(9999).optional(),
    variants: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().trim().min(1).max(60),
          priceDeltaInr: z.coerce.number().int().min(-5000).max(50000).default(0),
          isAvailable: z.boolean().default(true),
        })
      )
      .optional(),
    addons: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().trim().min(1).max(60),
          priceInr: z.coerce.number().int().min(0).max(50000),
          isAvailable: z.boolean().default(true),
        })
      )
      .optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, 'At least one menu field must be provided');

adminRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const dashboard = await getAdminDashboard();
    res.json({ success: true, data: dashboard });
  })
);

adminRouter.get(
  '/reservations',
  asyncHandler(async (req, res) => {
    const list = await listAdminReservations({
      date: typeof req.query.date === 'string' ? req.query.date : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    res.json({ success: true, data: list });
  })
);

adminRouter.patch(
  '/reservations/:id',
  validateBody(AdminUpdateReservationSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid reservation ID.', 'INVALID_ID');
    }

    const updated = await updateAdminReservationStatus({
      id,
      status: req.body.status,
      adminNotes: req.body.adminNotes,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: updated });
  })
);

adminRouter.get(
  '/menu',
  asyncHandler(async (_req, res) => {
    const items = await listAllAdminMenuItems();
    res.json({ success: true, data: items });
  })
);

adminRouter.post(
  '/menu',
  validateBody(AdminMenuItemSchema),
  asyncHandler(async (req, res) => {
    const created = await createAdminMenuItem({
      input: req.body,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: created });
  })
);

adminRouter.patch(
  '/menu/:id',
  validateBody(AdminUpdateMenuItemSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid menu item ID.', 'INVALID_ID');
    }

    const updated = await updateAdminMenuItem({
      id,
      input: req.body,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: updated });
  })
);

adminRouter.delete(
  '/menu/:id',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid menu item ID.', 'INVALID_ID');
    }

    const result = await deleteAdminMenuItem({
      id,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: result });
  })
);

adminRouter.post(
  '/menu/upload-image',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'No image file provided.', 'MISSING_FILE');
    }

    const result = await storeMenuImageUpload({
      file: req.file,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: result });
  })
);

adminRouter.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const customers = await listAdminCustomers(
      typeof req.query.search === 'string' ? req.query.search : undefined
    );
    res.json({ success: true, data: customers });
  })
);

adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const settings = await getAdminSettings();
    res.json({ success: true, data: settings });
  })
);

adminRouter.patch(
  '/settings',
  validateBody(AdminSettingsSchema),
  asyncHandler(async (req, res) => {
    const updated = await updateAdminSettings({
      input: req.body,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: updated });
  })
);

adminRouter.get(
  '/audit-logs',
  asyncHandler(async (_req, res) => {
    const logs = await listAuditLogs();
    res.json({ success: true, data: logs });
  })
);

adminRouter.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const result = await listAdminWebsiteReviews(status);
    res.json({ success: true, data: result });
  })
);

adminRouter.patch(
  '/reviews/:id',
  validateBody(AdminModerateReviewSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid review ID.', 'INVALID_ID');
    }

    const updated = await moderateWebsiteReview({
      id,
      status: req.body.status,
      adminNote: req.body.adminNote,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: updated });
  })
);

adminRouter.delete(
  '/reviews/:id',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid review ID.', 'INVALID_ID');
    }

    const result = await deleteWebsiteReview({
      id,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: result });
  })
);

adminRouter.get(
  '/gallery',
  asyncHandler(async (_req, res) => {
    const photos = await listAdminGalleryPhotos();
    res.json({ success: true, data: photos });
  })
);

adminRouter.post(
  '/gallery',
  validateBody(AdminGalleryPhotoSchema),
  asyncHandler(async (req, res) => {
    const created = await createAdminGalleryPhoto({
      input: req.body,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: created });
  })
);

adminRouter.post(
  '/gallery/upload-image',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'No image file provided.', 'MISSING_FILE');
    }

    const uploaded = await storeUploadedImage({
      file: req.file,
      folder: 'ruchiloka/gallery',
      prefix: 'gallery',
      strictMagicBytes: true,
      allowDataUriFallbackInServerless: true,
    });

    await recordAuditLog({
      actorUserId: req.currentUser!.id,
      actorEmail: req.currentUser!.email,
      action: 'ADMIN_GALLERY_IMAGE_UPLOADED',
      entityType: 'Media',
      metadata: { storage: uploaded.storage },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: { imageUrl: uploaded.imageUrl } });
  })
);

adminRouter.patch(
  '/gallery/:id',
  validateBody(AdminUpdateGalleryPhotoSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid gallery photo ID.', 'INVALID_ID');
    }

    const updated = await updateAdminGalleryPhoto({
      id,
      input: req.body,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: updated });
  })
);

adminRouter.delete(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid gallery photo ID.', 'INVALID_ID');
    }

    const result = await deleteAdminGalleryPhoto({
      id,
      actor: req.currentUser!,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: result });
  })
);
