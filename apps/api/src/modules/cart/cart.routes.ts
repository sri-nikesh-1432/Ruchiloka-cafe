import { Router } from 'express';
import { CartAddItemSchema, CartSyncSchema, CartUpdateItemSchema } from '@ruchiloka/shared';
import { asyncHandler } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  addCartItem,
  clearUserCart,
  getUserCart,
  removeCartItem,
  syncGuestCartItems,
  updateCartItem,
} from './cart.service';

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await getUserCart(req.currentUser!.id);
    res.json({ success: true, data });
  })
);

cartRouter.post(
  '/items',
  validateBody(CartAddItemSchema),
  asyncHandler(async (req, res) => {
    const data = await addCartItem(req.currentUser!.id, req.body);
    res.status(201).json({ success: true, data });
  })
);

cartRouter.patch(
  '/items/:id',
  validateBody(CartUpdateItemSchema),
  asyncHandler(async (req, res) => {
    const data = await updateCartItem(req.currentUser!.id, String(req.params.id), req.body);
    res.json({ success: true, data });
  })
);

cartRouter.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const data = await removeCartItem(req.currentUser!.id, String(req.params.id));
    res.json({ success: true, data });
  })
);

cartRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const data = await clearUserCart(req.currentUser!.id);
    res.json({ success: true, data });
  })
);

cartRouter.post(
  '/sync',
  validateBody(CartSyncSchema),
  asyncHandler(async (req, res) => {
    const data = await syncGuestCartItems(req.currentUser!.id, req.body.items);
    res.json({ success: true, data });
  })
);
