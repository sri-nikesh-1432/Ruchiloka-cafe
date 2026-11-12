import type { CartDto, CartItemDto, MenuCategorySlug } from '@ruchiloka/shared';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';

export interface PricedSelectionLine {
  menuItemId: string;
  name: string;
  imageUrl: string;
  categorySlug: MenuCategorySlug;
  isAvailable: boolean;
  isVegetarian: boolean;
  unitBasePriceInr: number;
  variantId: string | null;
  variantName: string | null;
  variantDeltaInr: number;
  addons: Array<{ id: string; name: string; priceInr: number }>;
  quantity: number;
  specialInstructions: string | null;
  lineTotalInr: number;
}

/**
 * Computes item pricing strictly from PostgreSQL catalog records.
 * Never trusts frontend-supplied prices.
 */
export async function priceCartSelectionsFromDb(
  selections: Array<{
    id?: string;
    menuItemId: string;
    variantId?: string | null;
    addonIds?: string[];
    quantity: number;
    specialInstructions?: string | null;
  }>,
  options: { failOnUnavailable?: boolean } = {}
): Promise<{ lines: Array<PricedSelectionLine & { id: string }>; subtotalInr: number; itemCount: number }> {
  if (selections.length === 0) {
    return { lines: [], subtotalInr: 0, itemCount: 0 };
  }

  const itemIds = Array.from(new Set(selections.map((s) => s.menuItemId)));
  const dbItems = await prisma.menuItem.findMany({
    where: { id: { in: itemIds } },
    include: {
      category: { select: { slug: true } },
      variants: true,
      addons: true,
    },
  });
  const dbItemMap = new Map(dbItems.map((i) => [i.id, i]));

  const lines: Array<PricedSelectionLine & { id: string }> = [];

  for (const sel of selections) {
    if (!Number.isInteger(sel.quantity) || sel.quantity < 1 || sel.quantity > 25) {
      throw new HttpError(400, 'Item quantity must be between 1 and 25.', 'INVALID_QUANTITY');
    }

    const dbItem = dbItemMap.get(sel.menuItemId);
    if (!dbItem) {
      throw new HttpError(404, 'Selected menu item no longer exists.', 'MENU_ITEM_NOT_FOUND');
    }

    if (options.failOnUnavailable && !dbItem.isAvailable) {
      throw new HttpError(
        409,
        `${dbItem.name} is currently unavailable.`,
        'MENU_ITEM_UNAVAILABLE'
      );
    }

    let variantId: string | null = null;
    let variantName: string | null = null;
    let variantDeltaInr = 0;

    if (sel.variantId) {
      const variant = dbItem.variants.find((v) => v.id === sel.variantId);
      if (!variant) {
        throw new HttpError(400, `Invalid variant selected for ${dbItem.name}.`, 'INVALID_VARIANT');
      }
      if (options.failOnUnavailable && !variant.isAvailable) {
        throw new HttpError(
          409,
          `Option "${variant.name}" for ${dbItem.name} is currently unavailable.`,
          'VARIANT_UNAVAILABLE'
        );
      }
      variantId = variant.id;
      variantName = variant.name;
      variantDeltaInr = variant.priceDeltaInr;
    }

    const uniqueAddonIds = Array.from(new Set(sel.addonIds ?? []));
    const resolvedAddons: Array<{ id: string; name: string; priceInr: number }> = [];
    for (const addonId of uniqueAddonIds) {
      const addon = dbItem.addons.find((a) => a.id === addonId);
      if (!addon) {
        throw new HttpError(400, `Invalid add-on selected for ${dbItem.name}.`, 'INVALID_ADDON');
      }
      if (options.failOnUnavailable && !addon.isAvailable) {
        throw new HttpError(
          409,
          `Add-on "${addon.name}" is currently unavailable.`,
          'ADDON_UNAVAILABLE'
        );
      }
      resolvedAddons.push({ id: addon.id, name: addon.name, priceInr: addon.priceInr });
    }

    const addonsSum = resolvedAddons.reduce((sum, a) => sum + a.priceInr, 0);
    const unitTotal = Math.max(0, dbItem.priceInr + variantDeltaInr + addonsSum);
    const lineTotalInr = unitTotal * sel.quantity;

    lines.push({
      id: sel.id ?? sel.menuItemId,
      menuItemId: dbItem.id,
      name: dbItem.name,
      imageUrl: dbItem.imageUrl,
      categorySlug: dbItem.category.slug as MenuCategorySlug,
      isAvailable: dbItem.isAvailable,
      isVegetarian: dbItem.isVegetarian,
      unitBasePriceInr: dbItem.priceInr,
      variantId,
      variantName,
      variantDeltaInr,
      addons: resolvedAddons,
      quantity: sel.quantity,
      specialInstructions: sel.specialInstructions?.trim() || null,
      lineTotalInr,
    });
  }

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalInr = lines.reduce((sum, l) => sum + l.lineTotalInr, 0);

  return { lines, subtotalInr, itemCount };
}

