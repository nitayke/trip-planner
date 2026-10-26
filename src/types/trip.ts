export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes?: string;
  noHotelStops?: string[]; // ids of route stops marked as not needing a hotel
  shareCode?: string;
  createdAt?: string;
}

export interface Flight {
  id: string;
  tripId: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string; // ISO string or datetime-local
  arrivalTime: string; // ISO string or datetime-local
  confirmationCode?: string;
  seat?: string;
  price?: number;
  notes?: string;
}

export interface Lodging {
  id: string;
  tripId: string;
  name: string;
  type: 'hotel' | 'airbnb' | 'resort' | 'apartment' | 'other';
  address: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  confirmationCode?: string;
  price?: number;
  contactPhone?: string;
  notes?: string;
  bookingUrl?: string;
}

export interface Activity {
  id: string;
  tripId: string;
  stopId?: string; // the place (route stop) the activity belongs to
  activityDate?: string; // YYYY-MM-DD, only when the day was explicitly decided
  timeSlot?: string; // e.g. "10:00", "בוקר", "צהריים", "ערב"
  title: string;
  description?: string;
  location?: string;
  category: 'sightseeing' | 'food' | 'transport' | 'relaxation' | 'nature' | 'shopping' | 'attraction' | 'other';
  cost?: number;
  status: 'planned' | 'completed' | 'cancelled';
  orderIndex?: number;
  lat?: number; // מיקום על המפה (אטרקציות שנוספו דרך המפה)
  lng?: number;
}

export interface BudgetItem {
  id: string;
  tripId: string;
  title: string;
  category: 'flights' | 'hotels' | 'food' | 'activities' | 'shopping' | 'transit' | 'general';
  estimatedCost: number;
  actualCost: number;
  currency: string;
  paidBy: 'הוא' | 'היא' | 'משותף';
  expenseDate?: string;
}

export interface PackingItem {
  id: string;
  tripId: string;
  title: string;
  category: 'בגדים' | 'מסמכים וכרטיסים' | 'אלקטרוניקה' | 'רפואי וטואלטיקה' | 'שונות';
  assignedTo: 'הוא' | 'היא' | 'שנינו';
  isPacked: boolean;
}

export type TaskGroup = 'בריאות ומסמכים' | 'הכנות לטיסה' | 'הזמנות בוייטנאם' | 'הזמנות בפיליפינים';

export interface TripTask {
  id: string;
  tripId: string;
  title: string;
  group: TaskGroup;
  assignedTo: 'הוא' | 'היא' | 'שנינו';
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  isDone: boolean;
  dependsOn: string[]; // ids of tasks that must be done first
  phase?: 'before' | 'during'; // before = close before the trip, during = close while travelling (default: before)
  urgent?: boolean; // close as soon as possible
  person?: string; // the person the task is tied to, e.g. "אבא של נועה"
  linkedDate?: string; // YYYY-MM-DD, the date the task is tied to (e.g. the day we meet that person)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actionsPerformed?: Array<{
    type: string;
    details: string;
  }>;
  createdAt: string;
}

export interface TripFullData {
  trip: Trip;
  flights: Flight[];
  lodgings: Lodging[];
  activities: Activity[];
  budgetItems: BudgetItem[];
  packingItems: PackingItem[];
  tasks: TripTask[];
  chatMessages: ChatMessage[];
}
