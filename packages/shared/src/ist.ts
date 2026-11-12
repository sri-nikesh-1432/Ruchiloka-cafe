import {
  BUSINESS_INFO,
  DEFAULT_OPERATING_WINDOWS,
  MENU_CATEGORY_META,
  MenuCategorySlug,
  OperatingWindow,
  ServiceKey,
} from './business';

export interface IstClockParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dateIso: string;
  time24: string;
  minutesSinceMidnight: number;
}

export interface ServiceStatus extends OperatingWindow {
  isOpen: boolean;
  statusText: 'Open Now' | 'Closed Now';
  nextChangeText: string;
}

export function parseTime24ToMinutes(time24: string): number {
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid HH:mm time string: "${time24}"`);
  }
  return h * 60 + m;
}

export function formatMinutesTo12Hour(minutes: number): string {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function getIstClockParts(date: Date = new Date()): IstClockParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_INFO.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  const year = Number(lookup.year);
  const month = Number(lookup.month);
  const day = Number(lookup.day);
  const rawHour = Number(lookup.hour);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(lookup.minute);
  const second = Number(lookup.second);

  const dateIso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateIso,
    time24,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

export function getServiceStatuses(
  date: Date = new Date(),
  windows: OperatingWindow[] = DEFAULT_OPERATING_WINDOWS
): ServiceStatus[] {
  const ist = getIstClockParts(date);
  const nowMin = ist.minutesSinceMidnight;

  return windows.map((window) => {
    const startMin = parseTime24ToMinutes(window.startTime24);
    const endMin = parseTime24ToMinutes(window.endTime24);
    const isOpen = nowMin >= startMin && nowMin < endMin;

    let nextChangeText: string;
    if (isOpen) {
      nextChangeText = `Serves until ${formatMinutesTo12Hour(endMin)} IST`;
    } else if (nowMin < startMin) {
      nextChangeText = `Opens today at ${formatMinutesTo12Hour(startMin)} IST`;
    } else {
      nextChangeText = `Opens tomorrow at ${formatMinutesTo12Hour(startMin)} IST`;
    }

    return {
      ...window,
      isOpen,
      statusText: isOpen ? 'Open Now' : 'Closed Now',
      nextChangeText,
    };
  });
}

export function isCafeCurrentlyOpen(
  date: Date = new Date(),
  windows: OperatingWindow[] = DEFAULT_OPERATING_WINDOWS
): boolean {
  return getServiceStatuses(date, windows).some((s) => s.isOpen);
}

export function getCategoryServiceStatus(
  slug: MenuCategorySlug,
  date: Date = new Date(),
  windows: OperatingWindow[] = DEFAULT_OPERATING_WINDOWS
): ServiceStatus {
  const meta = MENU_CATEGORY_META[slug];
  const statuses = getServiceStatuses(date, windows);
  return statuses.find((s) => s.key === meta.serviceKey) ?? statuses[0];
}

export function getServiceKeysForMinutes(
  minutes: number,
  windows: OperatingWindow[] = DEFAULT_OPERATING_WINDOWS
): ServiceKey[] {
  return windows
    .filter((w) => {
      const start = parseTime24ToMinutes(w.startTime24);
      const end = parseTime24ToMinutes(w.endTime24);
      return minutes >= start && minutes < end;
    })
    .map((w) => w.key);
}

export function generateDailyReservationSlots(
  slotDurationMinutes: number = 30,
  windows: OperatingWindow[] = DEFAULT_OPERATING_WINDOWS
): Array<{ time24: string; label12: string; activeServices: ServiceKey[] }> {
  if (windows.length === 0) return [];
  const earliest = Math.min(...windows.map((w) => parseTime24ToMinutes(w.startTime24)));
  const latest = Math.max(...windows.map((w) => parseTime24ToMinutes(w.endTime24)));

  const slots: Array<{ time24: string; label12: string; activeServices: ServiceKey[] }> = [];
  for (let min = earliest; min < latest; min += slotDurationMinutes) {
    const activeServices = getServiceKeysForMinutes(min, windows);
    if (activeServices.length === 0) continue;
    const h = Math.floor(min / 60);
    const m = min % 60;
    const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push({
      time24,
      label12: formatMinutesTo12Hour(min),
      activeServices,
    });
  }
  return slots;
}

export function formatIstDateDisplay(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  if (!y || !m || !d) return dateIso;
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: BUSINESS_INFO.timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(utcDate);
}
