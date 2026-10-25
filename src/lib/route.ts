// שלד המסלול כפי שמופיע באירועים הירוקים ביומן (צילומי המסך).
// טווחים שלא הופיעו ביומן (7–12.12, סוף הויאן, הפיליפינים) מסומנים כ"לא מתוכנן עדיין".

export type Country = 'vn' | 'ph';

export interface RouteStop {
  id: string;
  name: string;
  country: Country;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD (inclusive)
  emoji: string;
  tentative?: boolean;
}

export const routeStops: RouteStop[] = [
  { id: 'sapa', name: 'סאפה', country: 'vn', start: '2026-11-18', end: '2026-11-21', emoji: '🌾' },
  { id: 'hagiang', name: 'הא ג׳יאנג לופ', country: 'vn', start: '2026-11-22', end: '2026-11-24', emoji: '🏍️' },
  { id: 'maichau', name: 'מאי צ׳או', country: 'vn', start: '2026-11-25', end: '2026-11-26', emoji: '🚲' },
  { id: 'hanoi', name: 'האנוי', country: 'vn', start: '2026-11-27', end: '2026-11-28', emoji: '🏮' },
  { id: 'caobang', name: 'קאו בנג לופ', country: 'vn', start: '2026-11-29', end: '2026-11-30', emoji: '💧' },
  { id: 'halong', name: 'האלונג ביי', country: 'vn', start: '2026-12-01', end: '2026-12-02', emoji: '⛵' },
  { id: 'tamcoc', name: 'טאם קוק', country: 'vn', start: '2026-12-03', end: '2026-12-06', emoji: '🛶' },
  { id: 'hoian', name: 'הויאן + הואה/דה נאנג', country: 'vn', start: '2026-12-13', end: '2026-12-19', emoji: '🏮' },
  { id: 'philippines', name: 'הפיליפינים', country: 'ph', start: '2026-12-20', end: '2027-01-17', emoji: '🏝️', tentative: true },
];

export function stopForDate(date: string): RouteStop | undefined {
  return routeStops.find((s) => date >= s.start && date <= s.end);
}

export const countryStyle: Record<Country, { label: string; flag: string; chip: string; dot: string }> = {
  vn: { label: 'וייטנאם', flag: '🇻🇳', chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  ph: { label: 'הפיליפינים', flag: '🇵🇭', chip: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
};
