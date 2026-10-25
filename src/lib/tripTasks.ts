import { TripTask } from '../types/trip';
import { cancelChecks } from './tripLodgings';

const TRIP_ID = 'trip-vietnam-philippines-2026';

type Seed = Omit<TripTask, 'tripId' | 'isDone' | 'dependsOn' | 'assignedTo'> &
  Partial<Pick<TripTask, 'dependsOn' | 'assignedTo' | 'phase' | 'urgent'>>;

const seeds: Seed[] = [
  // בריאות ומסמכים
  { id: 'task-visa-nitay', title: 'ויזה נתאי', group: 'בריאות ומסמכים', assignedTo: 'הוא' },
  {
    id: 'task-health-week',
    title: 'הצהרת בריאות וייטנאם - שבוע לפני',
    group: 'בריאות ומסמכים',
    dueDate: '2026-11-10',
  },
  {
    id: 'task-health-days',
    title: 'הצהרת בריאות כמה ימים לפני וייטנאם',
    group: 'בריאות ומסמכים',
    dueDate: '2026-11-14',
  },
  { id: 'task-nova', title: 'נובה מהרופאה', group: 'בריאות ומסמכים' },
  { id: 'task-malaria', title: 'כדורי מלריה מהרופאה', group: 'בריאות ומסמכים' },
  { id: 'task-moto-license', title: 'רישיון לאופנוע', group: 'בריאות ומסמכים' },
  { id: 'task-passportcard', title: 'לאסוף כרטיס פספורט קארד', group: 'בריאות ומסמכים' },

  // הכנות לטיסה
  { id: 'task-packlist', title: 'יצירת רשימה לארוז', group: 'הכנות לטיסה' },
  {
    id: 'task-suitcase',
    title: 'לקחת מזוודה ותיק ממישהו',
    group: 'הכנות לטיסה',
    dependsOn: ['task-packlist'],
  },
  {
    id: 'task-pots',
    title: 'לקחת סירים חשמליים משני',
    group: 'הכנות לטיסה',
    dependsOn: ['task-packlist'],
  },
  {
    id: 'task-adapters',
    title: 'מתאמים לחשמל משני',
    group: 'הכנות לטיסה',
    dependsOn: ['task-packlist'],
  },
  { id: 'task-pouches', title: 'להשיג פאוצים', group: 'הכנות לטיסה', dependsOn: ['task-packlist'] },

  // הזמנות בוייטנאם
  { id: 'task-hanoi-hotel', title: 'מלון האנוי', group: 'הזמנות בוייטנאם' },
  {
    id: 'task-hagiang',
    title: 'הא גיאנג לופ',
    group: 'הזמנות בוייטנאם',
    dependsOn: ['task-moto-license'],
    notes: 'טיול אופנועים מאורגן. להגיע במוצאי שבת עם סליפר לילה מסאפה. לבדוק אם אפשר לחזור להאלונג ביי אחרי.',
  },
  {
    id: 'task-caobang',
    title: 'קאו בנג לופ',
    group: 'הזמנות בוייטנאם',
    dependsOn: ['task-hanoi-hotel'],
  },
  {
    id: 'task-halong',
    title: 'קרוז האלונג ביי',
    group: 'הזמנות בוייטנאם',
    dependsOn: ['task-caobang'],
  },
  { id: 'task-phongnha', title: 'טרק פונג נה', group: 'הזמנות בוייטנאם', phase: 'during' },
  { id: 'task-hoian-workshops', title: 'סדנאות הויאן', group: 'הזמנות בוייטנאם', phase: 'during' },
  {
    id: 'task-sleepers',
    title: 'סליפרים ומעברים',
    group: 'הזמנות בוייטנאם',
    dependsOn: ['task-hagiang', 'task-caobang', 'task-halong'],
    notes: 'אחרי שהתאריכים של הלופים והקרוז סגורים.',
  },

  // הזמנות בפיליפינים
  { id: 'task-siargao-hotel', title: 'מלון שירגאו', group: 'הזמנות בפיליפינים' },
  {
    id: 'task-siargao-surf',
    title: 'גלישה שירגאו',
    group: 'הזמנות בפיליפינים',
    dependsOn: ['task-siargao-hotel'],
  },
  { id: 'task-bohol-hotel', title: 'מלון בוהול', group: 'הזמנות בפיליפינים' },
  {
    id: 'task-bohol-falls',
    title: 'טיול מפלים בוהול',
    group: 'הזמנות בפיליפינים',
    dependsOn: ['task-bohol-hotel'],
  },
  { id: 'task-camiguin-hotel', title: 'מלון קמיגין', group: 'הזמנות בפיליפינים', urgent: true },
  { id: 'task-elnido-hotel', title: 'מלון אל נידו', group: 'הזמנות בפיליפינים' },
  {
    id: 'task-elnido-tour-a',
    title: 'סיור A אל נידו',
    group: 'הזמנות בפיליפינים',
    dependsOn: ['task-elnido-hotel'],
  },
  {
    id: 'task-elnido-tour-c',
    title: 'סיור C אל נידו',
    group: 'הזמנות בפיליפינים',
    dependsOn: ['task-elnido-hotel'],
  },
  { id: 'task-manila-hotel', title: 'מלון מנילה', group: 'הזמנות בפיליפינים' },
  {
    id: 'task-manila-luggage',
    title: 'השארת חפצים שדה מנילה',
    group: 'הזמנות בפיליפינים',
    dependsOn: ['task-manila-hotel'],
  },
];

const fmt = (iso: string) => iso.split('-').reverse().slice(0, 2).join('.');

// תזכורת לכל מלון שנסגר: יום לפני תום הביטול החינם, לבדוק אם עדיין רוצים אותו
const cancelCheckSeeds: Seed[] = cancelChecks.map((c) => ({
  id: `task-cancel-${c.lodgingId.replace('lodging-booking-', '')}`,
  title: `לבדוק אם לבטל: ${c.name}`,
  group: c.country === 'ph' ? 'הזמנות בפיליפינים' : 'הזמנות בוייטנאם',
  dueDate: c.remindOn,
  notes: c.freeCancelUntil
    ? `ביטול חינם עד ${fmt(c.freeCancelUntil)}. אחרי זה מחויבים. הלינה: ${fmt(c.checkInDate)}–${fmt(c.checkOutDate)}.`
    : `ביטול חינם בכל זמן, התזכורת ביום שלפני הכניסה (${fmt(c.checkInDate)}).`,
}));

export const tripTasks: TripTask[] = [...seeds, ...cancelCheckSeeds].map((s) => ({
  assignedTo: 'שנינו',
  dependsOn: [],
  phase: 'before',
  ...s,
  tripId: TRIP_ID,
  isDone: false,
}));
