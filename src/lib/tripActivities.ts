import { Activity } from '../types/trip';

const TRIP_ID = 'trip-vietnam-philippines-2026';

// התכנונים מהפתק "סאפה" ב-Google Keep של נועה, מפוזרים על ימי היעדים לפי routeStops.
// בלי שעות ובלי עלויות, כי הפתק לא מציין אותם.
type Category = Activity['category'];
interface Seed {
  date: string;
  title: string;
  category: Category;
  location?: string;
}

const seeds: Seed[] = [
  // סאפה 18-21.11
  { date: '2026-11-18', title: 'טיול מאמות ליום אחד', category: 'nature', location: 'סאפה' },
  { date: '2026-11-19', title: 'פאנסיפאן', category: 'attraction', location: 'Fansipan, סאפה' },
  { date: '2026-11-19', title: 'כפרים באזור Lao Chai ו-Ta Van', category: 'sightseeing', location: 'Lao Chai & Ta Van, סאפה' },
  { date: '2026-11-20', title: 'המקום של האקסטרים', category: 'attraction', location: 'סאפה' },
  { date: '2026-11-20', title: 'מפל ויער במבוק', category: 'nature', location: 'סאפה' },
  { date: '2026-11-21', title: 'אמבטיות חמות', category: 'relaxation', location: 'סאפה' },
  { date: '2026-11-21', title: 'קניות, בעיקר ציוד ספורט', category: 'shopping', location: 'סאפה' },
  { date: '2026-11-21', title: 'מוצ״ש: סליפר לילה מסאפה להא ג׳יאנג', category: 'transport', location: 'סאפה ← הא ג׳יאנג' },

  // הא ג׳יאנג לופ 22-24.11
  { date: '2026-11-22', title: 'הא ג׳יאנג לופ: טיול אופנועים מאורגן', category: 'sightseeing', location: 'הא ג׳יאנג' },
  { date: '2026-11-24', title: 'לבדוק אם אפשר לחזור להאלונג ביי אחרי הלופ', category: 'transport', location: 'הא ג׳יאנג ← האלונג ביי' },

  // האנוי 27-28.11
  { date: '2026-11-27', title: 'רחוב הרכבת', category: 'attraction', location: 'Hanoi Train Street' },
  { date: '2026-11-27', title: 'קניות בהאנוי', category: 'shopping', location: 'האנוי' },
  { date: '2026-11-28', title: 'שבת בחבד', category: 'other', location: 'בית חבד, האנוי' },

  // קאו בנג לופ 29-30.11
  { date: '2026-11-29', title: 'קאו בנג לופ: טיול אופנועים מאורגן', category: 'sightseeing', location: 'קאו בנג' },
  { date: '2026-11-29', title: 'הלוך וחזור להאנוי בסליפר', category: 'transport', location: 'האנוי ↔ קאו בנג' },

  // מאי צ׳או 25-26.11
  { date: '2026-11-25', title: 'נסיעה למאי צ׳או', category: 'transport', location: 'מאי צ׳או' },
  { date: '2026-11-26', title: 'נחת וטיולי אופניים', category: 'relaxation', location: 'מאי צ׳או' },

  // נין בין וטאם קוק 3-6.12
  { date: '2026-12-03', title: 'לינה באזור טאם קוק', category: 'relaxation', location: 'טאם קוק' },
  { date: '2026-12-04', title: 'Trang An: שיט של שלוש שעות עם מעבר במערות, נהרות ומקדשים', category: 'nature', location: 'Trang An, נין בין' },
  { date: '2026-12-05', title: 'Mua Cave: טיפוס של 500 מדרגות לתצפית יפה בשקיעה', category: 'sightseeing', location: 'Mua Cave, נין בין' },
  { date: '2026-12-06', title: 'אופניים בין הכפרים או ביקור במקדש Bich Dong', category: 'sightseeing', location: 'Bich Dong, נין בין' },

  // פונג נה 7-9.12
  { date: '2026-12-07', title: 'Phong Nha Cave', category: 'nature', location: 'Phong Nha Cave' },
  { date: '2026-12-08', title: 'Phong Nha Botanic Garden', category: 'nature', location: 'Phong Nha Botanic Garden' },
  { date: '2026-12-09', title: 'בתי קפה ושיט על הנהר', category: 'food', location: 'פונג נה' },

  // הויאן, דה נאנג והואה 10-19.12
  { date: '2026-12-10', title: 'כפר הקוקוסים', category: 'nature', location: 'Cam Thanh, הויאן' },
  { date: '2026-12-10', title: 'שיט בסירות סל מסורתיות', category: 'nature', location: 'Cam Thanh, הויאן' },
  { date: '2026-12-11', title: 'חוף An Bang', category: 'relaxation', location: 'An Bang Beach, הויאן' },
  { date: '2026-12-11', title: 'סדנאות', category: 'other', location: 'הויאן' },
  { date: '2026-12-12', title: 'שבת: סיבוב בעיר העתיקה, פנסים לאורך הנהר, הטיילת והגשר היפני', category: 'sightseeing', location: 'העיר העתיקה, הויאן' },
  { date: '2026-12-13', title: 'תפירת בגדים', category: 'shopping', location: 'הויאן' },
  { date: '2026-12-14', title: 'מסאז׳ים וקפה', category: 'relaxation', location: 'הויאן' },
  { date: '2026-12-15', title: 'שוק מקומי וקניות', category: 'shopping', location: 'הויאן' },
  { date: '2026-12-16', title: 'דה נאנג: Marble Mountain', category: 'sightseeing', location: 'Marble Mountains, דה נאנג' },
  { date: '2026-12-16', title: 'דה נאנג: גשר הדרקון', category: 'attraction', location: 'Dragon Bridge, דה נאנג' },
  { date: '2026-12-17', title: 'דה נאנג: Ba Na Hills', category: 'attraction', location: 'Ba Na Hills, דה נאנג' },
  { date: '2026-12-17', title: 'דה נאנג: ספא Masha Spa או Nguon Spa', category: 'relaxation', location: 'דה נאנג' },
  { date: '2026-12-18', title: 'הואה: טיול מאורגן עם אומגות, סנפלינג, סולמות, גשרי חבלים ואיזי ריידר מהואה להויאן', category: 'attraction', location: 'הואה ← הויאן' },
  { date: '2026-12-19', title: 'שבת: סיבוב בעיר העתיקה, פנסים לאורך הנהר, הטיילת והגשר היפני', category: 'sightseeing', location: 'העיר העתיקה, הויאן' },
];

export const tripActivities: Activity[] = seeds.map((s, i) => ({
  id: `plan-${String(i + 1).padStart(2, '0')}`,
  tripId: TRIP_ID,
  activityDate: s.date,
  title: s.title,
  location: s.location,
  category: s.category,
  status: 'planned',
  orderIndex: i + 1,
}));

// הפעילויות, פריטי האריזה וההודעה לדוגמה מהגרסאות הקודמות, מוסרים כשהתכנונים האמיתיים נכנסים
export const placeholderActivityIds = [
  ...Array.from({ length: 29 }, (_, i) => `act-vn-${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `act-ph-${i + 1}`),
];
export const placeholderPackingIds = Array.from({ length: 9 }, (_, i) => `p-vn-${i + 1}`);
export const placeholderChatIds = ['m-vn-1'];
