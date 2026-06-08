/**
 * timezones.ts
 * Maps destination country → IANA timezone.
 * Computes batch send schedules so emails arrive during buyer's 9AM–3PM window.
 */

// ── Country → Primary IANA timezone ──────────────────────────
export const COUNTRY_TIMEZONES: Record<string, string> = {
  // Middle East
  'UAE':                  'Asia/Dubai',
  'United Arab Emirates': 'Asia/Dubai',
  'Saudi Arabia':         'Asia/Riyadh',
  'Qatar':                'Asia/Qatar',
  'Oman':                 'Asia/Muscat',
  'Kuwait':               'Asia/Kuwait',
  'Bahrain':              'Asia/Bahrain',
  'Jordan':               'Asia/Amman',
  'Lebanon':              'Asia/Beirut',
  'Egypt':                'Africa/Cairo',
  'Iraq':                 'Asia/Baghdad',
  'Israel':               'Asia/Jerusalem',

  // Europe
  'Germany':              'Europe/Berlin',
  'UK':                   'Europe/London',
  'United Kingdom':       'Europe/London',
  'France':               'Europe/Paris',
  'Netherlands':          'Europe/Amsterdam',
  'Italy':                'Europe/Rome',
  'Spain':                'Europe/Madrid',
  'Belgium':              'Europe/Brussels',
  'Switzerland':          'Europe/Zurich',
  'Austria':              'Europe/Vienna',
  'Poland':               'Europe/Warsaw',
  'Sweden':               'Europe/Stockholm',
  'Norway':               'Europe/Oslo',
  'Denmark':              'Europe/Copenhagen',
  'Finland':              'Europe/Helsinki',
  'Portugal':             'Europe/Lisbon',
  'Greece':               'Europe/Athens',
  'Turkey':               'Europe/Istanbul',
  'Russia':               'Europe/Moscow',

  // North America
  'USA':                  'America/New_York',
  'United States':        'America/New_York',
  'Canada':               'America/Toronto',
  'Mexico':               'America/Mexico_City',

  // Asia
  'China':                'Asia/Shanghai',
  'Japan':                'Asia/Tokyo',
  'South Korea':          'Asia/Seoul',
  'Singapore':            'Asia/Singapore',
  'Malaysia':             'Asia/Kuala_Lumpur',
  'Thailand':             'Asia/Bangkok',
  'Vietnam':              'Asia/Ho_Chi_Minh',
  'Indonesia':            'Asia/Jakarta',
  'Philippines':          'Asia/Manila',
  'Hong Kong':            'Asia/Hong_Kong',
  'Taiwan':               'Asia/Taipei',
  'Bangladesh':           'Asia/Dhaka',
  'Sri Lanka':            'Asia/Colombo',
  'Pakistan':             'Asia/Karachi',
  'India':                'Asia/Kolkata',
  'Nepal':                'Asia/Kathmandu',

  // Oceania
  'Australia':            'Australia/Sydney',
  'New Zealand':          'Pacific/Auckland',

  // Africa
  'South Africa':         'Africa/Johannesburg',
  'Kenya':                'Africa/Nairobi',
  'Nigeria':              'Africa/Lagos',
  'Ethiopia':             'Africa/Addis_Ababa',
  'Ghana':                'Africa/Accra',
  'Tanzania':             'Africa/Dar_es_Salaam',

  // Americas
  'Brazil':               'America/Sao_Paulo',
  'Argentina':            'America/Argentina/Buenos_Aires',
  'Colombia':             'America/Bogota',
  'Chile':                'America/Santiago',
  'Peru':                 'America/Lima',
};

/** Fuzzy-match a country string to an IANA timezone */
export function getTimezone(country: string | null | undefined): string {
  if (!country) return 'Asia/Kolkata';
  const normalised = country.trim();
  if (COUNTRY_TIMEZONES[normalised]) return COUNTRY_TIMEZONES[normalised];
  const lower = normalised.toLowerCase();
  for (const [k, v] of Object.entries(COUNTRY_TIMEZONES)) {
    if (k.toLowerCase() === lower) return v;
  }
  for (const [k, v] of Object.entries(COUNTRY_TIMEZONES)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v;
  }
  return 'Asia/Kolkata';
}

