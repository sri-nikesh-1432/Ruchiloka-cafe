import { Router } from 'express';
import { asyncHandler } from '../../lib/errors';
import { getMenuItemById, listCategories, listMenuItems } from './menu.service';

export const categoriesRouter = Router();
export const menuRouter = Router();

categoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await listCategories();
    res.json({ success: true, data });
  })
);

menuRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await listMenuItems({
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      vegetarian:
        req.query.vegetarian === 'true'
          ? true
          : req.query.vegetarian === 'false'
            ? false
            : undefined,
      available:
        req.query.available === 'true'
          ? true
          : req.query.available === 'false'
            ? false
            : undefined,
      featured: req.query.featured === 'true' ? true : undefined,
      sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
    });
    res.json({ success: true, data });
  })
);

menuRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await getMenuItemById(String(req.params.id));
    res.json({ success: true, data });
  })
);
