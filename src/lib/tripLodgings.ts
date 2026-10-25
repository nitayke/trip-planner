import { Lodging } from '../types/trip';

const TRIP_ID = 'trip-vietnam-philippines-2026';

// קישור לחיפוש המלון ב-Booking.com עם התאריכים של ההזמנה
export const bookingLink = (query: string, checkIn: string, checkOut: string) =>
  `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=2&no_rooms=1&lang=he`;

type Seed = Omit<Lodging, 'tripId' | 'bookingUrl'> & {
  searchQuery: string;
  coords: [number, number];
  // הלילה האחרון עם ביטול חינם (לפי מייל האישור). בלי ערך = ביטול חינם עד יום הכניסה.
  freeCancelUntil?: string;
};

// ההזמנות נלקחו ממיילי האישור של Booking.com (תווית "מלונות" בג׳ימייל).
// המחירים בש״ח הם הערכה לפי שער חליפין, המחיר המקורי מופיע בהערות.
const seeds: Seed[] = [
  {
    id: 'lodging-booking-sapa-a25',
    name: 'A25 Premium Hotel - 29 Thác Bạc - Sapa',
    searchQuery: 'A25 Premium Hotel 29 Thac Bac Sapa',
    coords: [22.3345, 103.843],
    type: 'hotel',
    address: '29 Bis Thac Bac, Sapa, Vietnam',
    checkInDate: '2026-11-17',
    checkOutDate: '2026-11-22',
    confirmationCode: '5520449301',
    price: 1400,
    contactPhone: '+84 96 372 50 83',
    notes: 'סוויטת אקזקיוטיב, ארוחת בוקר כלולה. 9,792,900 VND, תשלום במלון. ביטול חינם עד 9.11.2026.',
    freeCancelUntil: '2026-11-09',
  },
  {
    id: 'lodging-booking-maichau',
    name: 'Little Mai Chau Home Stay',
    searchQuery: 'Little Mai Chau Home Stay',
    coords: [20.669, 105.058],
    type: 'other',
    address: 'Xóm Nà Phòn, xã Nà Phòn, Mai Chau, Vietnam',
    checkInDate: '2026-11-25',
    checkOutDate: '2026-11-26',
    confirmationCode: '6601974309',
    price: 70,
    contactPhone: '+84973849006',
    notes: 'חדר זוגי עם נוף להרים. 500,000 VND. המפתחות בדלפק הקבלה. ביטול חינם עד 23.11.2026.',
    freeCancelUntil: '2026-11-23',
  },
  {
    id: 'lodging-booking-tamcoc',
    name: 'Champs De Tam Coc Hotel',
    searchQuery: 'Champs De Tam Coc Hotel',
    coords: [20.206, 105.917],
    type: 'hotel',
    address: 'Champs De TamCoc Garden, Vũ Lâm, Vietnam',
    checkInDate: '2026-12-02',
    checkOutDate: '2026-12-06',
    confirmationCode: '6828978857',
    price: 425,
    contactPhone: '+84983386606',
    notes: 'חדר דלוקס זוגי. 2,975,000 VND. ביטול חינם עד 28.11.2026.',
    freeCancelUntil: '2026-11-28',
  },
  {
    id: 'lodging-booking-celia',
    name: 'Celia Boutique Hotel',
    searchQuery: 'Celia Boutique Hotel Phong Nha',
    coords: [17.594, 106.284],
    type: 'hotel',
    address: 'Đường 20, Phong Nha, Vietnam',
    checkInDate: '2026-12-07',
    checkOutDate: '2026-12-09',
    confirmationCode: '5520488632',
    price: 210,
    contactPhone: '+84906302311',
    notes: 'חדר זוגי עם נוף לגן. 1,479,000 VND. ביטול חינם בכל זמן.',
  },
  {
    id: 'lodging-booking-grandsunrise',
    name: 'Grand Sunrise Palace Hoi An - A Luxury Indochine Hotel & Spa',
    searchQuery: 'Grand Sunrise Palace Hoi An',
    coords: [15.8721, 108.359],
    type: 'hotel',
    address: '320 Cua Dai, Cam Chau, Hoi An, Quang Nam, Vietnam',
    checkInDate: '2026-12-10',
    checkOutDate: '2026-12-20',
    confirmationCode: '8857465518398287312',
    price: 2350,
    contactPhone: '+84794085585',
    notes: 'חדר דלוקס טווין עם מרפסת, 10 לילות. 653 דולר. ביטול חינם עד 6.12.2026. חופף בתאריכים לשתי הזמנות אחרות בהוי אן.',
    freeCancelUntil: '2026-12-06',
  },
  {
    id: 'lodging-booking-anora',
    name: 'Anora Retreat Hoi An',
    searchQuery: 'Anora Retreat Hoi An',
    coords: [15.88, 108.33],
    type: 'other',
    address: '104 Lý Thường Kiệt, Hoi An, Vietnam',
    checkInDate: '2026-12-10',
    checkOutDate: '2026-12-20',
    confirmationCode: '6025823449',
    price: 1700,
    contactPhone: '+84867910486',
    notes: 'סטודיו סופיריור, 10 לילות. 11,943,040 VND. ביטול חינם עד 6.12.2026. חופף בתאריכים לשתי הזמנות אחרות בהוי אן.',
    freeCancelUntil: '2026-12-06',
  },
  {
    id: 'lodging-booking-legacy',
    name: 'Legacy Hoi An Resort',
    searchQuery: 'Legacy Hoi An Resort',
    coords: [15.87, 108.375],
    type: 'resort',
    address: 'Thanh Dong Hamlet - Cam Thanh, Hoi An, Vietnam',
    checkInDate: '2026-12-10',
    checkOutDate: '2026-12-20',
    confirmationCode: '6209809139',
    price: 2250,
    contactPhone: '+84 235 3933 377',
    notes: 'יחידת אירוח סופיריור עם נוף לגן ומרפסת, 10 לילות. 15,790,821 VND, תשלום מראש מלא. ביטול חינם עד 25.11.2026. חופף בתאריכים לשתי הזמנות אחרות בהוי אן.',
    freeCancelUntil: '2026-11-25',
  },
  {
    id: 'lodging-booking-anantha',
    name: 'Anantha Wellness Sanctuary - Free Yoga & GYM',
    searchQuery: 'Anantha Wellness Sanctuary General Luna',
    coords: [9.795, 126.158],
    type: 'resort',
    address: 'Tourism Road, General Luna, Philippines',
    checkInDate: '2026-12-20',
    checkOutDate: '2026-12-28',
    confirmationCode: '6209838024',
    price: 2300,
    contactPhone: '+63 917 534 6004',
    notes: 'חדר דלוקס קווין, 8 לילות. 40,040 PHP. ביטול חינם עד 12.12.2026.',
    freeCancelUntil: '2026-12-12',
  },
];

