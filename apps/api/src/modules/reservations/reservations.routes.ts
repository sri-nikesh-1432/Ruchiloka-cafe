import { Router } from 'express';
import { z } from 'zod';
import { CreateReservationSchema } from '@ruchiloka/shared';
import { asyncHandler, HttpError } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  cancelReservationForActor,
  createReservation,
  getReservationAvailability,
  getReservationByIdForActor,
  getUserReservations,
} from './reservations.service';

export const reservationsRouter = Router();

const AvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  guests: z.coerce.number().int().min(1).max(20).default(2),
});

reservationsRouter.get(
  '/availability',
  asyncHandler(async (req, res) => {
    const parsed = AvailabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid availability query parameters.', 'VALIDATION_ERROR', parsed.error.flatten());
    }
    const result = await getReservationAvailability(parsed.data.date, parsed.data.guests);
    res.json({ success: true, data: result });
  })
);

reservationsRouter.post(
  '/',
  validateBody(CreateReservationSchema),
  asyncHandler(async (req, res) => {
    const result = await createReservation(
      req.body,
      req.currentUser?.id ?? null,
      req.ip
    );
    res.status(201).json({ success: true, data: result });
  })
);

reservationsRouter.get(
  '/my',
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await getUserReservations(req.currentUser!.id);
    res.json({ success: true, data: list });
  })
);

reservationsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid reservation ID.', 'INVALID_ID');
    }
    const reservation = await getReservationByIdForActor(id, req.currentUser!);
    res.json({ success: true, data: reservation });
  })
);

reservationsRouter.patch(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!z.string().uuid().safeParse(id).success) {
      throw new HttpError(400, 'Invalid reservation ID.', 'INVALID_ID');
    }
    const updated = await cancelReservationForActor(id, req.currentUser!, req.ip);
    res.json({ success: true, data: updated });
  })
);
