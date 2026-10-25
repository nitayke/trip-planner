import { createClient } from '@supabase/supabase-js';
import { TripFullData, Trip, Flight, Lodging, Activity, BudgetItem, PackingItem, ChatMessage } from '../types/trip';
import { initialTripData } from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

const STORAGE_KEY = 'trip_planner_vietnam_v2';

// Get local data or initialize with initial mock
export function getLocalTripData(): TripFullData {
  if (typeof window === 'undefined') return initialTripData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.trip?.id === 'trip-vietnam-2026') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading localStorage', e);
  }
  return initialTripData;
}

// Save to localStorage
export function saveLocalTripData(data: TripFullData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// Data synchronization service
export async function loadTripData(): Promise<TripFullData> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalTripData();
  }

  try {
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (tripError || !trips || trips.length === 0) {
      console.warn('No trips found in Supabase, using local data');
      return getLocalTripData();
    }

    const currentTrip = trips[0];
    const tripId = currentTrip.id;

    const [flightsRes, lodgingsRes, activitiesRes, budgetRes, packingRes, chatRes] = await Promise.all([
      supabase.from('flights').select('*').eq('trip_id', tripId).order('departure_time', { ascending: true }),
      supabase.from('lodgings').select('*').eq('trip_id', tripId).order('check_in_date', { ascending: true }),
      supabase.from('activities').select('*').eq('trip_id', tripId).order('activity_date', { ascending: true }).order('order_index', { ascending: true }),
      supabase.from('budget_items').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
      supabase.from('packing_items').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
      supabase.from('chat_messages').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
    ]);

    const mappedTrip: Trip = {
      id: currentTrip.id,
      title: currentTrip.title,
      destination: currentTrip.destination,
      startDate: currentTrip.start_date,
      endDate: currentTrip.end_date,
      notes: currentTrip.notes,
      shareCode: currentTrip.share_code,
      createdAt: currentTrip.created_at,
    };

    const mappedFlights: Flight[] = (flightsRes.data || []).map((f) => ({
      id: f.id,
      tripId: f.trip_id,
      airline: f.airline,
      flightNumber: f.flight_number,
      departureAirport: f.departure_airport,
      arrivalAirport: f.arrival_airport,
      departureTime: f.departure_time,
      arrivalTime: f.arrival_time,
      confirmationCode: f.confirmation_code,
      seat: f.seat,
      price: Number(f.price || 0),
      notes: f.notes,
    }));

    const mappedLodgings: Lodging[] = (lodgingsRes.data || []).map((l) => ({
      id: l.id,
      tripId: l.trip_id,
      name: l.name,
      type: l.type,
      address: l.address,
      checkInDate: l.check_in_date,
      checkOutDate: l.check_out_date,
      confirmationCode: l.confirmation_code,
      price: Number(l.price || 0),
      contactPhone: l.contact_phone,
      notes: l.notes,
      bookingUrl: l.booking_url,
    }));

    const mappedActivities: Activity[] = (activitiesRes.data || []).map((a) => ({
      id: a.id,
      tripId: a.trip_id,
      activityDate: a.activity_date,
      timeSlot: a.time_slot,
      title: a.title,
      description: a.description,
      location: a.location,
      category: a.category,
      cost: Number(a.cost || 0),
      status: a.status,
      orderIndex: a.order_index,
    }));

    const mappedBudget: BudgetItem[] = (budgetRes.data || []).map((b) => ({
      id: b.id,
      tripId: b.trip_id,
      title: b.title,
      category: b.category,
      estimatedCost: Number(b.estimated_cost || 0),
      actualCost: Number(b.actual_cost || 0),
      currency: b.currency || 'ILS',
      paidBy: b.paid_by,
      expenseDate: b.expense_date,
    }));

    const mappedPacking: PackingItem[] = (packingRes.data || []).map((p) => ({
      id: p.id,
      tripId: p.trip_id,
      title: p.title,
      category: p.category,
      assignedTo: p.assigned_to,
      isPacked: Boolean(p.is_packed),
    }));

    const mappedChat: ChatMessage[] = (chatRes.data || []).map((c) => ({
      id: c.id,
      role: c.role,
      content: c.content,
      actionsPerformed: c.actions_performed,
      createdAt: c.created_at,
    }));

    const fullData: TripFullData = {
      trip: mappedTrip,
      flights: mappedFlights,
      lodgings: mappedLodgings,
      activities: mappedActivities,
      budgetItems: mappedBudget,
      packingItems: mappedPacking,
      chatMessages: mappedChat.length > 0 ? mappedChat : initialTripData.chatMessages,
    };

    saveLocalTripData(fullData);
    return fullData;
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    return getLocalTripData();
  }
}

