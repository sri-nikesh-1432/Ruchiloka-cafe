import { OrderingProvider as PrismaOrderingProvider } from '@prisma/client';
import type {
  OrderHandoffResultDto,
  OrderingProvider,
  OrderingProviderStatusDto,
} from '@ruchiloka/shared';

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../lib/errors';
import { getConfig } from '../../config/env';
import { getOrCreateSettingsRecord } from '../settings/settings.service';
import { priceCartSelectionsFromDb, type PricedSelectionLine } from '../cart/cart.service';
import {
  getOrderingAdapter,
  type OrderingProviderRuntimeConfig,
  type PartnerItemMappingRecord,
} from './ordering.adapters';
import { recordAuditLog } from '../audit/audit.service';

export interface SelectionInputItem {
  menuItemId: string;
  variantId?: string | null;
  addonIds?: string[];
  quantity: number;
  specialInstructions?: string;
}

export function formatOrderSummaryText(
  lines: PricedSelectionLine[],
  subtotalInr: number
): string {
  const header = 'Ruchiloka Café — Order Checklist';
  const itemLines = lines.map((line, index) => {
    const variantPart = line.variantName ? ` (${line.variantName})` : '';
    const addonsPart =
      line.addons.length > 0
        ? ` + ${line.addons.map((a) => a.name).join(', ')}`
        : '';
    const notePart = line.specialInstructions
      ? ` [Note: ${line.specialInstructions}]`
      : '';
    return `${index + 1}. ${line.name}${variantPart}${addonsPart} × ${line.quantity} — ${formatInr(
      line.lineTotalInr
    )}${notePart}`;
  });
  const footer = `Estimated Ruchiloka Menu Total: ${formatInr(subtotalInr)}`;
  return [header, ...itemLines, footer].join('\n');
}

async function resolveSelectionLines(
  userId?: string | null,
  explicitItems?: SelectionInputItem[]
) {
  let rawSelections: SelectionInputItem[] = [];

  if (explicitItems && explicitItems.length > 0) {
    rawSelections = explicitItems;
  } else if (userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (cart) {
      rawSelections = cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        variantId: item.variantId,
        addonIds: item.addonIds,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions ?? undefined,
      }));
    }
  }

  if (rawSelections.length === 0) {
    throw new HttpError(
      400,
      'Your cart is empty. Add menu items before preparing an order.',
      'EMPTY_CART'
    );
  }

  return priceCartSelectionsFromDb(rawSelections, { failOnUnavailable: true });
}

async function loadProviderRuntimeConfig(
  provider: OrderingProvider
): Promise<OrderingProviderRuntimeConfig> {
  const config = getConfig();
  const [settings, platform] = await Promise.all([
    getOrCreateSettingsRecord(),
    prisma.externalPlatform.findUnique({
      where: { code: provider as PrismaOrderingProvider },
      include: {
        restaurants: { where: { isActive: true }, take: 1 },
        itemMappings: true,
      },
    }),
  ]);

  const activeMapping = platform?.restaurants[0];
  const itemMappings = new Map<string, PartnerItemMappingRecord>();
  for (const mapping of platform?.itemMappings ?? []) {
    itemMappings.set(mapping.menuItemId, {
      menuItemId: mapping.menuItemId,
      externalItemId: mapping.externalItemId,
      externalVariantMapJson: mapping.externalVariantMapJson,
    });
  }

  if (provider === 'SWIGGY') {
    return {
      apiHandoffEnabled:
        config.ordering.enableSwiggyApiHandoff && Boolean(platform?.apiEnabled ?? true),
      restaurantId:
        settings.swiggyRestaurantId ??
        activeMapping?.externalRestaurantId ??
        config.ordering.swiggyRestaurantId ??
        null,
      listingUrl:
        settings.swiggyListingUrl ??
        activeMapping?.listingUrl ??
        config.ordering.swiggyListingUrl ??
        null,
      hasPartnerCredentials: Boolean(
        config.ordering.swiggyClientId && config.ordering.swiggyClientSecret
      ),
      itemMappings,
    };
  }

  return {
    apiHandoffEnabled:
      config.ordering.enableZomatoApiHandoff && Boolean(platform?.apiEnabled ?? true),
    restaurantId:
      settings.zomatoRestaurantId ??
      activeMapping?.externalRestaurantId ??
      config.ordering.zomatoRestaurantId ??
      null,
    listingUrl:
      settings.zomatoListingUrl ??
      activeMapping?.listingUrl ??
      config.ordering.zomatoListingUrl ??
      null,
    hasPartnerCredentials: Boolean(config.ordering.zomatoApiKey),
    itemMappings,
  };
}

