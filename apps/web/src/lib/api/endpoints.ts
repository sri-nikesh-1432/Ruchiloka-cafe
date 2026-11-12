import type {
  AdminSettingsDto,
  AuthUser,
  CartDto,
  MenuCategoryDto,
  MenuItemDto,
  OrderHandoffResultDto,
  OrderingProvider,
  OrderingProviderStatusDto,
  PublicSiteSettingsDto,
  ReservationDto,
  ReservationSlotAvailabilityDto,
  ReservationStatus,
} from '@ruchiloka/shared';
import { apiFetch } from './client';

export interface MenuQueryParams {
  category?: string;
  search?: string;
  vegetarian?: boolean;
  available?: boolean;
  featured?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'display';
}

export const api = {
  health: () => apiFetch<{ status: string; timestamp: string; database: string }>('/health'),

  settings: {
    getPublic: () => apiFetch<PublicSiteSettingsDto>('/settings/public'),
  },

  menu: {
    listCategories: () => apiFetch<MenuCategoryDto[]>('/categories'),
    listItems: (params?: MenuQueryParams) =>
      apiFetch<MenuItemDto[]>('/menu', {
        query: params
          ? {
              category: params.category,
              search: params.search,
              vegetarian: params.vegetarian,
              available: params.available,
              featured: params.featured,
              sort: params.sort,
            }
          : undefined,
      }),
    getItem: (id: string) => apiFetch<MenuItemDto>(`/menu/${encodeURIComponent(id)}`),
  },

  auth: {
    me: () => apiFetch<{ user: AuthUser | null }>('/auth/me'),
    register: (data: { name: string; email: string; phone?: string; password: string }) =>
      apiFetch<{ user: AuthUser; verificationEmailSent: boolean }>('/auth/register', {
        method: 'POST',
        body: data,
      }),
    login: (data: { email: string; password: string }) =>
      apiFetch<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: data,
      }),
    logout: () =>
      apiFetch<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      }),
    updateProfile: (data: { name: string; phone?: string }) =>
      apiFetch<{ user: AuthUser }>('/auth/profile', {
        method: 'PATCH',
        body: data,
      }),
  },

  cart: {
    get: () => apiFetch<CartDto>('/cart'),
    addItem: (data: {
      menuItemId: string;
      variantId?: string | null;
      addonIds?: string[];
      quantity: number;
      specialInstructions?: string;
    }) =>
      apiFetch<CartDto>('/cart/items', {
        method: 'POST',
        body: data,
      }),
    updateItem: (itemId: string, data: { quantity: number; specialInstructions?: string }) =>
      apiFetch<CartDto>(`/cart/items/${encodeURIComponent(itemId)}`, {
        method: 'PATCH',
        body: data,
      }),
    removeItem: (itemId: string) =>
      apiFetch<CartDto>(`/cart/items/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      }),
    syncGuestItems: (
      items: Array<{
        menuItemId: string;
        variantId?: string | null;
        addonIds?: string[];
        quantity: number;
        specialInstructions?: string;
      }>
    ) =>
      apiFetch<CartDto>('/cart/sync', {
        method: 'POST',
        body: { items },
      }),
    clear: () =>
      apiFetch<CartDto>('/cart', {
        method: 'DELETE',
      }),
  },

  ordering: {
    getProviders: () => apiFetch<OrderingProviderStatusDto[]>('/ordering/providers'),
    prepare: (items?: Array<{ menuItemId: string; variantId?: string | null; addonIds?: string[]; quantity: number; specialInstructions?: string }>) =>
      apiFetch<{
        items: Array<{
          menuItemId: string;
          name: string;
          variantName: string | null;
          addons: string[];
          quantity: number;
          lineTotalInr: number;
        }>;
        subtotalInr: number;
        orderSummaryText: string;
      }>('/ordering/prepare', {
        method: 'POST',
        body: items ? { items } : {},
      }),
    handoff: (
      provider: OrderingProvider,
      items?: Array<{ menuItemId: string; variantId?: string | null; addonIds?: string[]; quantity: number; specialInstructions?: string }>
    ) =>
      apiFetch<OrderHandoffResultDto>(`/ordering/${provider.toLowerCase()}/handoff`, {
        method: 'POST',
        body: items ? { provider, items } : { provider },
      }),
    myHistory: () =>
      apiFetch<
        Array<{
          id: string;
          provider: OrderingProvider;
          mode: string;
          cartTransferred: boolean;
          subtotalInr: number;
          redirectUrl: string | null;
          summarySnapshot: string;
          createdAt: string;
        }>
      >('/ordering/my'),
  },

  reservations: {
    availability: (dateIso: string, guestCount: number) =>
      apiFetch<{ date: string; slots: ReservationSlotAvailabilityDto[] }>(
        '/reservations/availability',
        {
          query: { date: dateIso, guests: guestCount },
        }
      ),
    create: (data: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      reservationDate: string;
      reservationTime: string;
      guestCount: number;
      specialRequests?: string;
    }) =>
      apiFetch<{ reservation: ReservationDto; emailNotificationQueued: boolean }>('/reservations', {
        method: 'POST',
        body: data,
      }),
    myBookings: () => apiFetch<ReservationDto[]>('/reservations/my'),
    getById: (id: string) => apiFetch<ReservationDto>(`/reservations/${encodeURIComponent(id)}`),
    cancel: (id: string) =>
      apiFetch<ReservationDto>(`/reservations/${encodeURIComponent(id)}/cancel`, {
        method: 'PATCH',
      }),
  },

  contact: {
    submit: (data: {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
    }) =>
      apiFetch<{ id: string; submittedAt: string }>('/contact', {
        method: 'POST',
        body: data,
      }),
  },

  admin: {
    dashboard: () =>
      apiFetch<{
        metrics: {
          totalReservations: number;
          pendingReservations: number;
          confirmedReservations: number;
          totalUsers: number;
          totalMenuItems: number;
          availableMenuItems: number;
          unavailableMenuItems: number;
          recentEnquiriesCount: number;
        };
        recentReservations: ReservationDto[];
        recentEnquiries: Array<{
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          status: string;
          createdAt: string;
        }>;
      }>('/admin/dashboard'),

    listReservations: (params?: { date?: string; status?: string; search?: string }) =>
      apiFetch<ReservationDto[]>('/admin/reservations', { query: params }),

    updateReservationStatus: (id: string, status: ReservationStatus, adminNotes?: string) =>
      apiFetch<ReservationDto>(`/admin/reservations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: { status, adminNotes },
      }),

    listMenuItems: () => apiFetch<MenuItemDto[]>('/admin/menu'),
    createMenuItem: (data: Record<string, unknown>) =>
      apiFetch<MenuItemDto>('/admin/menu', { method: 'POST', body: data }),
    updateMenuItem: (id: string, data: Record<string, unknown>) =>
      apiFetch<MenuItemDto>(`/admin/menu/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
    deleteMenuItem: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/admin/menu/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    uploadMenuImage: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiFetch<{ imageUrl: string }>('/admin/menu/upload-image', {
        method: 'POST',
        body: formData,
      });
    },

    listCustomers: (search?: string) =>
      apiFetch<
        Array<{
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: string;
          emailVerified: boolean;
          createdAt: string;
          _count: { reservations: number; orderHandoffs: number };
        }>
      >('/admin/customers', { query: { search } }),

    getSettings: () => apiFetch<AdminSettingsDto>('/admin/settings'),
    updateSettings: (data: Record<string, unknown>) =>
      apiFetch<AdminSettingsDto>('/admin/settings', { method: 'PATCH', body: data }),

    listAuditLogs: () =>
      apiFetch<
        Array<{
          id: string;
          action: string;
          entityType: string;
          entityId: string | null;
          actorEmail: string | null;
          metadata: unknown;
          createdAt: string;
        }>
      >('/admin/audit-logs'),
  },
};
