-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrderingProvider" AS ENUM ('SWIGGY', 'ZOMATO');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token_hash" TEXT,
    "verification_expires_at" TIMESTAMP(3),
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "service_window_key" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_inr" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT true,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "prep_time_minutes" INTEGER NOT NULL DEFAULT 15,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_variants" (
    "id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta_inr" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_addons" (
    "id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_inr" INTEGER NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "variant_id" UUID,
    "addon_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "special_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_slots" (
    "id" UUID NOT NULL,
    "slot_date" TEXT NOT NULL,
    "slot_time" TEXT NOT NULL,
    "capacity_guests" INTEGER NOT NULL,
    "capacity_tables" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "booking_code" TEXT NOT NULL,
    "user_id" UUID,
    "slot_id" UUID,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "reservation_date" TEXT NOT NULL,
    "reservation_time" TEXT NOT NULL,
    "guest_count" INTEGER NOT NULL,
    "special_requests" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_platforms" (
    "id" UUID NOT NULL,
    "code" "OrderingProvider" NOT NULL,
    "display_name" TEXT NOT NULL,
    "api_enabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_restaurant_mappings" (
    "id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "external_restaurant_id" TEXT NOT NULL,
    "listing_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_restaurant_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_item_mappings" (
    "id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "external_item_id" TEXT NOT NULL,
    "external_variant_map_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_item_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_handoffs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "provider" "OrderingProvider" NOT NULL,
    "mode" TEXT NOT NULL,
    "cart_transferred" BOOLEAN NOT NULL DEFAULT false,
    "external_cart_id" TEXT,
    "subtotal_inr" INTEGER NOT NULL,
    "redirect_url" TEXT,
    "summary_snapshot" TEXT NOT NULL,
    "items_snapshot_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL,
    "provider_message_id" TEXT,
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "cafe_name" TEXT NOT NULL,
    "cafe_phone" TEXT NOT NULL,
    "cafe_address" TEXT NOT NULL,
    "notification_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "operating_hours_json" JSONB NOT NULL,
    "reservation_slot_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_guests_per_slot" INTEGER NOT NULL DEFAULT 24,
    "max_tables_per_slot" INTEGER NOT NULL DEFAULT 8,
    "auto_confirm_reservations" BOOLEAN NOT NULL DEFAULT false,
    "swiggy_restaurant_id" TEXT,
    "swiggy_listing_url" TEXT,
    "zomato_restaurant_id" TEXT,
    "zomato_listing_url" TEXT,
    "instagram_url" TEXT,
    "facebook_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_email" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata_json" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE UNIQUE INDEX "menu_categories_slug_key" ON "menu_categories"("slug");
CREATE UNIQUE INDEX "menu_items_slug_key" ON "menu_items"("slug");
CREATE INDEX "menu_items_category_id_is_available_display_order_idx" ON "menu_items"("category_id", "is_available", "display_order");
CREATE INDEX "menu_items_is_featured_is_available_idx" ON "menu_items"("is_featured", "is_available");
CREATE INDEX "menu_item_variants_menu_item_id_idx" ON "menu_item_variants"("menu_item_id");
CREATE INDEX "menu_addons_menu_item_id_idx" ON "menu_addons"("menu_item_id");
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");
CREATE UNIQUE INDEX "reservation_slots_slot_date_slot_time_key" ON "reservation_slots"("slot_date", "slot_time");
CREATE UNIQUE INDEX "reservations_booking_code_key" ON "reservations"("booking_code");
CREATE INDEX "reservations_reservation_date_reservation_time_status_idx" ON "reservations"("reservation_date", "reservation_time", "status");
CREATE INDEX "reservations_user_id_created_at_idx" ON "reservations"("user_id", "created_at");
CREATE INDEX "reservations_customer_email_idx" ON "reservations"("customer_email");
CREATE UNIQUE INDEX "external_platforms_code_key" ON "external_platforms"("code");
CREATE UNIQUE INDEX "external_restaurant_mappings_platform_id_external_restaurant_id_key" ON "external_restaurant_mappings"("platform_id", "external_restaurant_id");
CREATE UNIQUE INDEX "external_item_mappings_platform_id_menu_item_id_key" ON "external_item_mappings"("platform_id", "menu_item_id");
CREATE INDEX "order_handoffs_user_id_created_at_idx" ON "order_handoffs"("user_id", "created_at");
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");
CREATE INDEX "email_logs_event_type_created_at_idx" ON "email_logs"("event_type", "created_at");
CREATE INDEX "email_logs_recipient_email_idx" ON "email_logs"("recipient_email");
CREATE UNIQUE INDEX "admin_settings_key_key" ON "admin_settings"("key");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "menu_addons" ADD CONSTRAINT "menu_addons_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "menu_item_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "reservation_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "external_restaurant_mappings" ADD CONSTRAINT "external_restaurant_mappings_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "external_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_item_mappings" ADD CONSTRAINT "external_item_mappings_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "external_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_item_mappings" ADD CONSTRAINT "external_item_mappings_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_handoffs" ADD CONSTRAINT "order_handoffs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
