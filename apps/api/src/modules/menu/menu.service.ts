import type { MenuCategoryDto, MenuCategorySlug, MenuItemDto } from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';

export function mapMenuItemToDto(item: {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  priceInr: number;
  imageUrl: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  prepTimeMinutes: number;
  displayOrder: number;
  category: { slug: string; name: string };
  variants: Array<{ id: string; name: string; priceDeltaInr: number; isAvailable: boolean }>;
  addons: Array<{ id: string; name: string; priceInr: number; isAvailable: boolean }>;
}): MenuItemDto {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categorySlug: item.category.slug as MenuCategorySlug,
    categoryName: item.category.name,
    name: item.name,
    slug: item.slug,
    description: item.description,
    priceInr: item.priceInr,
    imageUrl: item.imageUrl,
    isVegetarian: item.isVegetarian,
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    prepTimeMinutes: item.prepTimeMinutes,
    displayOrder: item.displayOrder,
    variants: item.variants.map((v) => ({
      id: v.id,
      name: v.name,
      priceDeltaInr: v.priceDeltaInr,
      isAvailable: v.isAvailable,
    })),
    addons: item.addons.map((a) => ({
      id: a.id,
      name: a.name,
      priceInr: a.priceInr,
      isAvailable: a.isAvailable,
    })),
  };
}

const BASELINE_CATEGORIES: Array<{
  slug: MenuCategorySlug;
  name: string;
  description: string;
  serviceWindowKey: string;
  displayOrder: number;
}> = [
  {
    slug: 'tiffins',
    name: 'Tiffins',
    description: 'Traditional South Indian morning breakfast served 6:30 AM – 11:30 AM IST.',
    serviceWindowKey: 'tiffins',
    displayOrder: 1,
  },
  {
    slug: 'beverages',
    name: 'Tea and Coffee',
    description: 'Freshly brewed filter coffee, espresso classics, and aromatic chai (6:30 AM – 11:00 PM IST).',
    serviceWindowKey: 'beverages',
    displayOrder: 2,
  },
  {
    slug: 'continental',
    name: 'Continental',
    description: 'Warm artisanal sandwiches, pastas, and café plates served 3:00 PM – 11:00 PM IST.',
    serviceWindowKey: 'continental_snacks',
    displayOrder: 3,
  },
  {
    slug: 'snacks',
    name: 'Snacks',
    description: 'Crisp savouries, bakes, and evening bites served 3:00 PM – 11:00 PM IST.',
    serviceWindowKey: 'continental_snacks',
    displayOrder: 4,
  },
];

async function ensureBaselineCategories(): Promise<void> {
  if (typeof prisma.menuCategory.upsert !== 'function') {
    return;
  }
  for (const cat of BASELINE_CATEGORIES) {
    await prisma.menuCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
}

export async function listCategories(): Promise<MenuCategoryDto[]> {
  let rows = await prisma.menuCategory.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  if (rows.length === 0) {
    await ensureBaselineCategories();
    rows = await prisma.menuCategory.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug as MenuCategorySlug,
    name: c.name,
    description: c.description,
    displayOrder: c.displayOrder,
    serviceWindowKey: c.serviceWindowKey,
  }));
}

export async function listMenuItems(filters: {
  category?: string;
  search?: string;
  vegetarian?: boolean;
  available?: boolean;
  featured?: boolean;
  sort?: string;
}): Promise<MenuItemDto[]> {
  const orderBy =
    filters.sort === 'price_asc'
      ? [{ priceInr: 'asc' as const }, { displayOrder: 'asc' as const }]
      : filters.sort === 'price_desc'
        ? [{ priceInr: 'desc' as const }, { displayOrder: 'asc' as const }]
        : [{ displayOrder: 'asc' as const }, { createdAt: 'asc' as const }];

  const rows = await prisma.menuItem.findMany({
    where: {
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.vegetarian !== undefined ? { isVegetarian: filters.vegetarian } : {}),
      ...(filters.available !== undefined ? { isAvailable: filters.available } : {}),
      ...(filters.featured !== undefined ? { isFeatured: filters.featured } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { orderBy: { priceDeltaInr: 'asc' } },
      addons: { orderBy: { priceInr: 'asc' } },
    },
    orderBy,
  });

  return rows.map(mapMenuItemToDto);
}

export async function getMenuItemById(id: string): Promise<MenuItemDto> {
  const row = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { orderBy: { priceDeltaInr: 'asc' } },
      addons: { orderBy: { priceInr: 'asc' } },
    },
  });
  if (!row) {
    throw new HttpError(404, 'Menu item not found.', 'MENU_ITEM_NOT_FOUND');
  }
  return mapMenuItemToDto(row);
}
