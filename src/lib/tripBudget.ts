import { BudgetItem } from '../types/trip';
import { tripLodgings } from './tripLodgings';

const TRIP_ID = 'trip-vietnam-philippines-2026';

// התקציב נבנה ממיילי האישור (תוויות "טיסות" ו"מלונות" אצל נועה). הסכומים בש״ח בהערכה לפי שער חליפין
// (דולר 3.6, פזו פיליפיני 0.058, דונג וייטנאמי 0.00014), והסכום המקורי כתוב בשם הסעיף.
// מחירי Trip.com נקראו מקובצי E-receipt המצורפים. המחיר של Kiwi לא מופיע בקובץ המצורף
// והמחיר של ארקיע לא נבדק, ולכן Kiwi מופיע עם 0 עד שיעדכנו אותו ידנית.
interface FlightCost {
  id: string;
  title: string;
  estimatedCost: number;
  expenseDate: string;
}

const flightCosts: FlightCost[] = [
  { id: 'budget-flight-arkia', title: 'טיסה ישירה לוייטנאם, ארקיע 13380009 (המחיר מהנתונים הקיימים, לא מופיע במייל)', estimatedCost: 3800, expenseDate: '2026-06-11' },
  { id: 'budget-flight-mytrip', title: 'דה נאנג ← סיארגאו, Mytrip 1154-758-061 (807.35$ לשניים)', estimatedCost: 2907, expenseDate: '2026-10-04' },
  { id: 'budget-flight-pal', title: 'סיארגאו ← סבו, Philippine Airlines X2B5F4 (10,852 PHP)', estimatedCost: 629, expenseDate: '2026-09-15' },
  { id: 'budget-flight-cebu', title: 'סבו ← קמיגין, Cebu Pacific ZIG2PC (10,409 PHP)', estimatedCost: 604, expenseDate: '2026-09-15' },
  { id: 'budget-flight-trip-camiguin', title: 'קמיגין ← סבו ← אל נידו, Trip.com 1378839578365144 (432.20$)', estimatedCost: 1556, expenseDate: '2026-09-15' },
  { id: 'budget-flight-trip-elnido', title: 'אל נידו ← סבו ← מנילה, Trip.com 1378839578164248 (477.80$ כולל כבודה)', estimatedCost: 1720, expenseDate: '2026-09-15' },
  { id: 'budget-flight-kiwi', title: 'מנילה ← דלהי ← תל אביב, Kiwi 847405064 (המחיר לא במייל, לעדכן)', estimatedCost: 0, expenseDate: '2026-09-24' },
];

// Legacy שולם מראש במלואו, בשאר המלונות משלמים במקום או סמוך להגעה
const prepaidLodgings = new Set(['lodging-booking-legacy']);

const flightItems: BudgetItem[] = flightCosts.map((f) => ({
  id: f.id,
  tripId: TRIP_ID,
  title: f.title,
  category: 'flights',
  estimatedCost: f.estimatedCost,
  actualCost: f.estimatedCost,
  currency: 'ILS',
  paidBy: 'משותף',
  expenseDate: f.expenseDate,
}));

const hotelItems: BudgetItem[] = tripLodgings.map((l) => {
  const prepaid = prepaidLodgings.has(l.id);
  return {
    id: `budget-${l.id}`,
    tripId: TRIP_ID,
    title: `${l.name} (${l.checkInDate.slice(8)}.${l.checkInDate.slice(5, 7)}–${l.checkOutDate.slice(8)}.${l.checkOutDate.slice(5, 7)})${prepaid ? '' : ', תשלום במלון'}`,
    category: 'hotels',
    estimatedCost: l.price ?? 0,
    actualCost: prepaid ? (l.price ?? 0) : 0,
    currency: 'ILS',
    paidBy: 'משותף',
    expenseDate: '2026-09-24',
  };
});

export const tripBudget: BudgetItem[] = [...flightItems, ...hotelItems];

// פריטי התקציב לדוגמה מהגרסאות הקודמות, מוסרים כשהתקציב האמיתי נכנס
export const placeholderBudgetIds = ['b-vn-1', 'b-vn-2', 'b-vn-3', 'b-vn-4', 'b-vn-5', 'b-vn-6'];
