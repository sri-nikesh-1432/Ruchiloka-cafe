-- CreateEnum
CREATE TYPE "ReviewModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GallerySourcePlatform" AS ENUM ('GOOGLE_MAPS', 'INSTAGRAM', 'OWNER_UPLOAD');

-- CreateTable
CREATE TABLE "website_reviews" (
    "id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "photo_url" TEXT,
    "status" "ReviewModerationStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "moderated_by_id" UUID,
    "moderated_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_photos" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category_slug" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1200,
    "height" INTEGER NOT NULL DEFAULT 900,
    "caption" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "source_platform" "GallerySourcePlatform" NOT NULL,
    "source_url" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "is_customer_or_creator" BOOLEAN NOT NULL DEFAULT false,
    "permission_note" TEXT,
    "is_featured_on_home" BOOLEAN NOT NULL DEFAULT false,
    "show_in_instagram_preview" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "website_reviews_status_created_at_idx" ON "website_reviews"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_photos_slug_key" ON "gallery_photos"("slug");

-- CreateIndex
CREATE INDEX "gallery_photos_is_published_category_slug_display_order_idx" ON "gallery_photos"("is_published", "category_slug", "display_order");

-- AddForeignKey
ALTER TABLE "website_reviews" ADD CONSTRAINT "website_reviews_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
