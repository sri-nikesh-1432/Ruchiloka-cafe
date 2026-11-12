'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardList,
  Edit3,
  Loader2,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';
import {
  formatIstDateDisplay,
  type AdminSettingsDto,
  type MenuCategoryDto,
  type MenuItemDto,
  type ReservationDto,
  type ReservationStatus,
} from '@ruchiloka/shared';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api/endpoints';
import { PageTransitionWrapper } from '@/components/motion/MotionPrimitives';

type AdminTab = 'overview' | 'menu' | 'reservations' | 'customers' | 'settings' | 'audit';

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
  }, [resDateFilter, resStatusFilter, resSearch, customerSearch, pushToast]);

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
