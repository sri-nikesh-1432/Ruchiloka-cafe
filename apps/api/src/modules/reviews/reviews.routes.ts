import { Router } from 'express';
import multer from 'multer';
import { CreateWebsiteReviewSchema } from '@ruchiloka/shared';
import { asyncHandler, HttpError } from '../../lib/errors';
import { createWebsiteReview, listApprovedWebsiteReviews } from './reviews.service';

export const reviewsRouter = Router();

const reviewPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1500 * 1024, // 1.5 MB max upload per review photo
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowed.includes(file.mimetype)) {
      cb(
        new HttpError(
          400,
          'Only JPG, PNG, WebP, and AVIF images are allowed for review photos.',
          'INVALID_IMAGE_TYPE'
        )
      );
      return;
    }
    cb(null, true);
  },
});

reviewsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const payload = await listApprovedWebsiteReviews();
    res.json({ success: true, data: payload });
  })
);

reviewsRouter.post(
  '/',
  reviewPhotoUpload.single('photo'),
  asyncHandler(async (req, res) => {
    const parsed = CreateWebsiteReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? 'Invalid review submission.',
        'VALIDATION_ERROR',
        parsed.error.issues
      );
    }

    const created = await createWebsiteReview({
      customerName: parsed.data.customerName,
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      message: parsed.data.message,
      file: req.file,
      ipAddress: req.ip,
      actorUserId: req.currentUser?.id ?? null,
    });

    res.status(201).json({
      success: true,
      data: {
        review: created,
        message: 'Thank you for sharing your feedback! Your review has been submitted for moderation.',
      },
    });
  })
);
