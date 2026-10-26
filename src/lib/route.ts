// שלד המסלול כפי שמופיע באירועים הירוקים ביומן (צילומי המסך), והפיליפינים לפי הטיסות שהוזמנו.
// כל יעד מחזיק גם מיקום על המפה ואיך מגיעים אליו מהיעד הקודם.

import { Lodging } from '../types/trip';

export type Country = 'vn' | 'ph';

export interface RouteStop {
  id: string;
  name: string;
  country: Country;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD (inclusive)
  lastNight?: string; // ברירת מחדל end. מנילה למשל: ביום האחרון טסים בלילה ואין לינה
  emoji: string;
  tentative?: boolean;
  lat: number;
  lng: number;
  arriveBy: 'land' | 'flight';
}

export const routeStops: RouteStop[] = [
  { id: 'sapa', name: 'סאפה', country: 'vn', start: '2026-11-18', end: '2026-11-21', emoji: '🌾', lat: 22.3364, lng: 103.8438, arriveBy: 'land' },
  { id: 'hagiang', name: 'הא ג׳יאנג לופ', country: 'vn', start: '2026-11-22', end: '2026-11-24', lastNight: '2026-11-23', emoji: '🏍️', lat: 23.12, lng: 105.15, arriveBy: 'land' },
  { id: 'hanoi-transit', name: 'האנוי (לילה בדרך)', country: 'vn', start: '2026-11-24', end: '2026-11-24', emoji: '🚌', lat: 21.0285, lng: 105.8542, arriveBy: 'land' },
  { id: 'maichau', name: 'מאי צ׳או', country: 'vn', start: '2026-11-25', end: '2026-11-26', emoji: '🚲', lat: 20.661, lng: 105.069, arriveBy: 'land' },
  { id: 'hanoi', name: 'האנוי', country: 'vn', start: '2026-11-27', end: '2026-11-28', emoji: '🏮', lat: 21.0285, lng: 105.8542, arriveBy: 'land' },
  { id: 'caobang', name: 'קאו בנג לופ', country: 'vn', start: '2026-11-29', end: '2026-11-30', emoji: '💧', lat: 22.85, lng: 106.72, arriveBy: 'land' },
  { id: 'halong', name: 'האלונג ביי', country: 'vn', start: '2026-12-01', end: '2026-12-02', emoji: '⛵', lat: 20.91, lng: 107.18, arriveBy: 'land' },
  { id: 'tamcoc', name: 'טאם קוק', country: 'vn', start: '2026-12-03', end: '2026-12-06', emoji: '🛶', lat: 20.215, lng: 105.938, arriveBy: 'land' },
  { id: 'phongnha', name: 'פונג נה', country: 'vn', start: '2026-12-07', end: '2026-12-09', emoji: '🦇', lat: 17.59, lng: 106.283, arriveBy: 'land' },
  { id: 'hoian', name: 'הויאן + הואה/דה נאנג', country: 'vn', start: '2026-12-10', end: '2026-12-19', emoji: '🏮', lat: 15.8801, lng: 108.338, arriveBy: 'land' },
  { id: 'siargao', name: 'סיארגאו', country: 'ph', start: '2026-12-21', end: '2026-12-28', emoji: '🏄', lat: 9.7889, lng: 126.162, arriveBy: 'flight' },
  { id: 'bohol', name: 'בוהול (דרך סבו)', country: 'ph', start: '2026-12-29', end: '2027-01-02', emoji: '🐒', lat: 9.65, lng: 123.85, arriveBy: 'flight', tentative: true },
  { id: 'camiguin', name: 'קמיגין', country: 'ph', start: '2027-01-03', end: '2027-01-06', emoji: '🌋', lat: 9.25, lng: 124.717, arriveBy: 'flight' },
  { id: 'cebu', name: 'סבו (לילה בדרך)', country: 'ph', start: '2027-01-07', end: '2027-01-07', emoji: '🛬', lat: 10.3157, lng: 123.8854, arriveBy: 'flight' },
  { id: 'elnido', name: 'אל נידו', country: 'ph', start: '2027-01-08', end: '2027-01-13', emoji: '🏝️', lat: 11.1784, lng: 119.393, arriveBy: 'flight' },
  { id: 'manila', name: 'מנילה', country: 'ph', start: '2027-01-14', end: '2027-01-16', lastNight: '2027-01-15', emoji: '🌆', lat: 14.5995, lng: 120.9842, arriveBy: 'flight' },
];

export const stopById = (id?: string): RouteStop | undefined => routeStops.find((s) => s.id === id);

export function stopForDate(date: string): RouteStop | undefined {
  return routeStops.find((s) => date >= s.start && date <= s.end);
}

export const countryStyle: Record<Country, { label: string; flag: string; chip: string; dot: string }> = {
  vn: { label: 'וייטנאם', flag: '🇻🇳', chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  ph: { label: 'הפיליפינים', flag: '🇵🇭', chip: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
};

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export type LodgingStatus = 'booked' | 'partial' | 'none' | 'notNeeded';

export interface StopLodging {
  status: LodgingStatus;
  lodgings: Lodging[];
  missingNights: string[]; // YYYY-MM-DD של לילות בלי מלון
}

// לילה שייך ללינה אם check-in <= הלילה < check-out
// noHotelStops: destinations the user marked as not needing a hotel (shown as 'notNeeded' unless a hotel is booked anyway)
export function lodgingForStop(stop: RouteStop, lodgings: Lodging[], noHotelStops: string[] = []): StopLodging {
  const lastNight = stop.lastNight ?? stop.end;
  const nights: string[] = [];
  for (let d = stop.start; d <= lastNight; d = addDays(d, 1)) nights.push(d);

  const covered = (night: string) => lodgings.some((l) => l.checkInDate <= night && night < l.checkOutDate);
  const missingNights = nights.filter((n) => !covered(n));
  const used = lodgings.filter((l) => nights.some((n) => l.checkInDate <= n && n < l.checkOutDate));

  if (missingNights.length > 0 && noHotelStops.includes(stop.id)) {
    return { status: 'notNeeded', lodgings: used, missingNights: [] };
  }
  const status: LodgingStatus =
    missingNights.length === 0 ? 'booked' : missingNights.length === nights.length ? 'none' : 'partial';
  return { status, lodgings: used, missingNights };
}

export const formatDM = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${Number(d)}.${Number(m)}`;
};
