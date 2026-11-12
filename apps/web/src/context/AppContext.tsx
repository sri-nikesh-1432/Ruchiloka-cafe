'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BUSINESS_INFO,
  DEFAULT_OPERATING_WINDOWS,
  type AuthUser,
  type CartDto,
  type CartItemDto,
  type MenuItemDto,
  type PublicSiteSettingsDto,
} from '@ruchiloka/shared';
import { api } from '@/lib/api/endpoints';

const GUEST_CART_STORAGE_KEY = 'ruchiloka_guest_cart_v1';

interface GuestCartRecord {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string;
  categorySlug: MenuItemDto['categorySlug'];
  isAvailable: boolean;
  isVegetarian: boolean;
  unitBasePriceInr: number;
  variantId: string | null;
  variantName: string | null;
  variantDeltaInr: number;
  addons: Array<{ id: string; name: string; priceInr: number }>;
  quantity: number;
  specialInstructions: string | null;
}

export interface ToastNotice {
  id: string;
  title: string;
  description?: string;
  tone?: 'default' | 'accent' | 'info' | 'error';
}

interface AddToCartInput {
  item: MenuItemDto;
  variantId?: string | null;
  addonIds?: string[];
  quantity?: number;
  specialInstructions?: string;
}

interface AppContextValue {
  user: AuthUser | null;
  authLoading: boolean;
  refreshAuth: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;

  publicSettings: PublicSiteSettingsDto;
  refreshSettings: () => Promise<void>;

  cart: CartDto;
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (input: AddToCartInput) => Promise<void>;
  updateCartItemQuantity: (cartItemId: string, quantity: number, specialInstructions?: string) => Promise<void>;
  removeCartItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncGuestCartToAccount: () => Promise<void>;
  getGuestCartPayload: () => Array<{
    menuItemId: string;
    variantId: string | null;
    addonIds: string[];
    quantity: number;
    specialInstructions?: string;
  }>;

  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;

  isOrderModalOpen: boolean;
  openOrderModal: () => void;
  closeOrderModal: () => void;

  pushToast: (toast: Omit<ToastNotice, 'id'>) => void;
  toasts: ToastNotice[];
  dismissToast: (id: string) => void;
}

const DEFAULT_PUBLIC_SETTINGS: PublicSiteSettingsDto = {
  cafeName: BUSINESS_INFO.name,
  cafeAddress: BUSINESS_INFO.address.full,
  cafePhone: BUSINESS_INFO.phone,
  operatingHours: DEFAULT_OPERATING_WINDOWS,
  reservationSlotMinutes: 30,
  maxGuestsPerSlot: 20,
  instagramUrl: null,
  facebookUrl: null,
  swiggyListingUrl: null,
  zomatoListingUrl: null,
};

const EMPTY_CART: CartDto = {
  items: [],
  itemCount: 0,
  subtotalInr: 0,
  currency: 'INR',
};

function computeGuestCartDto(records: GuestCartRecord[]): CartDto {
  const items: CartItemDto[] = records.map((rec) => {
    const addonTotal = rec.addons.reduce((acc, a) => acc + a.priceInr, 0);
    const unitPrice = rec.unitBasePriceInr + rec.variantDeltaInr + addonTotal;
    return {
      id: rec.id,
      menuItemId: rec.menuItemId,
      name: rec.name,
      imageUrl: rec.imageUrl,
      categorySlug: rec.categorySlug,
      isAvailable: rec.isAvailable,
      isVegetarian: rec.isVegetarian,
      unitBasePriceInr: rec.unitBasePriceInr,
      variantId: rec.variantId,
      variantName: rec.variantName,
      variantDeltaInr: rec.variantDeltaInr,
      addons: rec.addons,
      quantity: rec.quantity,
      specialInstructions: rec.specialInstructions,
      lineTotalInr: unitPrice * rec.quantity,
    };
  });

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalInr = items.reduce((sum, i) => sum + i.lineTotalInr, 0);

  return {
    items,
    itemCount,
    subtotalInr,
    currency: 'INR',
  };
}

