import type {
  OrderingProvider,
  OrderingProviderStatusDto,
} from '@ruchiloka/shared';
import type { PricedSelectionLine } from '../cart/cart.service';

export interface PartnerItemMappingRecord {
  menuItemId: string;
  externalItemId: string;
  externalVariantMapJson: unknown;
}

export interface OrderingProviderRuntimeConfig {
  apiHandoffEnabled: boolean;
  restaurantId: string | null;
  listingUrl: string | null;
  hasPartnerCredentials: boolean;
  itemMappings: Map<string, PartnerItemMappingRecord>;
}

export interface AdapterHandoffOutcome {
  mode: 'PARTNER_API_HANDOFF' | 'VERIFIED_LISTING_FALLBACK';
  cartTransferred: boolean;
  externalCartId: string | null;
  redirectUrl: string | null;
  message: string;
}

export interface OrderingProviderAdapter {
  readonly provider: OrderingProvider;
  readonly displayName: string;
  getStatus(cfg: OrderingProviderRuntimeConfig): OrderingProviderStatusDto;
  createHandoff(params: {
    cfg: OrderingProviderRuntimeConfig;
    lines: PricedSelectionLine[];
    subtotalInr: number;
    orderSummaryText: string;
  }): Promise<AdapterHandoffOutcome>;
}

function buildFallbackMessage(
  displayName: string,
  listingUrl: string | null,
  fallbackReason?: string
): string {
  if (!listingUrl) {
    return (
      `Ruchiloka Café's ${displayName} listing URL has not been configured yet in Admin Settings. ` +
      `Your selections remain saved here so you can copy the summary or call +91 91216 78449.`
    );
  }

  const prefix = fallbackReason
    ? `${fallbackReason} `
    : `${displayName} requires approved partner API access to transfer carts automatically from external websites. `;

  return (
    `${prefix}` +
    `Your Ruchiloka Café listing on ${displayName} will open in a new tab, while your cart stays saved here with a copyable order summary.`
  );
}

export class SwiggyAdapter implements OrderingProviderAdapter {
  readonly provider: OrderingProvider = 'SWIGGY';
  readonly displayName = 'Swiggy';

  getStatus(cfg: OrderingProviderRuntimeConfig): OrderingProviderStatusDto {
    const listingConfigured = Boolean(cfg.listingUrl);
    if (cfg.apiHandoffEnabled && cfg.hasPartnerCredentials && cfg.restaurantId) {
      return {
        provider: this.provider,
        displayName: this.displayName,
        apiHandoffEnabled: true,
        listingConfigured,
        listingUrl: cfg.listingUrl,
        mode: 'PARTNER_API_HANDOFF',
        notice: 'Swiggy partner cart handoff is active using mapped restaurant & item IDs.',
      };
    }

    if (listingConfigured) {
      return {
        provider: this.provider,
        displayName: this.displayName,
        apiHandoffEnabled: false,
        listingConfigured: true,
        listingUrl: cfg.listingUrl,
        mode: 'VERIFIED_LISTING_FALLBACK',
        notice:
          'Opens Ruchiloka Café’s verified Swiggy listing. Because Swiggy commercial cart-injection requires approved partner API credentials, copy your saved cart summary before ordering.',
      };
    }

    return {
      provider: this.provider,
      displayName: this.displayName,
      apiHandoffEnabled: false,
      listingConfigured: false,
      listingUrl: null,
      mode: 'UNCONFIGURED',
      notice:
        'Swiggy listing URL is not configured yet. Add the verified Swiggy URL in Admin Settings -> Ordering Integrations.',
    };
  }

  async createHandoff(params: {
    cfg: OrderingProviderRuntimeConfig;
    lines: PricedSelectionLine[];
    subtotalInr: number;
    orderSummaryText: string;
  }): Promise<AdapterHandoffOutcome> {
    const { cfg, lines } = params;

    if (!cfg.apiHandoffEnabled) {
      return {
        mode: 'VERIFIED_LISTING_FALLBACK',
        cartTransferred: false,
        externalCartId: null,
        redirectUrl: cfg.listingUrl,
        message: buildFallbackMessage(this.displayName, cfg.listingUrl),
      };
    }

    if (!cfg.hasPartnerCredentials || !cfg.restaurantId) {
      return {
        mode: 'VERIFIED_LISTING_FALLBACK',
        cartTransferred: false,
        externalCartId: null,
        redirectUrl: cfg.listingUrl,
        message: buildFallbackMessage(
          this.displayName,
          cfg.listingUrl,
          'Swiggy API handoff flag is enabled, but partner client credentials or restaurant ID are missing.'
        ),
      };
    }

    const unmapped = lines.filter((line) => !cfg.itemMappings.has(line.menuItemId));
    if (unmapped.length > 0) {
      return {
        mode: 'VERIFIED_LISTING_FALLBACK',
        cartTransferred: false,
        externalCartId: null,
        redirectUrl: cfg.listingUrl,
        message: buildFallbackMessage(
          this.displayName,
          cfg.listingUrl,
          `Some items (${unmapped.map((i) => i.name).join(', ')}) do not have Swiggy catalog IDs mapped yet.`
        ),
      };
    }

    // Swiggy commercial MCP/Partner OAuth handoff requires live production partner endpoint provisioning.
    // Until an approved live Swiggy partner endpoint is wired here, fail closed to verified listing fallback
    // so we never fabricate a synthetic cart transfer.
    return {
      mode: 'VERIFIED_LISTING_FALLBACK',
      cartTransferred: false,
      externalCartId: null,
      redirectUrl: cfg.listingUrl,
      message: buildFallbackMessage(
        this.displayName,
        cfg.listingUrl,
        'Swiggy partner OAuth session endpoint awaits live merchant approval.'
      ),
    };
  }
}

