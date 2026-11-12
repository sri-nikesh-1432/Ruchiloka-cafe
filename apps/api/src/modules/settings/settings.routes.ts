import { Router } from 'express';
import { asyncHandler } from '../../lib/errors';
import { getPublicSettings } from './settings.service';

export const settingsRouter = Router();

settingsRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const data = await getPublicSettings();
    res.json({ success: true, data });
  })
);
