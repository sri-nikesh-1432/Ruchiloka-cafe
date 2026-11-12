import { z } from 'zod';

export const UserRoleSchema = z.enum(['CUSTOMER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const ReservationStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
]);
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const OrderingProviderSchema = z.enum(['SWIGGY', 'ZOMATO']);
export type OrderingProvider = z.infer<typeof OrderingProviderSchema>;

export const MenuCategorySlugSchema = z.enum([
  'tiffins',
  'beverages',
  'continental',
  'snacks',
]);

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(80),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,16}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});

export const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,16}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

export const CreateReservationSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required').max(100),
  customerEmail: z.string().trim().email('Valid email address is required').toLowerCase(),
  customerPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,16}$/, 'Valid phone number is required'),
  reservationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reservationTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time slot must be HH:mm'),
  guestCount: z.coerce
    .number()
    .int()
    .min(1, 'At least 1 guest is required')
    .max(20, 'For parties larger than 20, please call +91 91216 78449'),
  specialRequests: z.string().trim().max(500).optional().or(z.literal('')),
});

export const CartAddItemSchema = z.object({
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  addonIds: z.array(z.string().uuid()).default([]),
  quantity: z.number().int().min(1).max(25).default(1),
  specialInstructions: z.string().trim().max(300).optional().or(z.literal('')),
});

export const CartUpdateItemSchema = z.object({
  quantity: z.number().int().min(0).max(25),
  specialInstructions: z.string().trim().max(300).optional().or(z.literal('')),
});

export const CartSyncSchema = z.object({
  items: z.array(CartAddItemSchema).max(50),
});

export const ContactFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,16}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().min(3, 'Please enter a subject').max(150),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

export const OrderHandoffSchema = z.object({
  provider: OrderingProviderSchema,
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        variantId: z.string().uuid().nullable().optional(),
        addonIds: z.array(z.string().uuid()).optional(),
        quantity: z.number().int().min(1).max(25),
        specialInstructions: z.string().trim().max(300).optional(),
      })
    )
    .optional(),
});

export const AdminMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(4).max(800),
  priceInr: z.coerce.number().int().min(1).max(100000),
  imageUrl: z.string().trim().min(1).max(1000),
  isVegetarian: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  prepTimeMinutes: z.coerce.number().int().min(1).max(120).default(15),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(60),
        priceDeltaInr: z.coerce.number().int().min(-5000).max(50000).default(0),
        isAvailable: z.boolean().default(true),
      })
    )
    .default([]),
  addons: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(60),
        priceInr: z.coerce.number().int().min(0).max(50000),
        isAvailable: z.boolean().default(true),
      })
    )
    .default([]),
});

export const AdminSettingsSchema = z.object({
  cafePhone: z.string().trim().min(6).max(30).optional(),
  cafeAddress: z.string().trim().min(10).max(400).optional(),
  notificationEmails: z.array(z.string().trim().email().toLowerCase()).min(1).max(10).optional(),
  reservationSlotMinutes: z.coerce.number().int().min(15).max(120).optional(),
  maxGuestsPerSlot: z.coerce.number().int().min(4).max(200).optional(),
  maxTablesPerSlot: z.coerce.number().int().min(1).max(100).optional(),
  autoConfirmReservations: z.boolean().optional(),
  swiggyRestaurantId: z.string().trim().max(120).optional().nullable(),
  swiggyListingUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
  zomatoRestaurantId: z.string().trim().max(120).optional().nullable(),
  zomatoListingUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
  instagramUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
  facebookUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
  operatingHoursJson: z
    .array(
      z.object({
        key: z.enum(['tiffins', 'beverages', 'continental_snacks']),
        label: z.string().trim().min(2).max(80),
        startTime24: z.string().regex(/^\d{2}:\d{2}$/),
        endTime24: z.string().regex(/^\d{2}:\d{2}$/),
        displayHours: z.string().trim().min(3).max(60),
        description: z.string().trim().max(240),
      })
    )
    .optional(),
});

export const ReviewModerationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type ReviewModerationStatus = z.infer<typeof ReviewModerationStatusSchema>;

export const GallerySourcePlatformSchema = z.enum([
  'GOOGLE_MAPS',
  'INSTAGRAM',
  'OWNER_UPLOAD',
]);
export type GallerySourcePlatform = z.infer<typeof GallerySourcePlatformSchema>;

export const GalleryCategorySlugSchema = z.enum([
  'cafe-ambience',
  'outdoor-seating',
  'breakfast',
  'food',
  'milkshakes',
  'evening-experience',
  'cafe-exterior',
  'community-activities',
]);

export const CreateWebsiteReviewSchema = z.object({
  customerName: z.string().trim().min(2, 'Please enter your name (min 2 characters)').max(80),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Please select a star rating from 1 to 5')
    .max(5, 'Star rating must be between 1 and 5'),
  title: z
    .string()
    .trim()
    .max(120, 'Review title cannot exceed 120 characters')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(8, 'Please write at least 8 characters sharing your experience')
    .max(1500, 'Review message cannot exceed 1,500 characters'),
});

export const AdminModerateReviewSchema = z.object({
  status: ReviewModerationStatusSchema,
  adminNote: z.string().trim().max(400).optional().or(z.literal('')),
});

export const AdminGalleryPhotoSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(120),
  categorySlug: GalleryCategorySlugSchema,
  imageUrl: z.string().trim().min(1, 'Image URL is required').max(1500),
  width: z.coerce.number().int().min(100).max(6000).default(1200),
  height: z.coerce.number().int().min(100).max(6000).default(900),
  caption: z.string().trim().min(4, 'Caption is required').max(400),
  altText: z.string().trim().min(4, 'Alt text is required').max(300),
  sourcePlatform: GallerySourcePlatformSchema.default('OWNER_UPLOAD'),
  sourceUrl: z.string().trim().min(1).max(1000),
  attribution: z.string().trim().min(2).max(160),
  isCustomerOrCreator: z.boolean().default(false),
  permissionNote: z.string().trim().max(400).optional().nullable(),
  isFeaturedOnHome: z.boolean().default(false),
  showInInstagramPreview: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const AdminUpdateGalleryPhotoSchema = AdminGalleryPhotoSchema.partial().refine(
  (obj) => Object.keys(obj).length > 0,
  'At least one gallery field must be provided'
);
