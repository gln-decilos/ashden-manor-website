// Ashden Manor price list, exactly as supplied by the venue (stage two brief).
// No rounding, averaging or extras. This file has no DOM code so it can be
// tested on its own: `node scripts/check-pricing.mjs`.

export type MonthKey =
  | 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun'
  | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
export type DayKey = 'weekday' | 'frisun' | 'saturday';
export type BandKey = 'winter' | 'shoulder' | 'summer';

// Exclusive use, full day.
export const RATES: Record<BandKey, Record<DayKey, number>> = {
  winter: { weekday: 4500, frisun: 6000, saturday: 8000 }, // Nov to Mar
  shoulder: { weekday: 5500, frisun: 7500, saturday: 10000 }, // Apr, May, Oct
  summer: { weekday: 6500, frisun: 9000, saturday: 12000 }, // Jun to Sep
};

export const MONTH_BAND: Record<MonthKey, BandKey> = {
  nov: 'winter', dec: 'winter', jan: 'winter', feb: 'winter', mar: 'winter',
  apr: 'shoulder', may: 'shoulder', oct: 'shoulder',
  jun: 'summer', jul: 'summer', aug: 'summer', sep: 'summer',
};

export const BAND_LABEL: Record<BandKey, string> = {
  winter: 'November to March',
  shoulder: 'April, May and October',
  summer: 'June to September',
};

export const MONTH_NAME: Record<MonthKey, string> = {
  jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June',
  jul: 'July', aug: 'August', sep: 'September', oct: 'October', nov: 'November', dec: 'December',
};

export const DAY_NAME: Record<DayKey, string> = {
  weekday: 'Monday to Thursday',
  frisun: 'Friday or Sunday',
  saturday: 'Saturday',
};

export const INCLUDED_DAY_GUESTS = 50;
export const MAX_DAY_GUESTS = 100;
export const MAX_EVENING_GUESTS = 100;
export const EXTRA_DAY_GUEST = 95;
export const EVENING_GUEST = 45;
export const GARDEN_CEREMONY = 750;
export const DRESSING_ROOM = 400;

export interface EstimateInput {
  month: MonthKey;
  day: DayKey;
  dayGuests: number;
  eveningGuests: number;
  garden: boolean;
  dressing: boolean;
}

export interface Estimate {
  band: BandKey;
  venue: number;
  dayGuests: number;
  additionalDayGuests: number;
  additionalDayCost: number;
  eveningGuests: number;
  eveningCost: number;
  gardenCost: number;
  dressingCost: number;
  total: number;
}

/** Whole number inside [min, max]. Anything that isn't a number becomes min. */
export function clampWhole(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function calculateEstimate(input: EstimateInput): Estimate {
  const band = MONTH_BAND[input.month];
  const venue = RATES[band][input.day];
  const dayGuests = clampWhole(input.dayGuests, 1, MAX_DAY_GUESTS);
  const eveningGuests = clampWhole(input.eveningGuests, 0, MAX_EVENING_GUESTS);
  const additionalDayGuests = Math.max(0, dayGuests - INCLUDED_DAY_GUESTS);
  const additionalDayCost = additionalDayGuests * EXTRA_DAY_GUEST;
  const eveningCost = eveningGuests * EVENING_GUEST;
  const gardenCost = input.garden ? GARDEN_CEREMONY : 0;
  const dressingCost = input.dressing ? DRESSING_ROOM : 0;
  const total = venue + additionalDayCost + eveningCost + gardenCost + dressingCost;
  return {
    band, venue, dayGuests, additionalDayGuests, additionalDayCost,
    eveningGuests, eveningCost, gardenCost, dressingCost, total,
  };
}

export const money = (amount: number): string => `£${amount.toLocaleString('en-GB')}`;
