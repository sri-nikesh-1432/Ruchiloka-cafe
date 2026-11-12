export type ServiceKey = 'tiffins' | 'beverages' | 'continental_snacks';
export type MenuCategorySlug = 'tiffins' | 'beverages' | 'continental' | 'snacks';

export interface OperatingWindow {
  key: ServiceKey;
  label: string;
  startTime24: string; // HH:mm in IST
  endTime24: string;   // HH:mm in IST
  displayHours: string;
  description: string;
}

export const BUSINESS_INFO = {
  name: 'Ruchiloka Café',
  shortName: 'Ruchiloka',
  tagline: 'Every Cup. Every Bite. A Little More Special.',
  supportingCopy:
    'Discover delightful tiffins, freshly brewed coffee and comforting flavours at Ruchiloka Café.',
  address: {
    line1: '174, Road Number 25',
    line2: 'Vivekananda Nagar, Kukatpally',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500072',
    country: 'India',
    full: '174, Road Number 25, Vivekananda Nagar, Kukatpally, Hyderabad, Telangana 500072, India.',
  },
  phone: '+91 91216 78449',
  phoneHref: 'tel:+919121678449',
  timezone: 'Asia/Kolkata',
  timezoneLabel: 'IST',
  coordinates: {
    lat: 17.4948,
    lng: 78.3996,
  },
  googleMapsDirectionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=174%2C+Road+Number+25%2C+Vivekananda+Nagar%2C+Kukatpally%2C+Hyderabad%2C+Telangana+500072%2C+India',
  googleMapsEmbedUrl:
    'https://www.google.com/maps?q=174,+Road+Number+25,+Vivekananda+Nagar,+Kukatpally,+Hyderabad,+Telangana+500072,+India&output=embed',
} as const;

export const DEFAULT_OPERATING_WINDOWS: OperatingWindow[] = [
  {
    key: 'tiffins',
    label: 'Tiffins',
    startTime24: '06:30',
    endTime24: '11:30',
    displayHours: '6:30 AM – 11:30 AM',
    description: 'Traditional South Indian morning breakfast served piping hot.',
  },
  {
    key: 'beverages',
    label: 'Tea and Coffee',
    startTime24: '06:30',
    endTime24: '23:00',
    displayHours: '6:30 AM – 11:00 PM',
    description: 'Freshly brewed filter coffee, espresso classics, and aromatic chai all day.',
  },
  {
    key: 'continental_snacks',
    label: 'Continental and Snacks',
    startTime24: '15:00',
    endTime24: '23:00',
    displayHours: '3:00 PM – 11:00 PM',
    description: 'Warm sandwiches, pastas, flaky bakes, and evening café bites.',
  },
];

export interface CategoryRouteMeta {
  slug: MenuCategorySlug;
  name: string;
  route: string;
  serviceKey: ServiceKey;
  hoursDisplay: string;
  subtitle: string;
}

export const MENU_CATEGORY_META: Record<MenuCategorySlug, CategoryRouteMeta> = {
  tiffins: {
    slug: 'tiffins',
    name: 'Tiffins',
    route: '/menu/tiffins',
    serviceKey: 'tiffins',
    hoursDisplay: '6:30 AM – 11:30 AM IST',
    subtitle: 'Crisp dosas, steamed idlis, and morning chutneys crafted fresh from dawn.',
  },
  beverages: {
    slug: 'beverages',
    name: 'Tea and Coffee',
    route: '/menu/beverages',
    serviceKey: 'beverages',
    hoursDisplay: '6:30 AM – 11:00 PM IST',
    subtitle: 'Single-origin filter brews, handcrafted cappuccinos, and comforting masala chai.',
  },
  continental: {
    slug: 'continental',
    name: 'Continental',
    route: '/menu/continental',
    serviceKey: 'continental_snacks',
    hoursDisplay: '3:00 PM – 11:00 PM IST',
    subtitle: 'Artisanal sandwiches, creamy pastas, and baked café plates for relaxed afternoons.',
  },
  snacks: {
    slug: 'snacks',
    name: 'Snacks',
    route: '/menu/snacks',
    serviceKey: 'continental_snacks',
    hoursDisplay: '3:00 PM – 11:00 PM IST',
    subtitle: 'Crisp savouries, flaky croissants, and evening bites made to pair with your cup.',
  },
};
