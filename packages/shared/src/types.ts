import {
  GallerySourcePlatform,
  OrderingProvider,
  ReservationStatus,
  ReviewModerationStatus,
  UserRole,
} from './schemas';
import { MenuCategorySlug, OperatingWindow } from './business';
import { GalleryCategorySlug } from './authenticContent';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface MenuCategoryDto {
  id: string;
  slug: MenuCategorySlug;
  name: string;
  description: string | null;
  displayOrder: number;
  serviceWindowKey: string;
}

export interface MenuVariantDto {
  id: string;
  name: string;
  priceDeltaInr: number;
  isAvailable: boolean;
}

export interface MenuAddonDto {
  id: string;
  name: string;
  priceInr: number;
  isAvailable: boolean;
}

export interface MenuItemDto {
  id: string;
  categoryId: string;
  categorySlug: MenuCategorySlug;
  categoryName: string;
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
  variants: MenuVariantDto[];
  addons: MenuAddonDto[];
}

export interface CartItemDto {
  id: string;
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

export interface CartDto {
  items: CartItemDto[];
  itemCount: number;
  subtotalInr: number;
  currency: 'INR';
}

export interface ReservationSlotAvailabilityDto {
  time24: string;
  label12: string;
  available: boolean;
  remainingCapacity: number;
  activeServices: string[];
  reason?: string;
}

export interface ReservationDto {
  id: string;
  bookingCode: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequests: string | null;
  status: ReservationStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderingProviderStatusDto {
  provider: OrderingProvider;
  displayName: string;
  apiHandoffEnabled: boolean;
  listingConfigured: boolean;
  listingUrl: string | null;
  mode: 'PARTNER_API_HANDOFF' | 'VERIFIED_LISTING_FALLBACK' | 'UNCONFIGURED';
  notice: string;
}

export interface OrderHandoffResultDto {
  handoffId: string;
  provider: OrderingProvider;
  cartTransferred: boolean;
  mode: 'PARTNER_API_HANDOFF' | 'VERIFIED_LISTING_FALLBACK';
  redirectUrl: string | null;
  message: string;
  orderSummaryText: string;
  items: Array<{
    name: string;
    variantName?: string | null;
    addons: string[];
    quantity: number;
    lineTotalInr: number;
  }>;
  subtotalInr: number;
  createdAt: string;
}

export interface PublicSiteSettingsDto {
  cafeName: string;
  cafeAddress: string;
  cafePhone: string;
  operatingHours: OperatingWindow[];
  reservationSlotMinutes: number;
  maxGuestsPerSlot: number;
  instagramUrl: string | null;
  facebookUrl: string | null;
  swiggyListingUrl: string | null;
  zomatoListingUrl: string | null;
}

export interface AdminSettingsDto extends PublicSiteSettingsDto {
  notificationEmails: string[];
  maxTablesPerSlot: number;
  autoConfirmReservations: boolean;
  swiggyRestaurantId: string | null;
  zomatoRestaurantId: string | null;
  swiggyApiHandoffEnabled: boolean;
  zomatoApiHandoffEnabled: boolean;
}

export interface WebsiteReviewDto {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  message: string;
  photoUrl: string | null;
  status: ReviewModerationStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteReviewStatsDto {
  approvedCount: number;
  averageRating: number | null;
}

export interface PublicReviewsPayloadDto {
  websiteReviews: WebsiteReviewDto[];
  websiteStats: WebsiteReviewStatsDto;
}

export interface GalleryPhotoDto {
  id: string;
  slug: string;
  title: string;
  categorySlug: GalleryCategorySlug;
  imageUrl: string;
  width: number;
  height: number;
  caption: string;
  altText: string;
  sourcePlatform: GallerySourcePlatform;
  sourceUrl: string;
  attribution: string;
  isCustomerOrCreator: boolean;
  permissionNote: string | null;
  isFeaturedOnHome: boolean;
  showInInstagramPreview: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface PublicGalleryPayloadDto {
  photos: GalleryPhotoDto[];
  categories: Array<{
    slug: GalleryCategorySlug;
    label: string;
    count: number;
  }>;
}
