import { Router } from 'express';
import { asyncHandler } from '../../lib/errors';
import { listPublicGallery } from './gallery.service';

export const galleryRouter = Router();

galleryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim() : undefined;
    const payload = await listPublicGallery(category);
    res.json({ success: true, data: payload });
  })
);