export async function getUserCart(userId: string): Promise<CartDto> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const priced = await priceCartSelectionsFromDb(
    cart.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      variantId: item.variantId,
      addonIds: item.addonIds,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
    }))
  );

  return {
    items: priced.lines as CartItemDto[],
    itemCount: priced.itemCount,
    subtotalInr: priced.subtotalInr,
    currency: 'INR',
  };
}

export async function addCartItem(
  userId: string,
  input: {
    menuItemId: string;
    variantId?: string | null;
    addonIds?: string[];
    quantity: number;
    specialInstructions?: string;
  }
): Promise<CartDto> {
  // Validate existence, availability, and customization ownership against DB first
  const [validated] = (
    await priceCartSelectionsFromDb([input], { failOnUnavailable: true })
  ).lines;

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const sortedAddonIds = validated.addons.map((a) => a.id).sort();
  const normalizedNote = validated.specialInstructions ?? null;

  const existingItems = await prisma.cartItem.findMany({
    where: {
      cartId: cart.id,
      menuItemId: validated.menuItemId,
      variantId: validated.variantId,
    },
  });

  const matching = existingItems.find((row) => {
    const rowAddons = [...row.addonIds].sort();
    return (
      rowAddons.length === sortedAddonIds.length &&
      rowAddons.every((val, idx) => val === sortedAddonIds[idx]) &&
      (row.specialInstructions ?? null) === normalizedNote
    );
  });

  if (matching) {
    await prisma.cartItem.update({
      where: { id: matching.id },
      data: { quantity: Math.min(25, matching.quantity + input.quantity) },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: validated.menuItemId,
        variantId: validated.variantId,
        addonIds: sortedAddonIds,
        quantity: input.quantity,
        specialInstructions: normalizedNote,
      },
    });
  }

  return getUserCart(userId);
}

export async function updateCartItem(
  userId: string,
  cartItemId: string,
  input: { quantity: number; specialInstructions?: string }
): Promise<CartDto> {
  const existing = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId } },
  });
  if (!existing) {
    throw new HttpError(404, 'Cart item not found.', 'CART_ITEM_NOT_FOUND');
  }

  if (input.quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: Math.min(25, input.quantity),
        ...(input.specialInstructions !== undefined
          ? { specialInstructions: input.specialInstructions.trim() || null }
          : {}),
      },
    });
  }

  return getUserCart(userId);
}

export async function removeCartItem(userId: string, cartItemId: string): Promise<CartDto> {
  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cart: { userId } },
  });
  return getUserCart(userId);
}

export async function clearUserCart(userId: string): Promise<CartDto> {
  await prisma.cartItem.deleteMany({
    where: { cart: { userId } },
  });
  return getUserCart(userId);
}

export async function syncGuestCartItems(
  userId: string,
  items: Array<{
    menuItemId: string;
    variantId?: string | null;
    addonIds?: string[];
    quantity: number;
    specialInstructions?: string;
  }>
): Promise<CartDto> {
  for (const entry of items) {
    try {
      await addCartItem(userId, entry);
    } catch {
      // Skip stale or unavailable guest items safely rather than failing entire login sync
    }
  }
  return getUserCart(userId);
}
