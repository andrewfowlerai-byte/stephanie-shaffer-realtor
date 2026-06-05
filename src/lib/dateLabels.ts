/**
 * Centralized "what day is it" helpers. Pinned to Andrew's actual timezone
 * (America/New_York) so the displayed/spoken date is always correct even if
 * a browser misreports its timezone as UTC (which we've seen happen due to
 * browser fingerprinting settings).
 *
 * If we add staff in other timezones later, swap the constant for a value
 * read from staff.timezone or the user's profile.
 */

const TZ = 'America/New_York';

export function localDateString(now: Date = new Date()): string {
  // sv-SE locale formats as YYYY-MM-DD, conveniently matching the database
  // date format with no extra parsing.
  return now.toLocaleDateString('sv-SE', { timeZone: TZ });
}

export function localDateLabel(now: Date = new Date()): string {
  // "Tuesday, June 2"
  return now.toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function localDateLabelWithSuffix(now: Date = new Date()): string {
  // "Tuesday, June 2nd"
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const dayNum = Number(day);
  const suffix = ordinalSuffix(dayNum);
  return `${weekday}, ${month} ${dayNum}${suffix}`;
}

export function localHour(now: Date = new Date()): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    hour12: false,
  }).format(now);
  const parsed = parseInt(hourStr, 10);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 23) return parsed;
  // Some locales return "24" for midnight; normalize.
  if (parsed === 24) return 0;
  return 0;
}

export function localMinute(now: Date = new Date()): number {
  const minuteStr = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    minute: 'numeric',
    hour12: false,
  }).format(now);
  const parsed = parseInt(minuteStr, 10);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 59 ? parsed : 0;
}

/** Current local time in ET as "HH:MM" (24-hour). Used to feed the AI an
 *  accurate "right now" so it can pick past/future tense per event. */
export function localTimeString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  let hh = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '00';
  if (hh === '24') hh = '00'; // some locales emit 24:00 at midnight
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