// Sync full state helper to Supabase (when mutations occur)
export async function syncTripItem(type: 'activity' | 'flight' | 'lodging' | 'budget' | 'packing' | 'trip', action: 'insert' | 'update' | 'delete', item: any) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    switch (type) {
      case 'trip': {
        const payload = {
          title: item.title,
          destination: item.destination,
          start_date: item.startDate,
          end_date: item.endDate,
          notes: item.notes,
        };
        await supabase.from('trips').upsert({ id: item.id, ...payload });
        break;
      }
      case 'activity': {
        if (action === 'delete') {
          await supabase.from('activities').delete().eq('id', item.id);
        } else {
          const payload = {
            id: item.id,
            trip_id: item.tripId,
            activity_date: item.activityDate,
            time_slot: item.timeSlot,
            title: item.title,
            description: item.description,
            location: item.location,
            category: item.category,
            cost: item.cost,
            status: item.status,
            order_index: item.orderIndex,
          };
          await supabase.from('activities').upsert(payload);
        }
        break;
      }
      case 'flight': {
        if (action === 'delete') {
          await supabase.from('flights').delete().eq('id', item.id);
        } else {
          const payload = {
            id: item.id,
            trip_id: item.tripId,
            airline: item.airline,
            flight_number: item.flightNumber,
            departure_airport: item.departureAirport,
            arrival_airport: item.arrivalAirport,
            departure_time: item.departureTime,
            arrival_time: item.arrivalTime,
            confirmation_code: item.confirmationCode,
            seat: item.seat,
            price: item.price,
            notes: item.notes,
          };
          await supabase.from('flights').upsert(payload);
        }
        break;
      }
      case 'lodging': {
        if (action === 'delete') {
          await supabase.from('lodgings').delete().eq('id', item.id);
        } else {
          const payload = {
            id: item.id,
            trip_id: item.tripId,
            name: item.name,
            type: item.type,
            address: item.address,
            check_in_date: item.checkInDate,
            check_out_date: item.checkOutDate,
            confirmation_code: item.confirmationCode,
            price: item.price,
            contact_phone: item.contactPhone,
            notes: item.notes,
            booking_url: item.bookingUrl,
          };
          await supabase.from('lodgings').upsert(payload);
        }
        break;
      }
      case 'budget': {
        if (action === 'delete') {
          await supabase.from('budget_items').delete().eq('id', item.id);
        } else {
          const payload = {
            id: item.id,
            trip_id: item.tripId,
            title: item.title,
            category: item.category,
            estimated_cost: item.estimatedCost,
            actual_cost: item.actualCost,
            currency: item.currency,
            paid_by: item.paidBy,
            expense_date: item.expenseDate,
          };
          await supabase.from('budget_items').upsert(payload);
        }
        break;
      }
      case 'packing': {
        if (action === 'delete') {
          await supabase.from('packing_items').delete().eq('id', item.id);
        } else {
          const payload = {
            id: item.id,
            trip_id: item.tripId,
            title: item.title,
            category: item.category,
            assigned_to: item.assignedTo,
            is_packed: item.isPacked,
          };
          await supabase.from('packing_items').upsert(payload);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Error syncing item with Supabase:', err);
  }
}
