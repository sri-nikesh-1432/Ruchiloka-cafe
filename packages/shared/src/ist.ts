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
  time12: string;
  time12WithSeconds: string;
  minutesSinceMidnight: number;
}

export interface ServiceStatus extends OperatingWindow {
  isOpen: boolean;
  statusText: 'Open Now' | 'Closed Now';
  nextChangeText: string;
}

export interface IstFullTimings {
  ist: IstClockParts;
  dayOfWeek: string;
  dayAndDate: string;
  formattedClock12: string;
  formattedClock24: string;
  isCafeOpen: boolean;
  overallStatus: 'OPEN' | 'CLOSED';
  overallStatusText: 'Open Now' | 'Closed Now';
  statusBadgeText: string;
  activeServiceNames: string[];
  activeServiceSummary: string;
  nextChangeHeadline: string;
  nextChangeSubtext: string;
  services: ServiceStatus[];
  timelineProgressPercent: number;
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
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const time12 = `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
  const time12WithSeconds = `${h12}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${suffix}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateIso,
    time24,
    time12,
    time12WithSeconds,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

export function formatDurationMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`;
  }
  if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  }
  return `${mins} min${mins === 1 ? '' : 's'}`;
}

export function getIstFullTimings(
  date: Date = new Date(),
  windows: OperatingWindow[] = DEFAULT_OPERATING_WINDOWS
): IstFullTimings {
  const ist = getIstClockParts(date);
  const nowMin = ist.minutesSinceMidnight;
  const services = getServiceStatuses(date, windows);
  const activeServices = services.filter((s) => s.isOpen);
  const isCafeOpen = activeServices.length > 0;
  const overallStatus: 'OPEN' | 'CLOSED' = isCafeOpen ? 'OPEN' : 'CLOSED';
  const overallStatusText: 'Open Now' | 'Closed Now' = isCafeOpen ? 'Open Now' : 'Closed Now';

  const dayOfWeek = new Intl.DateTimeFormat('en-IN', {
    timeZone: BUSINESS_INFO.timezone,
    weekday: 'long',
  }).format(date);

  const dayAndDate = new Intl.DateTimeFormat('en-IN', {
    timeZone: BUSINESS_INFO.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const activeServiceNames = activeServices.map((s) => s.label);
  const activeServiceSummary = isCafeOpen
    ? `Serving ${activeServiceNames.join(' & ')}`
    : 'All kitchen & beverage counters currently closed';

  let nextChangeHeadline: string;
  let nextChangeSubtext: string;
  let statusBadgeText: string;

  if (isCafeOpen) {
    statusBadgeText = `OPEN NOW · ${activeServiceNames.join(' & ')}`;
    if (nowMin < 690) {
      const remainingTiffins = 690 - nowMin;
      nextChangeHeadline = `Morning Tiffins service concludes at 11:30 AM IST (${formatDurationMinutes(remainingTiffins)} left)`;
      nextChangeSubtext = 'Tea & Coffee continues all day until 11:00 PM IST';
    } else if (nowMin < 900) {
      const untilContinental = 900 - nowMin;
      nextChangeHeadline = `Continental & Evening Snacks opens at 3:00 PM IST (in ${formatDurationMinutes(untilContinental)})`;
      nextChangeSubtext = 'Freshly brewed Filter Coffee and tea currently being served';
    } else {
      const untilClose = 1380 - nowMin;
      nextChangeHeadline = `Café service closes tonight at 11:00 PM IST (${formatDurationMinutes(untilClose)} left)`;
      nextChangeSubtext = 'Full evening menu, artisanal bakes, and coffee available';
    }
  } else {
    if (nowMin >= 1380) {
      const minsUntilTomorrowMorning = 1440 - nowMin + 390;
      statusBadgeText = 'CLOSED NOW · OPENS 6:30 AM';
      nextChangeHeadline = 'Doors reopen tomorrow morning at 6:30 AM IST';
      nextChangeSubtext = `Opening in ${formatDurationMinutes(minsUntilTomorrowMorning)} with hot Filter Coffee & authentic South Indian Tiffins`;
    } else {
      const minsUntilMorning = 390 - nowMin;
      statusBadgeText = 'CLOSED NOW · OPENS 6:30 AM';
      nextChangeHeadline = 'Doors open this morning at 6:30 AM IST';
      nextChangeSubtext = `Opening in ${formatDurationMinutes(minsUntilMorning)} with hot Filter Coffee & authentic South Indian Tiffins`;
    }
  }

  const timelineMin = 360;
  const timelineMax = 1410;
  const clampedProgressMin = Math.max(timelineMin, Math.min(timelineMax, nowMin));
  const timelineProgressPercent = Math.round(
    ((clampedProgressMin - timelineMin) / (timelineMax - timelineMin)) * 100
  );

  return {
    ist,
    dayOfWeek,
    dayAndDate,
    formattedClock12: `${ist.time12} IST`,
    formattedClock24: `${ist.time24} IST`,
    isCafeOpen,
    overallStatus,
    overallStatusText,
    statusBadgeText,
    activeServiceNames,
    activeServiceSummary,
    nextChangeHeadline,
    nextChangeSubtext,
    services,
    timelineProgressPercent,
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