/** Get UTC offset in minutes for a timezone at a given date */
export function getUtcOffsetMinutes(tz: string, date: Date): number {
  const utcStr  = date.toLocaleString('en-US', { timeZone: 'UTC', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const destStr = date.toLocaleString('en-US', { timeZone: tz,    hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const toMs = (s: string) => new Date(s).getTime();
  return (toMs(destStr) - toMs(utcStr)) / (60 * 1000);
}

/**
 * Convert a destination local time (hour, minute) to UTC ISO string.
 * Automatically schedules for tomorrow if the slot has already passed today.
 */
export function destLocalToUtc(
  destTz: string,
  destHour: number,
  destMinute: number,
): string {
  const now = new Date();

  // Current time in destination
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: destTz,
    hour: 'numeric', minute: 'numeric', hour12: false,
  });
  const parts      = formatter.formatToParts(now);
  const curHour    = parseInt(parts.find(p => p.type === 'hour')!.value);
  const curMinute  = parseInt(parts.find(p => p.type === 'minute')!.value);
  const curMinutes = curHour * 60 + curMinute;
  const tgtMinutes = destHour * 60 + destMinute;

  // If slot already passed today in dest tz, schedule for tomorrow
  const daysAhead = tgtMinutes <= curMinutes ? 1 : 0;

  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysAhead);

  const dateStr        = targetDate.toLocaleDateString('en-CA', { timeZone: destTz });
  const [year, month, day] = dateStr.split('-').map(Number);
  const offset         = getUtcOffsetMinutes(destTz, targetDate);
  const utcMs          = Date.UTC(year, month - 1, day, destHour, destMinute) - offset * 60 * 1000;

  return new Date(utcMs).toISOString();
}

/**
 * BATCH SCHEDULE BUILDER
 *
 * Given N leads and a destination timezone, splits them into batches of
 * batchSize (15–20) and assigns a send slot in the buyer's 9AM–3PM window.
 *
 * Slots are spaced ~75 minutes apart:
 *   Batch 1 → dest 9:15 AM
 *   Batch 2 → dest 10:30 AM
 *   Batch 3 → dest 11:45 AM
 *   Batch 4 → dest 1:00 PM
 *   Batch 5 → dest 2:15 PM
 *
 * Within each batch, each email gets a random 10–40 second stagger
 * so they don't all hit the server at once.
 *
 * Returns an array of UTC ISO strings, one per lead, in order.
 */
export function buildBatchSchedule(
  totalLeads: number,
  destTz: string,
  batchSize: number = 15,
): string[] {
  if (totalLeads === 0) return [];

  // Batch slot start times in destination local hours (9AM–3PM window)
  // Each slot is 75 minutes apart, starting at 9:15 AM
  const BASE_SLOTS: { hour: number; minute: number }[] = [
    { hour: 9,  minute: 15 },
    { hour: 10, minute: 30 },
    { hour: 11, minute: 45 },
    { hour: 13, minute: 0  },
    { hour: 14, minute: 15 },
    { hour: 15, minute: 0  }, // last slot — still within 3PM cutoff
  ];

  // Split leads into batches
  const batches: number[][] = [];
  let i = 0;
  while (i < totalLeads) {
    // Randomise batch size slightly between batchSize-2 and batchSize+2
    const size = Math.min(
      totalLeads - i,
      batchSize + Math.floor(Math.random() * 5) - 2,
    );
    const batch: number[] = [];
    for (let j = 0; j < size; j++) batch.push(i + j);
    batches.push(batch);
    i += size;
  }

  // If we have more batches than slots, overflow into next day's slots
  const schedule: string[] = new Array(totalLeads);
  let dayOffset = 0;

  batches.forEach((batch, batchIndex) => {
    const slotIndex = batchIndex % BASE_SLOTS.length;
    if (batchIndex > 0 && slotIndex === 0) dayOffset++; // next day

    const slot = BASE_SLOTS[slotIndex];

    // Get base UTC time for this slot
    const baseUtc = destLocalToUtcWithDayOffset(destTz, slot.hour, slot.minute, dayOffset);

    // Assign each lead in batch a slightly staggered time (10–40 seconds apart)
    batch.forEach((leadIndex, posInBatch) => {
      const staggerSeconds = posInBatch * (Math.floor(Math.random() * 30) + 10);
      const sendMs = new Date(baseUtc).getTime() + staggerSeconds * 1000;
      schedule[leadIndex] = new Date(sendMs).toISOString();
    });
  });

  return schedule;
}

/**
 * Like destLocalToUtc but with an explicit dayOffset for multi-day scheduling.
 */
function destLocalToUtcWithDayOffset(
  destTz: string,
  destHour: number,
  destMinute: number,
  extraDays: number,
): string {
  const now = new Date();

  // Current time in destination
  const formatter  = new Intl.DateTimeFormat('en-US', {
    timeZone: destTz,
    hour: 'numeric', minute: 'numeric', hour12: false,
  });
  const parts      = formatter.formatToParts(now);
  const curHour    = parseInt(parts.find(p => p.type === 'hour')!.value);
  const curMinute  = parseInt(parts.find(p => p.type === 'minute')!.value);
  const curMinutes = curHour * 60 + curMinute;
  const tgtMinutes = destHour * 60 + destMinute;

  // If slot already passed today in dest tz, add 1 more day
  const passedToday = tgtMinutes <= curMinutes ? 1 : 0;
  const totalDaysAhead = extraDays + passedToday;

  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + totalDaysAhead);

  const dateStr        = targetDate.toLocaleDateString('en-CA', { timeZone: destTz });
  const [year, month, day] = dateStr.split('-').map(Number);
  const offset         = getUtcOffsetMinutes(destTz, targetDate);
  const utcMs          = Date.UTC(year, month - 1, day, destHour, destMinute) - offset * 60 * 1000;

  return new Date(utcMs).toISOString();
}

/** Human-readable send time in IST */
export function formatSendTimeIST(isoUtc: string): string {
  return new Date(isoUtc).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  });
}

/** Format ISO in any timezone */
export function formatInTz(isoUtc: string, tz: string): string {
  return new Date(isoUtc).toLocaleString('en-US', {
    timeZone: tz,
    day:      '2-digit',
    month:    'short',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  });
}

/** All countries list for destination dropdown */
export const ALL_COUNTRIES = Object.keys(COUNTRY_TIMEZONES).sort();