export class ZomatoAdapter implements OrderingProviderAdapter {
  readonly provider: OrderingProvider = 'ZOMATO';
  readonly displayName = 'Zomato';

  getStatus(cfg: OrderingProviderRuntimeConfig): OrderingProviderStatusDto {
    const listingConfigured = Boolean(cfg.listingUrl);
    if (cfg.apiHandoffEnabled && cfg.hasPartnerCredentials && cfg.restaurantId) {
      return {
        provider: this.provider,
        displayName: this.displayName,
        apiHandoffEnabled: true,
        listingConfigured,
        listingUrl: cfg.listingUrl,
        mode: 'PARTNER_API_HANDOFF',
        notice: 'Zomato partner handoff is enabled with restaurant & menu item mappings.',
      };
    }

    if (listingConfigured) {
      return {
        provider: this.provider,
        displayName: this.displayName,
        apiHandoffEnabled: false,
        listingConfigured: true,
        listingUrl: cfg.listingUrl,
        mode: 'VERIFIED_LISTING_FALLBACK',
        notice:
          'Opens Ruchiloka Café’s verified Zomato listing. Public Zomato URLs cannot pre-populate external carts automatically; use your copied summary as a checklist.',
      };
    }

    return {
      provider: this.provider,
      displayName: this.displayName,
      apiHandoffEnabled: false,
      listingConfigured: false,
      listingUrl: null,
      mode: 'UNCONFIGURED',
      notice:
        'Zomato listing URL is not configured yet. Add the verified Zomato URL in Admin Settings -> Ordering Integrations.',
    };
  }

  async createHandoff(params: {
    cfg: OrderingProviderRuntimeConfig;
    lines: PricedSelectionLine[];
    subtotalInr: number;
    orderSummaryText: string;
  }): Promise<AdapterHandoffOutcome> {
    const { cfg, lines } = params;

    if (!cfg.apiHandoffEnabled) {
      return {
        mode: 'VERIFIED_LISTING_FALLBACK',
        cartTransferred: false,
        externalCartId: null,
        redirectUrl: cfg.listingUrl,
        message: buildFallbackMessage(this.displayName, cfg.listingUrl),
      };
    }

    if (!cfg.hasPartnerCredentials || !cfg.restaurantId) {
      return {
        mode: 'VERIFIED_LISTING_FALLBACK',
        cartTransferred: false,
        externalCartId: null,
        redirectUrl: cfg.listingUrl,
        message: buildFallbackMessage(
          this.displayName,
          cfg.listingUrl,
          'Zomato API handoff flag is enabled, but Zomato partner credentials or restaurant ID are missing.'
        ),
      };
    }

    const unmapped = lines.filter((line) => !cfg.itemMappings.has(line.menuItemId));
    if (unmapped.length > 0) {
      return {
        mode: 'VERIFIED_LISTING_FALLBACK',
        cartTransferred: false,
        externalCartId: null,
        redirectUrl: cfg.listingUrl,
        message: buildFallbackMessage(
          this.displayName,
          cfg.listingUrl,
          `Some items (${unmapped.map((i) => i.name).join(', ')}) do not have Zomato catalog IDs mapped yet.`
        ),
      };
    }

    return {
      mode: 'VERIFIED_LISTING_FALLBACK',
      cartTransferred: false,
      externalCartId: null,
      redirectUrl: cfg.listingUrl,
      message: buildFallbackMessage(
        this.displayName,
        cfg.listingUrl,
        'Zomato partner consumer-cart endpoint awaits approved merchant provisioning.'
      ),
    };
  }
}

const ADAPTER_REGISTRY: Record<OrderingProvider, OrderingProviderAdapter> = {
  SWIGGY: new SwiggyAdapter(),
  ZOMATO: new ZomatoAdapter(),
};

export function getOrderingAdapter(provider: OrderingProvider): OrderingProviderAdapter {
  return ADAPTER_REGISTRY[provider];
}