export async function getOrderingProvidersStatus(): Promise<OrderingProviderStatusDto[]> {
  const providers: OrderingProvider[] = ['SWIGGY', 'ZOMATO'];
  return Promise.all(
    providers.map(async (provider) => {
      const cfg = await loadProviderRuntimeConfig(provider);
      return getOrderingAdapter(provider).getStatus(cfg);
    })
  );
}

export async function prepareOrderSummary(
  userId?: string | null,
  explicitItems?: SelectionInputItem[]
) {
  const priced = await resolveSelectionLines(userId, explicitItems);
  const orderSummaryText = formatOrderSummaryText(priced.lines, priced.subtotalInr);

  return {
    items: priced.lines.map((line) => ({
      menuItemId: line.menuItemId,
      name: line.name,
      variantName: line.variantName,
      addons: line.addons.map((a) => a.name),
      quantity: line.quantity,
      lineTotalInr: line.lineTotalInr,
    })),
    subtotalInr: priced.subtotalInr,
    orderSummaryText,
  };
}

export async function executeOrderHandoff(params: {
  provider: OrderingProvider;
  userId?: string | null;
  userEmail?: string | null;
  explicitItems?: SelectionInputItem[];
  ipAddress?: string;
}): Promise<OrderHandoffResultDto> {
  const priced = await resolveSelectionLines(params.userId, params.explicitItems);
  const orderSummaryText = formatOrderSummaryText(priced.lines, priced.subtotalInr);
  const runtimeCfg = await loadProviderRuntimeConfig(params.provider);
  const adapter = getOrderingAdapter(params.provider);

  const outcome = await adapter.createHandoff({
    cfg: runtimeCfg,
    lines: priced.lines,
    subtotalInr: priced.subtotalInr,
    orderSummaryText,
  });

  const itemsSnapshot = priced.lines.map((line) => ({
    menuItemId: line.menuItemId,
    name: line.name,
    variantName: line.variantName,
    addons: line.addons.map((a) => a.name),
    quantity: line.quantity,
    lineTotalInr: line.lineTotalInr,
    specialInstructions: line.specialInstructions,
  }));

  const saved = await prisma.orderHandoff.create({
    data: {
      userId: params.userId ?? null,
      provider: params.provider as PrismaOrderingProvider,
      mode: outcome.mode,
      cartTransferred: outcome.cartTransferred,
      externalCartId: outcome.externalCartId,
      subtotalInr: priced.subtotalInr,
      redirectUrl: outcome.redirectUrl,
      summarySnapshot: orderSummaryText,
      itemsSnapshotJson: itemsSnapshot as unknown as object,
    },
  });

  await recordAuditLog({
    actorUserId: params.userId ?? null,
    actorEmail: params.userEmail ?? null,
    action: 'ORDER_HANDOFF_CREATED',
    entityType: 'OrderHandoff',
    entityId: saved.id,
    metadata: {
      provider: params.provider,
      mode: outcome.mode,
      cartTransferred: outcome.cartTransferred,
      subtotalInr: priced.subtotalInr,
      itemCount: priced.itemCount,
    },
    ipAddress: params.ipAddress,
  });

  return {
    handoffId: saved.id,
    provider: params.provider,
    cartTransferred: outcome.cartTransferred,
    mode: outcome.mode,
    redirectUrl: outcome.redirectUrl,
    message: outcome.message,
    orderSummaryText,
    items: itemsSnapshot.map((i) => ({
      name: i.name,
      variantName: i.variantName,
      addons: i.addons,
      quantity: i.quantity,
      lineTotalInr: i.lineTotalInr,
    })),
    subtotalInr: priced.subtotalInr,
    createdAt: saved.createdAt.toISOString(),
  };
}

export async function getUserOrderHandoffs(userId: string) {
  const rows = await prisma.orderHandoff.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    provider: row.provider as OrderingProvider,
    mode: row.mode,
    cartTransferred: row.cartTransferred,
    subtotalInr: row.subtotalInr,
    redirectUrl: row.redirectUrl,
    summarySnapshot: row.summarySnapshot,
    createdAt: row.createdAt.toISOString(),
  }));
}