function readGuestCartStorage(): GuestCartRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCartStorage(records: GuestCartRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [publicSettings, setPublicSettings] = useState<PublicSiteSettingsDto>(DEFAULT_PUBLIC_SETTINGS);
  const [cart, setCart] = useState<CartDto>(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(false);

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const toastTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (toastTimersRef.current[id]) {
      clearTimeout(toastTimersRef.current[id]);
      delete toastTimersRef.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastNotice, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      toastTimersRef.current[id] = setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.settings.getPublic();
      setPublicSettings(data);
    } catch {
      // Retain default business hours & verified Kukatpally info when API is initializing
    }
  }, []);

  const loadGuestCart = useCallback(() => {
    const records = readGuestCartStorage();
    setCart(computeGuestCartDto(records));
  }, []);

  const syncGuestCartToAccount = useCallback(async () => {
    const guestRecords = readGuestCartStorage();
    if (guestRecords.length === 0) {
      try {
        const serverCart = await api.cart.get();
        setCart(serverCart);
      } catch {
        // Ignore if unauthenticated
      }
      return;
    }

    try {
      const synced = await api.cart.syncGuestItems(
        guestRecords.map((rec) => ({
          menuItemId: rec.menuItemId,
          variantId: rec.variantId,
          addonIds: rec.addons.map((a) => a.id),
          quantity: rec.quantity,
          specialInstructions: rec.specialInstructions ?? undefined,
        }))
      );
      window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      setCart(synced);
    } catch {
      // Keep local items safe if sync fails
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user) {
      loadGuestCart();
      return;
    }
    setCartLoading(true);
    try {
      const serverCart = await api.cart.get();
      setCart(serverCart);
    } catch {
      // Fallback to empty or preserve current state
    } finally {
      setCartLoading(false);
    }
  }, [user, loadGuestCart]);

  const refreshAuth = useCallback(async (): Promise<AuthUser | null> => {
    setAuthLoading(true);
    try {
      const res = await api.auth.me();
      setUser(res.user);
      if (res.user) {
        await syncGuestCartToAccount();
      } else {
        loadGuestCart();
      }
      return res.user;
    } catch {
      setUser(null);
      loadGuestCart();
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [loadGuestCart, syncGuestCartToAccount]);

  useEffect(() => {
    void refreshAuth();
    void refreshSettings();
  }, [refreshAuth, refreshSettings]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Continue client logout cleanup
    }
    setUser(null);
    loadGuestCart();
    pushToast({ title: 'Signed out', description: 'See you again soon at Ruchiloka Café.' });
  }, [loadGuestCart, pushToast]);

  const addToCart = useCallback(
    async ({ item, variantId = null, addonIds = [], quantity = 1, specialInstructions }: AddToCartInput) => {
      if (!item.isAvailable) {
        pushToast({
          title: 'Currently unavailable',
          description: `${item.name} is temporarily out of stock.`,
          tone: 'error',
        });
        return;
      }

      if (user) {
        setCartLoading(true);
        try {
          const updated = await api.cart.addItem({
            menuItemId: item.id,
            variantId,
            addonIds,
            quantity,
            specialInstructions,
          });
          setCart(updated);
          pushToast({
            title: 'Added to your tray',
            description: `${item.name} × ${quantity}`,
            tone: 'accent',
          });
        } catch (err) {
          pushToast({
            title: 'Could not add item',
            description: err instanceof Error ? err.message : 'Please try again.',
            tone: 'error',
          });
        } finally {
          setCartLoading(false);
        }
        return;
      }

      // Guest localStorage persistence
      const selectedVariant = variantId ? item.variants.find((v) => v.id === variantId) ?? null : null;
      const selectedAddons = item.addons
        .filter((a) => addonIds.includes(a.id))
        .map((a) => ({ id: a.id, name: a.name, priceInr: a.priceInr }));

      const sortedAddonKey = selectedAddons
        .map((a) => a.id)
        .sort()
        .join(',');
      const compositeId = `${item.id}::${selectedVariant?.id ?? 'base'}::${sortedAddonKey}`;

      const current = readGuestCartStorage();
      const existingIdx = current.findIndex(
        (rec) => rec.id === compositeId && (rec.specialInstructions ?? '') === (specialInstructions ?? '')
      );

      if (existingIdx >= 0) {
        current[existingIdx] = {
          ...current[existingIdx],
          quantity: Math.min(25, current[existingIdx].quantity + quantity),
        };
      } else {
        current.push({
          id: existingIdx >= 0 ? compositeId : `${compositeId}::${Date.now()}`,
          menuItemId: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          categorySlug: item.categorySlug,
          isAvailable: item.isAvailable,
          isVegetarian: item.isVegetarian,
          unitBasePriceInr: item.priceInr,
          variantId: selectedVariant?.id ?? null,
          variantName: selectedVariant?.name ?? null,
          variantDeltaInr: selectedVariant?.priceDeltaInr ?? 0,
          addons: selectedAddons,
          quantity,
          specialInstructions: specialInstructions?.trim() || null,
        });
      }

      writeGuestCartStorage(current);
      setCart(computeGuestCartDto(current));
      pushToast({
        title: 'Added to your tray',
        description: `${item.name} × ${quantity}`,
        tone: 'accent',
      });
    },
    [user, pushToast]
  );

  const updateCartItemQuantity = useCallback(
    async (cartItemId: string, quantity: number, specialInstructions?: string) => {
      if (user) {
        setCartLoading(true);
        try {
          const updated =
            quantity <= 0
              ? await api.cart.removeItem(cartItemId)
              : await api.cart.updateItem(cartItemId, { quantity, specialInstructions });
          setCart(updated);
        } catch (err) {
          pushToast({
            title: 'Cart update failed',
            description: err instanceof Error ? err.message : 'Please try again.',
            tone: 'error',
          });
        } finally {
          setCartLoading(false);
        }
        return;
      }

      const current = readGuestCartStorage();
      const next =
        quantity <= 0
          ? current.filter((rec) => rec.id !== cartItemId)
          : current.map((rec) =>
              rec.id === cartItemId
                ? {
                    ...rec,
                    quantity: Math.min(25, quantity),
                    ...(specialInstructions !== undefined
                      ? { specialInstructions: specialInstructions.trim() || null }
                      : {}),
                  }
                : rec
            );
      writeGuestCartStorage(next);
      setCart(computeGuestCartDto(next));
    },
    [user, pushToast]
  );

  const removeCartItem = useCallback(
    async (cartItemId: string) => {
      await updateCartItemQuantity(cartItemId, 0);
    },
    [updateCartItemQuantity]
  );

  const clearCart = useCallback(async () => {
    if (user) {
      setCartLoading(true);
      try {
        const cleared = await api.cart.clear();
        setCart(cleared);
      } finally {
        setCartLoading(false);
      }
      return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
    setCart(EMPTY_CART);
  }, [user]);

  const getGuestCartPayload = useCallback(() => {
    return cart.items.map((item) => ({
      menuItemId: item.menuItemId,
      variantId: item.variantId,
      addonIds: item.addons.map((a) => a.id),
      quantity: item.quantity,
      specialInstructions: item.specialInstructions ?? undefined,
    }));
  }, [cart.items]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authLoading,
      refreshAuth,
      logout,
      publicSettings,
      refreshSettings,
      cart,
      cartLoading,
      refreshCart,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
      syncGuestCartToAccount,
      getGuestCartPayload,
      isCartDrawerOpen,
      openCartDrawer: () => setIsCartDrawerOpen(true),
      closeCartDrawer: () => setIsCartDrawerOpen(false),
      isOrderModalOpen,
      openOrderModal: () => setIsOrderModalOpen(true),
      closeOrderModal: () => setIsOrderModalOpen(false),
      pushToast,
      toasts,
      dismissToast,
    }),
    [
      user,
      authLoading,
      refreshAuth,
      logout,
      publicSettings,
      refreshSettings,
      cart,
      cartLoading,
      refreshCart,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
      syncGuestCartToAccount,
      getGuestCartPayload,
      isCartDrawerOpen,
      isOrderModalOpen,
      pushToast,
      toasts,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return ctx;
}
