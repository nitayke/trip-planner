import { createClient } from '@supabase/supabase-js';
import { TripFullData, Trip, Flight, Lodging, Activity, BudgetItem, PackingItem, TripTask, ChatMessage } from '../types/trip';
import { initialTripData } from './mockData';
import { tripLodgings, placeholderLodgingIds } from './tripLodgings';

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

const STORAGE_KEY = 'trip_planner_vietnam_philippines_v4';
const LEGACY_STORAGE_KEY = 'trip_planner_vietnam_philippines_v3';

// Get local data or initialize with initial mock
export function getLocalTripData(): TripFullData {
  if (typeof window === 'undefined') return initialTripData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.trip?.id === 'trip-vietnam-philippines-2026') {
        // tasks saved before phase/urgent existed pick those fields up from the seed
        const seedTasks = new Map(initialTripData.tasks.map((t) => [t.id, t]));
        const tasks = ((parsed.tasks ?? []) as TripTask[]).map((t) => {
          const seed = seedTasks.get(t.id);
          return seed && t.phase === undefined ? { ...t, phase: seed.phase, urgent: seed.urgent } : t;
        });
        return { ...parsed, tasks };
      }
    }

    // v3 had placeholder flights and no tasks: keep everything else the user edited
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy?.trip?.id === 'trip-vietnam-philippines-2026') {
        const migrated: TripFullData = {
          ...legacy,
          flights: initialTripData.flights,
          tasks: initialTripData.tasks,
        };
        saveLocalTripData(migrated);
        return migrated;
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

const SEED_MIGRATION_KEY = 'trip_seed_migration_v5';

// One-time update for data that was saved before the real hotel bookings and the
// cancellation reminders existed: drops the old placeholder hotels, adds what is missing
// (by id) and pushes it to Supabase.
function applySeedMigration(data: TripFullData): TripFullData {
  if (typeof window === 'undefined') return data;
  try {
    if (localStorage.getItem(SEED_MIGRATION_KEY)) return data;

    const placeholders = new Set(placeholderLodgingIds);
    const removed = data.lodgings.filter((l) => placeholders.has(l.id));
    const keptLodgings = data.lodgings.filter((l) => !placeholders.has(l.id));
    const lodgingIds = new Set(keptLodgings.map((l) => l.id));
    const addedLodgings = tripLodgings.filter((l) => !lodgingIds.has(l.id));

    const taskIds = new Set(data.tasks.map((t) => t.id));
    const addedTasks = initialTripData.tasks.filter((t) => t.id.startsWith('task-cancel-') && !taskIds.has(t.id));

    removed.forEach((l) => syncTripItem('lodging', 'delete', { id: l.id }));
    addedLodgings.forEach((l) => syncTripItem('lodging', 'insert', l));
    addedTasks.forEach((t) => syncTripItem('task', 'insert', t));

    localStorage.setItem(SEED_MIGRATION_KEY, new Date().toISOString());
    return {
      ...data,
      lodgings: [...keptLodgings, ...addedLodgings],
      tasks: [...data.tasks, ...addedTasks],
    };
  } catch (e) {
    console.error('Seed migration failed', e);
    return data;
  }
}

// supabase-js reports failures in the result instead of throwing
function reportSyncError(res: { error: { message: string } | null }) {
  if (res.error) console.error('Error syncing item with Supabase:', res.error.message);
}

// Some built-in items still carry an old trip id, which the foreign key would reject
function withTripId(data: TripFullData): TripFullData {
  const tripId = data.trip.id;
  const own = <T extends { tripId: string }>(items: T[]) => items.map((i) => ({ ...i, tripId }));
  return {
    ...data,
    flights: own(data.flights),
    lodgings: own(data.lodgings),
    activities: own(data.activities),
    budgetItems: own(data.budgetItems),
    packingItems: own(data.packingItems),
    tasks: own(data.tasks),
  };
}

async function uploadAllToCloud(data: TripFullData) {
  const jobs: Promise<void>[] = [
    ...data.flights.map((i) => syncTripItem('flight', 'insert', i)),
    ...data.lodgings.map((i) => syncTripItem('lodging', 'insert', i)),
    ...data.activities.map((i) => syncTripItem('activity', 'insert', i)),
    ...data.budgetItems.map((i) => syncTripItem('budget', 'insert', i)),
    ...data.packingItems.map((i) => syncTripItem('packing', 'insert', i)),
    ...data.tasks.map((i) => syncTripItem('task', 'insert', i)),
  ];
  await Promise.all(jobs);
}

// Data synchronization service
export async function loadTripData(): Promise<TripFullData> {
  if (!isSupabaseConfigured || !supabase) {
    const local = applySeedMigration(getLocalTripData());
    saveLocalTripData(local);
    return local;
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

    const [flightsRes, lodgingsRes, activitiesRes, budgetRes, packingRes, tasksRes, chatRes] = await Promise.all([
      supabase.from('flights').select('*').eq('trip_id', tripId).order('departure_time', { ascending: true }),
      supabase.from('lodgings').select('*').eq('trip_id', tripId).order('check_in_date', { ascending: true }),
      supabase.from('activities').select('*').eq('trip_id', tripId).order('activity_date', { ascending: true }).order('order_index', { ascending: true }),
      supabase.from('budget_items').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
      supabase.from('packing_items').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
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
      lat: a.lat ?? undefined,
      lng: a.lng ?? undefined,
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

    const mappedTasks: TripTask[] = (tasksRes.data || []).map((t) => ({
      id: t.id,
      tripId: t.trip_id,
      title: t.title,
      group: t.task_group,
      assignedTo: t.assigned_to,
      dueDate: t.due_date ?? undefined,
      notes: t.notes ?? undefined,
      isDone: Boolean(t.is_done),
      dependsOn: Array.isArray(t.depends_on) ? t.depends_on : [],
      phase: t.phase ?? 'before',
      urgent: Boolean(t.urgent),
    }));

    const mappedChat: ChatMessage[] = (chatRes.data || []).map((c) => ({
      id: c.id,
      role: c.role,
      content: c.content,
      actionsPerformed: c.actions_performed,
      createdAt: c.created_at,
    }));

    // A freshly created cloud database holds only the trip row: fill it from this device
    // (or from the built-in plan when this device has nothing worth keeping) instead of wiping local data.
    const cloudIsEmpty =
      mappedFlights.length + mappedActivities.length + mappedBudget.length + mappedPacking.length + mappedTasks.length === 0;
    if (cloudIsEmpty) {
      const local = getLocalTripData();
      const localHasPlan = local.flights.length > 0 || local.activities.length > 0;
      const source = withTripId(applySeedMigration(localHasPlan ? local : { ...initialTripData, trip: mappedTrip }));
      await uploadAllToCloud(source);
      saveLocalTripData(source);
      return source;
    }

    const fullData: TripFullData = {
      trip: mappedTrip,
      flights: mappedFlights,
      lodgings: mappedLodgings,
      activities: mappedActivities,
      budgetItems: mappedBudget,
      packingItems: mappedPacking,
      tasks: mappedTasks.length > 0 ? mappedTasks : initialTripData.tasks,
      chatMessages: mappedChat.length > 0 ? mappedChat : initialTripData.chatMessages,
    };

    const migrated = applySeedMigration(fullData);
    saveLocalTripData(migrated);
    return migrated;
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    return getLocalTripData();
  }
}

// Sync full state helper to Supabase (when mutations occur)
export async function syncTripItem(type: 'activity' | 'flight' | 'lodging' | 'budget' | 'packing' | 'task' | 'trip', action: 'insert' | 'update' | 'delete', item: any) {
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
        reportSyncError(await supabase.from('trips').upsert({ id: item.id, ...payload }));
        break;
      }
      case 'activity': {
        if (action === 'delete') {
          reportSyncError(await supabase.from('activities').delete().eq('id', item.id));
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
            // העמודות lat/lng קיימות רק אחרי שמריצים את ה-ALTER ב-schema.sql
            ...(item.lat !== undefined && item.lng !== undefined ? { lat: item.lat, lng: item.lng } : {}),
          };
          reportSyncError(await supabase.from('activities').upsert(payload));
        }
        break;
      }
      case 'flight': {
        if (action === 'delete') {
          reportSyncError(await supabase.from('flights').delete().eq('id', item.id));
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
          reportSyncError(await supabase.from('flights').upsert(payload));
        }
        break;
      }
      case 'lodging': {
        if (action === 'delete') {
          reportSyncError(await supabase.from('lodgings').delete().eq('id', item.id));
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
          reportSyncError(await supabase.from('lodgings').upsert(payload));
        }
        break;
      }
      case 'budget': {
        if (action === 'delete') {
          reportSyncError(await supabase.from('budget_items').delete().eq('id', item.id));
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
          reportSyncError(await supabase.from('budget_items').upsert(payload));
        }
        break;
      }
      case 'packing': {
        if (action === 'delete') {
          reportSyncError(await supabase.from('packing_items').delete().eq('id', item.id));
        } else {
          const payload = {
            id: item.id,
            trip_id: item.tripId,
            title: item.title,
            category: item.category,
            assigned_to: item.assignedTo,
            is_packed: item.isPacked,
          };
          reportSyncError(await supabase.from('packing_items').upsert(payload));
        }
        break;
      }
      case 'task': {
        if (action === 'delete') {
          reportSyncError(await supabase.from('tasks').delete().eq('id', item.id));
        } else {
          const payload = {
            id: item.id,
            trip_id: item.tripId,
            title: item.title,
            task_group: item.group,
            assigned_to: item.assignedTo,
            due_date: item.dueDate ?? null,
            notes: item.notes ?? null,
            is_done: item.isDone,
            depends_on: item.dependsOn,
            phase: item.phase ?? 'before',
            urgent: item.urgent ?? false,
          };
          reportSyncError(await supabase.from('tasks').upsert(payload));
        }
        break;
      }
    }
  } catch (err) {
    console.error('Error syncing item with Supabase:', err);
  }
}