export const tripLodgings: Lodging[] = seeds.map(({ searchQuery, coords, freeCancelUntil, ...l }) => ({
  ...l,
  tripId: TRIP_ID,
  bookingUrl: bookingLink(searchQuery, l.checkInDate, l.checkOutDate),
}));

export const lodgingCoords: Record<string, [number, number]> = Object.fromEntries(
  seeds.map((s) => [s.id, s.coords])
);

// תזכורת לבדוק אם לבטל: יום לפני הסוף של הביטול החינם (או יום לפני הכניסה אם אין מועד)
export const cancelChecks = seeds.map((s) => {
  const last = s.freeCancelUntil ?? s.checkInDate;
  const d = new Date(`${last}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return {
    lodgingId: s.id,
    name: s.name,
    country: s.address.includes('Philippines') ? ('ph' as const) : ('vn' as const),
    freeCancelUntil: s.freeCancelUntil,
    remindOn: d.toISOString().slice(0, 10),
    checkInDate: s.checkInDate,
    checkOutDate: s.checkOutDate,
  };
});

// מלונות לדוגמה שהיו בגרסאות קודמות (קודי אישור מומצאים), מוסרים כדי שלא יסתירו יעדים בלי מלון
export const placeholderLodgingIds = [
  'lodging-sapa',
  'lodging-hagiang',
  'lodging-maichau',
  'lodging-hanoi',
  'lodging-caobang',
  'lodging-halong',
  'lodging-tamcoc',
  'lodging-hoian',
];
