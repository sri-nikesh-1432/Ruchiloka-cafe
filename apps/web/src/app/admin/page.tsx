'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardList,
  Edit3,
  ExternalLink,
  ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Users,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';
import {
  formatIstDateDisplay,
  GALLERY_CATEGORY_LABELS,
  type AdminSettingsDto,
  type GalleryCategorySlug,
  type GalleryPhotoDto,
  type GallerySourcePlatform,
  type MenuCategoryDto,
  type MenuItemDto,
  type ReservationDto,
  type ReservationStatus,
  type ReviewModerationStatus,
  type WebsiteReviewDto,
} from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

type AdminTab =
  | 'overview'
  | 'menu'
  | 'reservations'
  | 'reviews'
  | 'gallery'
  | 'customers'
  | 'settings'
  | 'audit';

interface DashboardData {
  metrics: {
    totalReservations: number;
    pendingReservations: number;
    confirmedReservations: number;
    totalUsers: number;
    totalMenuItems: number;
    availableMenuItems: number;
    unavailableMenuItems: number;
    recentEnquiriesCount: number;
    pendingReviewsCount?: number;
    approvedReviewsCount?: number;
    publishedGalleryCount?: number;
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
}

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  _count: { reservations: number; orderHandoffs: number };
}

interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  metadata: unknown;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, authLoading, pushToast, refreshSettings } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<MenuCategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [settings, setSettings] = useState<AdminSettingsDto | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Reservation filters
  const [resDateFilter, setResDateFilter] = useState('');
  const [resStatusFilter, setResStatusFilter] = useState('');
  const [resSearch, setResSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Menu Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDto | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('120');
  const [formImageUrl, setFormImageUrl] = useState('/images/exp-tiffins.webp');
  const [formVeg, setFormVeg] = useState(true);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPrepTime, setFormPrepTime] = useState('15');
  const [formOrder, setFormOrder] = useState('0');
  const [formVariants, setFormVariants] = useState<
    Array<{ name: string; priceDeltaInr: number; isAvailable: boolean }>
  >([]);
  const [formAddons, setFormAddons] = useState<
    Array<{ name: string; priceInr: number; isAvailable: boolean }>
  >([]);
  const [savingMenu, setSavingMenu] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Settings form state
  const [notifEmailsInput, setNotifEmailsInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Reviews moderation state
  const [reviewsList, setReviewsList] = useState<WebsiteReviewDto[]>([]);
  const [reviewCounts, setReviewCounts] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
  });
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'ALL' | ReviewModerationStatus>('ALL');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Gallery manager state
  const [galleryList, setGalleryList] = useState<GalleryPhotoDto[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategorySlug>('cafe-ambience');
  const [galleryImageUrl, setGalleryImageUrl] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryAlt, setGalleryAlt] = useState('');
  const [galleryPlatform, setGalleryPlatform] = useState<GallerySourcePlatform>('OWNER_UPLOAD');
  const [gallerySourceUrl, setGallerySourceUrl] = useState('');
  const [galleryAttribution, setGalleryAttribution] = useState('Ruchiloka Café');
  const [galleryCustomerPermitted, setGalleryCustomerPermitted] = useState(true);
  const [galleryPermissionNote, setGalleryPermissionNote] = useState('');
  const [galleryFeaturedOnHome, setGalleryFeaturedOnHome] = useState(false);
  const [uploadingGalleryImg, setUploadingGalleryImg] = useState(false);
  const [savingGalleryPhoto, setSavingGalleryPhoto] = useState(false);

  const loadTabData = useCallback(async (tab: AdminTab) => {
    setLoadingTab(true);
    try {
      if (tab === 'overview') {
        const data = await api.admin.dashboard();
        setDashboard(data);
      } else if (tab === 'menu') {
        const [cats, items] = await Promise.all([
          api.menu.listCategories(),
          api.admin.listMenuItems(),
        ]);
        setCategories(cats);
        setMenuItems(items);
      } else if (tab === 'reservations') {
        const list = await api.admin.listReservations({
          date: resDateFilter || undefined,
          status: resStatusFilter || undefined,
          search: resSearch || undefined,
        });
        setReservations(list);
      } else if (tab === 'reviews') {
        const data = await api.admin.listReviews(
          reviewStatusFilter === 'ALL' ? undefined : reviewStatusFilter
        );
        setReviewsList(data.reviews);
        setReviewCounts(data.counts);
      } else if (tab === 'gallery') {
        const photos = await api.admin.listGallery();
        setGalleryList(photos);
      } else if (tab === 'customers') {
        const list = await api.admin.listCustomers(customerSearch || undefined);
        setCustomers(list);
      } else if (tab === 'settings') {
        const cfg = await api.admin.getSettings();
        setSettings(cfg);
        setNotifEmailsInput(cfg.notificationEmails.join(', '));
      } else if (tab === 'audit') {
        const logs = await api.admin.listAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err) {
      pushToast({
        title: 'Admin fetch failed',
        description: err instanceof Error ? err.message : 'Unable to load admin data.',
        tone: 'error',
      });
    } finally {
      setLoadingTab(false);
    }
  }, [resDateFilter, resStatusFilter, resSearch, reviewStatusFilter, customerSearch, pushToast]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      void loadTabData(activeTab);
    }
  }, [user, activeTab, loadTabData]);

  const openCreateMenu = () => {
    setEditingItem(null);
    setFormCategoryId(categories[0]?.id ?? '');
    setFormName('');
    setFormDesc('');
    setFormPrice('120');
    setFormImageUrl('/images/exp-tiffins.webp');
    setFormVeg(true);
    setFormAvailable(true);
    setFormFeatured(false);
    setFormPrepTime('15');
    setFormOrder(String(menuItems.length));
    setFormVariants([]);
    setFormAddons([]);
    setEditorOpen(true);
  };

  const openEditMenu = (item: MenuItemDto) => {
    setEditingItem(item);
    setFormCategoryId(item.categoryId);
    setFormName(item.name);
    setFormDesc(item.description);
    setFormPrice(String(item.priceInr));
    setFormImageUrl(item.imageUrl);
    setFormVeg(item.isVegetarian);
    setFormAvailable(item.isAvailable);
    setFormFeatured(item.isFeatured);
    setFormPrepTime(String(item.prepTimeMinutes));
    setFormOrder(String(item.displayOrder));
    setFormVariants(
      item.variants.map((v) => ({
        name: v.name,
        priceDeltaInr: v.priceDeltaInr,
        isAvailable: v.isAvailable,
      }))
    );
    setFormAddons(
      item.addons.map((a) => ({
        name: a.name,
        priceInr: a.priceInr,
        isAvailable: a.isAvailable,
      }))
    );
    setEditorOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await api.admin.uploadMenuImage(file);
      setFormImageUrl(res.imageUrl);
      pushToast({ title: 'Image uploaded', tone: 'accent' });
    } catch (err) {
      pushToast({
        title: 'Image upload failed',
        description: err instanceof Error ? err.message : 'Provide a valid image URL instead.',
        tone: 'error',
      });
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMenu(true);
    try {
      const payload = {
        categoryId: formCategoryId,
        name: formName,
        description: formDesc,
        priceInr: Number(formPrice),
        imageUrl: formImageUrl,
        isVegetarian: formVeg,
        isAvailable: formAvailable,
        isFeatured: formFeatured,
        prepTimeMinutes: Number(formPrepTime),
        displayOrder: Number(formOrder),
        variants: formVariants,
        addons: formAddons,
      };
      if (editingItem) {
        await api.admin.updateMenuItem(editingItem.id, payload);
        pushToast({ title: 'Menu item updated', tone: 'accent' });
      } else {
        await api.admin.createMenuItem(payload);
        pushToast({ title: 'Menu item created', tone: 'accent' });
      }
      setEditorOpen(false);
      await loadTabData('menu');
    } catch (err) {
      pushToast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Check all menu fields.',
        tone: 'error',
      });
    } finally {
      setSavingMenu(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItemDto) => {
    try {
      await api.admin.updateMenuItem(item.id, {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        priceInr: item.priceInr,
        imageUrl: item.imageUrl,
        isVegetarian: item.isVegetarian,
        isAvailable: !item.isAvailable,
        isFeatured: item.isFeatured,
        prepTimeMinutes: item.prepTimeMinutes,
        displayOrder: item.displayOrder,
        variants: item.variants,
        addons: item.addons,
      });
      setMenuItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isAvailable: !x.isAvailable } : x))
      );
      pushToast({
        title: !item.isAvailable ? 'Marked Available' : 'Marked Sold Out',
        description: item.name,
        tone: 'info',
      });
    } catch (err) {
      pushToast({
        title: 'Toggle failed',
        description: err instanceof Error ? err.message : 'Retry shortly.',
        tone: 'error',
      });
    }
  };

  const handleDeleteMenu = async (item: MenuItemDto) => {
    if (!window.confirm(`Delete "${item.name}" permanently from the menu?`)) return;
    try {
      await api.admin.deleteMenuItem(item.id);
      setMenuItems((prev) => prev.filter((x) => x.id !== item.id));
      pushToast({ title: 'Dish deleted', description: item.name, tone: 'info' });
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete dish.',
        tone: 'error',
      });
    }
  };

  const handleUpdateReservation = async (id: string, status: ReservationStatus) => {
    try {
      const updated = await api.admin.updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      pushToast({
        title: `Booking ${status.toLowerCase()}`,
        description: updated.bookingCode,
        tone: 'accent',
      });
    } catch (err) {
      pushToast({
        title: 'Status update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const emails = notifEmailsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await api.admin.updateSettings({
        cafePhone: settings.cafePhone,
        cafeAddress: settings.cafeAddress,
        notificationEmails: emails,
        reservationSlotMinutes: Number(settings.reservationSlotMinutes),
        maxGuestsPerSlot: Number(settings.maxGuestsPerSlot),
        maxTablesPerSlot: Number(settings.maxTablesPerSlot),
        autoConfirmReservations: settings.autoConfirmReservations,
        swiggyRestaurantId: settings.swiggyRestaurantId,
        swiggyListingUrl: settings.swiggyListingUrl,
        zomatoRestaurantId: settings.zomatoRestaurantId,
        zomatoListingUrl: settings.zomatoListingUrl,
        instagramUrl: settings.instagramUrl,
        facebookUrl: settings.facebookUrl,
        operatingHoursJson: settings.operatingHours,
      });
      setSettings(updated);
      await refreshSettings();
      pushToast({ title: 'Café settings saved', tone: 'accent' });
    } catch (err) {
      pushToast({
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : 'Check input values.',
        tone: 'error',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleModerateReview = async (id: string, status: ReviewModerationStatus) => {
    try {
      const updated = await api.admin.moderateReview(id, status, reviewNotes[id] ?? '');
      setReviewsList((prev) => prev.map((r) => (r.id === id ? updated : r)));
      pushToast({
        title: `Review ${status.toLowerCase()}`,
        description: `${updated.customerName} (${updated.rating}★)`,
        tone: 'accent',
      });
      await loadTabData('reviews');
    } catch (err) {
      pushToast({
        title: 'Moderation failed',
        description: err instanceof Error ? err.message : 'Unable to update review.',
        tone: 'error',
      });
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await api.admin.deleteReview(id);
      setReviewsList((prev) => prev.filter((r) => r.id !== id));
      pushToast({ title: 'Review deleted', tone: 'default' });
      await loadTabData('reviews');
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete review.',
        tone: 'error',
      });
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGalleryImg(true);
    try {
      const res = await api.admin.uploadGalleryImage(file);
      setGalleryImageUrl(res.imageUrl);
      pushToast({ title: 'Gallery image uploaded', tone: 'accent' });
    } catch (err) {
      pushToast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Invalid image file.',
        tone: 'error',
      });
    } finally {
      setUploadingGalleryImg(false);
    }
  };

  const handleCreateGalleryPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryTitle.trim() || !galleryImageUrl.trim()) return;
    setSavingGalleryPhoto(true);
    try {
      await api.admin.createGalleryPhoto({
        title: galleryTitle.trim(),
        categorySlug: galleryCategory,
        imageUrl: galleryImageUrl.trim(),
        width: 1200,
        height: 900,
        caption: galleryCaption.trim() || galleryTitle.trim(),
        altText: galleryAlt.trim() || galleryTitle.trim(),
        sourcePlatform: galleryPlatform,
        sourceUrl:
          gallerySourceUrl.trim() || 'https://www.instagram.com/ruchilokacafe.in/',
        attribution: galleryAttribution.trim() || 'Ruchiloka Café',
        isCustomerOrCreator: galleryCustomerPermitted,
        permissionNote: galleryPermissionNote.trim() || null,
        isFeaturedOnHome: galleryFeaturedOnHome,
        showInInstagramPreview: galleryPlatform === 'INSTAGRAM',
        isPublished: true,
        displayOrder: galleryList.length + 1,
      });
      pushToast({ title: 'Gallery photograph added', tone: 'accent' });
      setGalleryTitle('');
      setGalleryImageUrl('');
      setGalleryCaption('');
      setGalleryAlt('');
      setGallerySourceUrl('');
      setGalleryPermissionNote('');
      setGalleryFeaturedOnHome(false);
      await loadTabData('gallery');
    } catch (err) {
      pushToast({
        title: 'Could not add photograph',
        description: err instanceof Error ? err.message : 'Check required fields.',
        tone: 'error',
      });
    } finally {
      setSavingGalleryPhoto(false);
    }
  };

  const handleToggleGalleryFlag = async (
    photo: GalleryPhotoDto,
    field: 'isPublished' | 'isFeaturedOnHome'
  ) => {
    try {
      const updated = await api.admin.updateGalleryPhoto(photo.id, {
        [field]: !photo[field],
      });
      setGalleryList((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
      pushToast({ title: 'Gallery item updated', tone: 'accent' });
    } catch (err) {
      pushToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      });
    }
  };

  const handleDeleteGalleryPhoto = async (id: string) => {
    try {
      await api.admin.deleteGalleryPhoto(id);
      setGalleryList((prev) => prev.filter((p) => p.id !== id));
      pushToast({ title: 'Gallery photograph removed', tone: 'default' });
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete photo.',
        tone: 'error',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="pt-32 pb-24 editorial-container">
        <div className="h-72 animate-pulse rounded-3xl bg-ivory border border-beige-border" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="pt-32 pb-24 editorial-container max-w-md">
        <div className="rounded-[2rem] border border-beige-border bg-ivory p-10 text-center space-y-5 shadow-card">
          <ShieldAlert className="mx-auto h-10 w-10 text-cognac" />
          <h1 className="font-serif text-3xl font-semibold text-dark-brown">
            Administrator Access Only
          </h1>
          <p className="text-sm text-coffee-muted">
            {user
              ? 'Your account does not have administrator privileges.'
              : 'Please sign in with an administrator account to manage Ruchiloka Café.'}
          </p>
          <Link
            href={user ? '/profile' : '/login?next=/admin'}
            className="inline-flex rounded-full bg-dark-brown px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors"
          >
            {user ? 'Return to Profile' : 'Sign In as Admin'}
          </Link>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'menu', label: 'Menu & Add-ons', icon: Utensils },
    { id: 'reservations', label: 'Reservations', icon: ClipboardList },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings & Integrations', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
  ];

  return (
    <PageTransitionWrapper className="pt-32 pb-24">
      <div className="editorial-container space-y-8">
        <div className="border-b border-beige-border pb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="editorial-kicker">Management Studio</span>
            <h1 className="mt-2 editorial-heading text-4xl font-semibold">
              Ruchiloka Admin Dashboard
            </h1>
          </div>
          <span className="font-mono text-xs text-coffee-muted">
            Signed in as {user.email}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-dark-brown text-cream shadow-sm'
                    : 'border border-beige-border bg-ivory text-coffee hover:border-cognac'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loadingTab && (
          <div className="flex items-center gap-2 text-xs text-coffee-muted">
            <Loader2 className="h-4 w-4 animate-spin text-cognac" />
            Refreshing data...
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Pending Reservations', value: dashboard.metrics.pendingReservations },
                { label: 'Confirmed Reservations', value: dashboard.metrics.confirmedReservations },
                {
                  label: 'Menu Items (Avail / Unavail)',
                  value: `${dashboard.metrics.availableMenuItems} / ${dashboard.metrics.unavailableMenuItems}`,
                },
                { label: 'Registered Guests', value: dashboard.metrics.totalUsers },
                {
                  label: 'Pending / Approved Reviews',
                  value: `${dashboard.metrics.pendingReviewsCount ?? 0} / ${dashboard.metrics.approvedReviewsCount ?? 0}`,
                },
                {
                  label: 'Published Gallery Photos',
                  value: dashboard.metrics.publishedGalleryCount ?? 0,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-beige-border bg-ivory p-6 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-serif text-4xl font-semibold text-dark-brown">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-3xl border border-beige-border bg-ivory p-6 space-y-4">
                <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                  Recent Reservations ({dashboard.metrics.totalReservations} total)
                </h2>
                {dashboard.recentReservations.length === 0 ? (
                  <p className="text-sm text-coffee-muted">No reservations submitted yet.</p>
                ) : (
                  <ul className="divide-y divide-beige-border text-sm">
                    {dashboard.recentReservations.map((r) => (
                      <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-dark-brown">
                            {r.customerName}{' '}
                            <span className="font-mono text-xs text-coffee-muted">
                              ({r.guestCount} guests)
                            </span>
                          </p>
                          <p className="text-xs text-coffee-muted">
                            {formatIstDateDisplay(r.reservationDate)} · {r.reservationTime} IST
                          </p>
                        </div>
                        <span className="rounded-full bg-beige px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-coffee">
                          {r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-3xl border border-beige-border bg-ivory p-6 space-y-4">
                <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                  Recent Enquiries ({dashboard.metrics.recentEnquiriesCount})
                </h2>
                {dashboard.recentEnquiries.length === 0 ? (
                  <p className="text-sm text-coffee-muted">No contact messages yet.</p>
                ) : (
                  <ul className="divide-y divide-beige-border text-sm">
                    {dashboard.recentEnquiries.map((msg) => (
                      <li key={msg.id} className="py-3 space-y-1">
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-dark-brown">{msg.subject}</span>
                          <span className="font-mono text-[11px] text-coffee-muted">
                            {new Date(msg.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-coffee-muted">
                          From {msg.name} ({msg.email})
                        </p>
                        <p className="text-xs text-coffee line-clamp-2">{msg.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-coffee-muted">
                Create, price, toggle availability, or customize add-ons for every Ruchiloka dish.
              </p>
              <button
                type="button"
                onClick={openCreateMenu}
                className="inline-flex items-center gap-2 rounded-full bg-cognac px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-cognac-hover transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Menu Item
              </button>
            </div>

            {menuItems.length === 0 ? (
              <div className="rounded-3xl border border-beige-border bg-ivory p-12 text-center space-y-3">
                <Utensils className="mx-auto h-8 w-8 text-cognac" />
                <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                  Your menu is empty
                </h2>
                <p className="text-sm text-coffee-muted">
                  Add your first Tiffins, Tea &amp; Coffee, Continental, or Snacks item above.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-3xl border border-beige-border bg-ivory p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-2xl object-cover bg-beige"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-lg font-semibold text-dark-brown truncate">
                            {item.name}
                          </h3>
                          <span className="font-mono text-sm font-bold text-dark-brown">
                            ₹{item.priceInr}
                          </span>
                        </div>
                        <p className="text-[11px] uppercase tracking-wider text-coffee-muted">
                          {item.categoryName} · {item.isVegetarian ? 'Veg' : 'Non-Veg'}
                        </p>
                        <p className="mt-1 text-xs text-coffee-muted line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-beige-border pt-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleAvailability(item)}
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          item.isAvailable
                            ? 'bg-sky-blue-soft text-sky-blue-deep'
                            : 'bg-beige text-coffee-muted'
                        }`}
                      >
                        {item.isAvailable ? 'Available' : 'Sold Out'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditMenu(item)}
                          aria-label={`Edit ${item.name}`}
                          className="rounded-full border border-beige-border p-2 text-coffee hover:border-cognac hover:text-cognac"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteMenu(item)}
                          aria-label={`Delete ${item.name}`}
                          className="rounded-full border border-beige-border p-2 text-coffee hover:border-cognac hover:text-cognac"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESERVATIONS MANAGEMENT */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 rounded-3xl border border-beige-border bg-ivory p-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee-soft" />
                <input
                  type="search"
                  value={resSearch}
                  onChange={(e) => setResSearch(e.target.value)}
                  placeholder="Search guest name, email, or booking code..."
                  className="w-full rounded-full border border-beige-border bg-cream py-2 pl-10 pr-4 text-xs text-dark-brown"
                />
              </div>
              <input
                type="date"
                value={resDateFilter}
                onChange={(e) => setResDateFilter(e.target.value)}
                className="rounded-full border border-beige-border bg-cream px-4 py-2 text-xs text-dark-brown"
              />
              <select
                value={resStatusFilter}
                onChange={(e) => setResStatusFilter(e.target.value)}
                className="rounded-full border border-beige-border bg-cream px-4 py-2 text-xs text-dark-brown"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
              <button
                type="button"
                onClick={() => void loadTabData('reservations')}
                className="rounded-full bg-dark-brown px-5 py-2 text-xs font-semibold text-cream"
              >
                Apply Filter
              </button>
            </div>

            <div className="space-y-3">
              {reservations.length === 0 ? (
                <div className="rounded-3xl border border-beige-border bg-ivory p-10 text-center text-sm text-coffee-muted">
                  No reservations match your filter criteria.
                </div>
              ) : (
                reservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex flex-col gap-4 rounded-3xl border border-beige-border bg-ivory p-5 lg:flex-row lg:items-center lg:justify-between shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-cognac">
                          {res.bookingCode}
                        </span>
                        <span className="font-semibold text-dark-brown">{res.customerName}</span>
                        <span className="rounded-full bg-beige px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coffee">
                          {res.status}
                        </span>
                      </div>
                      <p className="text-xs text-coffee-muted">
                        {formatIstDateDisplay(res.reservationDate)} at {res.reservationTime} IST ·{' '}
                        {res.guestCount} guests · {res.customerEmail} · {res.customerPhone}
                      </p>
                      {res.specialRequests && (
                        <p className="text-xs italic text-coffee">
                          Note: &ldquo;{res.specialRequests}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {res.status !== 'CONFIRMED' && res.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateReservation(res.id, 'CONFIRMED')}
                          className="inline-flex items-center gap-1 rounded-full bg-sky-blue-soft px-3.5 py-1.5 text-xs font-semibold text-sky-blue-deep hover:opacity-90"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      {res.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateReservation(res.id, 'REJECTED')}
                          className="inline-flex items-center gap-1 rounded-full bg-beige px-3.5 py-1.5 text-xs font-semibold text-coffee hover:bg-cognac-light/40"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                      {res.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateReservation(res.id, 'COMPLETED')}
                          className="rounded-full bg-dark-brown px-3.5 py-1.5 text-xs font-semibold text-cream"
                        >
                          Mark Completed
                        </button>
                      )}
                      {res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateReservation(res.id, 'CANCELLED')}
                          className="rounded-full border border-beige-border px-3.5 py-1.5 text-xs font-semibold text-coffee hover:border-cognac"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="search"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer by name or email..."
                className="flex-1 max-w-md rounded-full border border-beige-border bg-ivory px-4 py-2.5 text-sm text-dark-brown"
              />
              <button
                type="button"
                onClick={() => void loadTabData('customers')}
                className="rounded-full bg-dark-brown px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream"
              >
                Search
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-beige-border bg-ivory">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-beige-border bg-beige-soft text-xs uppercase tracking-wider text-coffee-muted">
                  <tr>
                    <th className="px-6 py-4">Guest</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Bookings</th>
                    <th className="px-6 py-4">Handoffs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-border">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-dark-brown">{c.name}</p>
                        <p className="text-xs text-coffee-muted">{c.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{c.phone ?? '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{c.role}</td>
                      <td className="px-6 py-4 font-mono text-xs">{c._count.reservations}</td>
                      <td className="px-6 py-4 font-mono text-xs">{c._count.orderHandoffs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && settings && (
          <form
            onSubmit={handleSaveSettings}
            className="rounded-3xl border border-beige-border bg-ivory p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Notification Recipients (Comma-separated emails for Reservation &amp; Enquiry Alerts)
                </label>
                <input
                  type="text"
                  value={notifEmailsInput}
                  onChange={(e) => setNotifEmailsInput(e.target.value)}
                  placeholder="owner@ruchiloka.com, manager@ruchiloka.com"
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Café Phone
                </label>
                <input
                  type="text"
                  value={settings.cafePhone}
                  onChange={(e) => setSettings({ ...settings, cafePhone: e.target.value })}
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Slot Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  value={settings.reservationSlotMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, reservationSlotMinutes: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Max Guests per Slot
                </label>
                <input
                  type="number"
                  value={settings.maxGuestsPerSlot}
                  onChange={(e) =>
                    setSettings({ ...settings, maxGuestsPerSlot: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Max Bookings / Tables per Slot
                </label>
                <input
                  type="number"
                  value={settings.maxTablesPerSlot}
                  onChange={(e) =>
                    setSettings({ ...settings, maxTablesPerSlot: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="auto-confirm-toggle"
                  type="checkbox"
                  checked={settings.autoConfirmReservations}
                  onChange={(e) =>
                    setSettings({ ...settings, autoConfirmReservations: e.target.checked })
                  }
                  className="h-4 w-4 accent-cognac"
                />
                <label htmlFor="auto-confirm-toggle" className="text-sm font-medium text-dark-brown">
                  Auto-confirm new reservations when capacity is available (otherwise set status to
                  PENDING for manual approval)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Swiggy Restaurant ID
                </label>
                <input
                  type="text"
                  value={settings.swiggyRestaurantId ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, swiggyRestaurantId: e.target.value || null })
                  }
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Swiggy Verified Listing URL
                </label>
                <input
                  type="url"
                  value={settings.swiggyListingUrl ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, swiggyListingUrl: e.target.value || null })
                  }
                  placeholder="https://www.swiggy.com/restaurants/..."
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Zomato Restaurant ID
                </label>
                <input
                  type="text"
                  value={settings.zomatoRestaurantId ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, zomatoRestaurantId: e.target.value || null })
                  }
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Zomato Verified Listing URL
                </label>
                <input
                  type="url"
                  value={settings.zomatoListingUrl ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, zomatoListingUrl: e.target.value || null })
                  }
                  placeholder="https://www.zomato.com/hyderabad/..."
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, instagramUrl: e.target.value || null })
                  }
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, facebookUrl: e.target.value || null })
                  }
                  className="w-full rounded-2xl border border-beige-border bg-cream px-4 py-3 text-sm text-dark-brown"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-beige-border bg-beige-soft p-4 text-xs text-coffee space-y-1">
              <p>
                Swiggy API Handoff Flag:{' '}
                <strong className="font-mono">
                  {settings.swiggyApiHandoffEnabled ? 'ENABLED' : 'DISABLED (Verified Listing Fallback)'}
                </strong>
              </p>
              <p>
                Zomato API Handoff Flag:{' '}
                <strong className="font-mono">
                  {settings.zomatoApiHandoffEnabled ? 'ENABLED' : 'DISABLED (Verified Listing Fallback)'}
                </strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="rounded-full bg-dark-brown px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors disabled:opacity-60"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </form>
        )}

        {/* REVIEWS MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-beige-border bg-ivory p-5">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                  Pending: {reviewCounts.pendingCount}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                  Approved: {reviewCounts.approvedCount}
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
                  Rejected: {reviewCounts.rejectedCount}
                </span>
                <span className="text-coffee-muted">Total: {reviewCounts.totalCount}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((statusOpt) => (
                  <button
                    key={statusOpt}
                    type="button"
                    onClick={() => setReviewStatusFilter(statusOpt)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      reviewStatusFilter === statusOpt
                        ? 'bg-dark-brown text-cream'
                        : 'border border-beige-border bg-cream text-coffee hover:border-cognac'
                    }`}
                  >
                    {statusOpt}
                  </button>
                ))}
              </div>
            </div>

            {reviewsList.length === 0 ? (
              <div className="rounded-3xl border border-beige-border bg-ivory p-10 text-center text-sm text-coffee-muted">
                No guest reviews matching this moderation filter yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviewsList.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-3xl border border-beige-border bg-ivory p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-xl font-semibold text-dark-brown">
                            {review.customerName}
                          </h3>
                          <span className="inline-flex items-center gap-0.5 text-cognac">
                            {Array.from({ length: review.rating }).map((_, idx) => (
                              <Star key={idx} className="h-3.5 w-3.5 fill-cognac text-cognac" />
                            ))}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                              review.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : review.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {review.status}
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-coffee-muted">
                          Submitted {new Date(review.createdAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {review.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => void handleModerateReview(review.id, 'APPROVED')}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                        )}
                        {review.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => void handleModerateReview(review.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDeleteReview(review.id)}
                          aria-label={`Delete review by ${review.customerName}`}
                          className="rounded-full border border-beige-border p-1.5 text-coffee-muted hover:border-red-300 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {review.title && (
                      <p className="font-semibold text-dark-brown">{review.title}</p>
                    )}
                    <p className="text-sm leading-relaxed text-dark-brown/90">{review.message}</p>

                    {review.photoUrl && (
                      <div className="w-40 overflow-hidden rounded-xl border border-beige-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={review.photoUrl}
                          alt={`Guest upload by ${review.customerName}`}
                          className="h-28 w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-coffee-muted">
                        Admin Moderation Note / Reply (Optional)
                      </label>
                      <input
                        type="text"
                        value={reviewNotes[review.id] ?? review.adminNote ?? ''}
                        onChange={(e) =>
                          setReviewNotes((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        placeholder="Optional internal note or published owner reply..."
                        className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GALLERY MANAGER */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <form
              onSubmit={handleCreateGalleryPhoto}
              className="rounded-3xl border border-beige-border bg-ivory p-6 sm:p-8 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                  Add Authentic Ruchiloka Photograph
                </h2>
                <span className="text-xs text-coffee-muted">
                  Only verified Google Maps, Instagram, or owner-approved café images
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Title
                  </label>
                  <input
                    required
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    placeholder="e.g., Sunset Filter Coffee"
                    className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Category
                  </label>
                  <select
                    value={galleryCategory}
                    onChange={(e) => setGalleryCategory(e.target.value as GalleryCategorySlug)}
                    className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                  >
                    {(Object.keys(GALLERY_CATEGORY_LABELS) as GalleryCategorySlug[]).map((slug) => (
                      <option key={slug} value={slug}>
                        {GALLERY_CATEGORY_LABELS[slug]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Source Platform
                  </label>
                  <select
                    value={galleryPlatform}
                    onChange={(e) => setGalleryPlatform(e.target.value as GallerySourcePlatform)}
                    className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                  >
                    <option value="OWNER_UPLOAD">Owner Upload</option>
                    <option value="INSTAGRAM">Instagram (@ruchilokacafe.in)</option>
                    <option value="GOOGLE_MAPS">Google Maps Listing</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Image Path or Upload File
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      required
                      value={galleryImageUrl}
                      onChange={(e) => setGalleryImageUrl(e.target.value)}
                      placeholder="/images/ambience/... or upload ->"
                      className="flex-1 rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-beige-dark bg-cream px-3.5 py-2 text-xs font-semibold hover:border-cognac">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingGalleryImg ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => void handleGalleryImageUpload(e)}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Source Post / Listing URL
                  </label>
                  <input
                    value={gallerySourceUrl}
                    onChange={(e) => setGallerySourceUrl(e.target.value)}
                    placeholder="https://www.instagram.com/ruchilokacafe.in/..."
                    className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Caption
                  </label>
                  <input
                    required
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                    placeholder="Warm courtyard evenings..."
                    className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Accessible Alt Text
                  </label>
                  <input
                    required
                    value={galleryAlt}
                    onChange={(e) => setGalleryAlt(e.target.value)}
                    placeholder="Describe photo for screen readers"
                    className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-coffee-muted">
                    Credit / Attribution
                  </label>
                  <input
                    required
                    value={galleryAttribution}
                    onChange={(e) => setGalleryAttribution(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-beige-border bg-cream px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-5 text-xs text-dark-brown">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={galleryFeaturedOnHome}
                      onChange={(e) => setGalleryFeaturedOnHome(e.target.checked)}
                    />
                    Feature on homepage strip
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={galleryCustomerPermitted}
                      onChange={(e) => setGalleryCustomerPermitted(e.target.checked)}
                    />
                    Permission / Public Source Verified
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingGalleryPhoto}
                  className="inline-flex items-center gap-2 rounded-full bg-dark-brown px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac transition-colors disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {savingGalleryPhoto ? 'Adding Photo...' : 'Add to Gallery'}
                </button>
              </div>
            </form>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryList.map((photo) => (
                <div
                  key={photo.id}
                  className="flex flex-col justify-between overflow-hidden rounded-3xl border border-beige-border bg-ivory p-4 shadow-sm space-y-3"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-beige">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.imageUrl}
                        alt={photo.altText}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-dark-brown/80 px-2.5 py-0.5 text-[10px] font-medium text-cream">
                        {GALLERY_CATEGORY_LABELS[photo.categorySlug] ?? photo.categorySlug}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-dark-brown">
                        {photo.title}
                      </h3>
                      <p className="text-xs text-coffee-muted line-clamp-2">{photo.caption}</p>
                      <p className="mt-1 font-mono text-[11px] text-coffee-muted">
                        {photo.sourcePlatform} · {photo.attribution}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-beige-border pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleToggleGalleryFlag(photo, 'isPublished')}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          photo.isPublished
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-beige text-coffee-muted'
                        }`}
                      >
                        {photo.isPublished ? 'Published' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleGalleryFlag(photo, 'isFeaturedOnHome')}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          photo.isFeaturedOnHome
                            ? 'bg-cognac text-white'
                            : 'border border-beige-border text-coffee-muted'
                        }`}
                      >
                        {photo.isFeaturedOnHome ? 'Home Featured' : 'Feature'}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={photo.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open source for ${photo.title}`}
                        className="rounded-full border border-beige-border p-1.5 text-coffee hover:border-cognac"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleDeleteGalleryPhoto(photo.id)}
                        aria-label={`Remove ${photo.title}`}
                        className="rounded-full border border-beige-border p-1.5 text-coffee-muted hover:border-red-300 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="overflow-x-auto rounded-3xl border border-beige-border bg-ivory">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-beige-border bg-beige-soft uppercase tracking-wider text-coffee-muted">
                <tr>
                  <th className="px-5 py-3.5">Timestamp (IST)</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-border">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-5 py-3.5 font-mono text-coffee-muted">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-dark-brown">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)})` : ''}
                    </td>
                    <td className="px-5 py-3.5">{log.actorEmail ?? 'system'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Menu Editor Modal */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-beige-border bg-cream p-6 sm:p-8 shadow-modal space-y-5">
            <div className="flex items-center justify-between border-b border-beige-border pb-4">
              <h2 className="font-serif text-2xl font-semibold text-dark-brown">
                {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-full p-2 text-coffee hover:bg-beige"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
                    Category
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-beige-border bg-ivory px-3 py-2.5 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full rounded-xl border border-beige-border bg-ivory px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-beige-border bg-ivory px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-xl border border-beige-border bg-ivory px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee">
                  Photograph URL or Upload
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    required
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 min-w-[200px] rounded-xl border border-beige-border bg-ivory px-3 py-2 text-sm"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-beige-border bg-ivory px-4 py-2 text-xs font-semibold text-coffee hover:border-cognac">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImg ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full rounded-xl border border-beige-border bg-ivory px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-full rounded-xl border border-beige-border bg-ivory px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-1 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formVeg}
                    onChange={(e) => setFormVeg(e.target.checked)}
                    className="accent-cognac"
                  />
                  Vegetarian
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="accent-cognac"
                  />
                  Available
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="accent-cognac"
                  />
                  Featured on Homepage
                </label>
              </div>

              {/* Variants Builder */}
              <div className="border-t border-beige-border pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-coffee">
                    Variants (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormVariants((v) => [...v, { name: '', priceDeltaInr: 0, isAvailable: true }])
                    }
                    className="text-xs font-semibold text-cognac underline"
                  >
                    + Add Variant
                  </button>
                </div>
                {formVariants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Large / Ghee Roast"
                      value={v.name}
                      onChange={(e) =>
                        setFormVariants((prev) =>
                          prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row))
                        )
                      }
                      className="flex-1 rounded-xl border border-beige-border bg-ivory px-3 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="+₹"
                      value={v.priceDeltaInr}
                      onChange={(e) =>
                        setFormVariants((prev) =>
                          prev.map((row, idx) =>
                            idx === i ? { ...row, priceDeltaInr: Number(e.target.value) } : row
                          )
                        )
                      }
                      className="w-24 rounded-xl border border-beige-border bg-ivory px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFormVariants((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs text-coffee-muted hover:text-cognac px-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Addons Builder */}
              <div className="border-t border-beige-border pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-coffee">
                    Add-ons (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormAddons((a) => [...a, { name: '', priceInr: 20, isAvailable: true }])
                    }
                    className="text-xs font-semibold text-cognac underline"
                  >
                    + Add Add-on
                  </button>
                </div>
                {formAddons.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Extra Chutney / Espresso Shot"
                      value={a.name}
                      onChange={(e) =>
                        setFormAddons((prev) =>
                          prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row))
                        )
                      }
                      className="flex-1 rounded-xl border border-beige-border bg-ivory px-3 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="₹"
                      value={a.priceInr}
                      onChange={(e) =>
                        setFormAddons((prev) =>
                          prev.map((row, idx) =>
                            idx === i ? { ...row, priceInr: Number(e.target.value) } : row
                          )
                        )
                      }
                      className="w-24 rounded-xl border border-beige-border bg-ivory px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFormAddons((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs text-coffee-muted hover:text-cognac px-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-beige-border">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-full border border-beige-border px-5 py-2.5 text-xs font-semibold text-coffee"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMenu}
                  className="rounded-full bg-dark-brown px-7 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-cognac disabled:opacity-60"
                >
                  {savingMenu ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransitionWrapper>
  );
}
