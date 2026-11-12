import { Router } from 'express';
import { z } from 'zod';
import { OrderingProviderSchema } from '@ruchiloka/shared';
import { asyncHandler, HttpError } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  executeOrderHandoff,
  getOrderingProvidersStatus,
  getUserOrderHandoffs,
  prepareOrderSummary,
} from './ordering.service';

export const orderingRouter = Router();

const SelectionLineSchema = z.object({
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  addonIds: z.array(z.string().uuid()).optional(),
  quantity: z.number().int().min(1).max(25),
  specialInstructions: z.string().trim().max(300).optional(),
});

const PrepareOrderSchema = z.object({
  items: z.array(SelectionLineSchema).max(50).optional(),
});

const HandoffBodySchema = z.object({
  provider: OrderingProviderSchema.optional(),
  items: z.array(SelectionLineSchema).max(50).optional(),
});

orderingRouter.get(
  '/providers',
  asyncHandler(async (_req, res) => {
    const providers = await getOrderingProvidersStatus();
    res.json({ success: true, data: providers });
  })
);

orderingRouter.post(
  '/prepare',
  validateBody(PrepareOrderSchema),
  asyncHandler(async (req, res) => {
    const result = await prepareOrderSummary(req.currentUser?.id ?? null, req.body.items);
    res.json({ success: true, data: result });
  })
);

orderingRouter.post(
  '/:provider/handoff',
  validateBody(HandoffBodySchema),
  asyncHandler(async (req, res) => {
    const rawProvider = String(req.params.provider).toUpperCase();
    const parsedProvider = OrderingProviderSchema.safeParse(rawProvider);
    if (!parsedProvider.success) {
      throw new HttpError(
        400,
        'Unsupported ordering provider. Choose SWIGGY or ZOMATO.',
        'INVALID_PROVIDER'
      );
    }

    const result = await executeOrderHandoff({
      provider: parsedProvider.data,
      userId: req.currentUser?.id ?? null,
      userEmail: req.currentUser?.email ?? null,
      explicitItems: req.body.items,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: result });
  })
);

orderingRouter.get(
  '/my',
  requireAuth,
  asyncHandler(async (req, res) => {
    const history = await getUserOrderHandoffs(req.currentUser!.id);
    res.json({ success: true, data: history });
  })
);
