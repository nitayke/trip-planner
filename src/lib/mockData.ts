import { TripFullData } from '../types/trip';
import { tripFlights } from './tripFlights';
import { tripTasks } from './tripTasks';
import { tripLodgings } from './tripLodgings';
import { tripBudget } from './tripBudget';

export const initialTripData: TripFullData = {
  trip: {
    id: 'trip-vietnam-philippines-2026',
    title: 'המסע הגדול: וייטנאם 🇻🇳 והפיליפינים 🇵🇭',
    destination: 'וייטנאם (17.11 - 19.12) & הפיליפינים (20.12 - 17.01)',
    startDate: '2026-11-17',
    endDate: '2027-01-17',
    notes: 'טיול חלומי של חודשיים שלמים (17.11.2026 עד 17.01.2027 - 62 ימים)! חלק א׳: וייטנאם (סאפה, הא ג׳יאנג, מאי צ׳או, האנוי, קאו בנג, האלונג, טאם קוק, הויאן). חלק ב׳: הפיליפינים - איים טרופיים, חופים, שוניות, לגונות וסילבסטר 2027!',
    shareCode: 'VNPH2627',
    createdAt: new Date().toISOString(),
  },
  flights: tripFlights,
  lodgings: tripLodgings,
  activities: [],
  budgetItems: tripBudget,
  packingItems: [],
  tasks: tripTasks,
  chatMessages: [],
};
