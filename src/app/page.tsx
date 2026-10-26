'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TripFullData, Activity, Flight, Lodging, BudgetItem, PackingItem, TripTask } from '../types/trip';
import { loadTripData, saveLocalTripData, syncTripItem, isSupabaseConfigured } from '../lib/supabase';
import { initialTripData } from '../lib/mockData';
import { Header } from '../components/Header';
import { Navigation, TabType } from '../components/Navigation';
import { TimelineTab } from '../components/TimelineTab';
import { FlightsTab } from '../components/FlightsTab';
import { LodgingsTab } from '../components/LodgingsTab';
import { BudgetTab } from '../components/BudgetTab';
import { PackingTab } from '../components/PackingTab';
import { TasksTab } from '../components/TasksTab';
import { getBlockingTasks } from '../lib/tasks';
import { routeStops, stopForDate } from '../lib/route';
import { DueRemindersBanner } from '../components/DueRemindersBanner';
import { AiChatDrawer } from '../components/AiChatDrawer';
import { CloudSyncModal } from '../components/CloudSyncModal';

// Leaflet touches `window`, so the map is only loaded in the browser
const MapTab = dynamic(() => import('../components/MapTab').then((m) => m.MapTab), {
  ssr: false,
  loading: () => <div className="h-[62vh] animate-pulse rounded-2xl bg-stone-100" />,
});

const flightLabel = (f: Flight) => `${f.flightNumber} ${f.airline} ${f.departureAirport} ${f.arrivalAirport}`;

// Finds the item an AI action refers to: by exact id when given, else by a title/name substring
// (narrowed by date when one is given)
function findItem<T extends { id: string }>(
  items: T[],
  args: Record<string, any>,
  label: (item: T) => string,
  date?: (item: T) => string,
  dateArg?: string,
): T | undefined {
  if (args.id) {
    const byId = items.find((i) => i.id === args.id);
    if (byId) return byId;
  }
  const query = String(args.title ?? args.name ?? args.query ?? '').toLowerCase();
  if (!query) return undefined;
  const matches = items.filter((i) => label(i).toLowerCase().includes(query));
  if (date && dateArg && args[dateArg]) {
    return matches.find((i) => date(i) === args[dateArg]) ?? matches[0];
  }
  return matches[0];
}

// Copies the listed fields the AI actually sent, plus an optional renamed field and numeric extras
function pick(
  source: Record<string, any>,
  keys: string[],
  renamed?: string,
  renamedKey?: string,
  numeric: Record<string, any> = {},
): any {
  const out: Record<string, any> = {};
  for (const k of keys) if (source[k] !== undefined && source[k] !== null) out[k] = source[k];
  if (renamed && renamedKey) out[renamedKey] = renamed;
  for (const [k, v] of Object.entries(numeric)) if (v !== undefined && v !== null) out[k] = Number(v);
  return out;
}

export default function HomePage() {
  const [tripData, setTripData] = useState<TripFullData>(initialTripData);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    async function initData() {
      try {
        const data = await loadTripData();
        setTripData(data);
      } catch (err) {
        console.error('Failed to load trip data', err);
      } finally {
        setIsLoaded(true);
      }
    }
    initData();
  }, []);

  // Helper to persist changes
  const updateData = (updater: (prev: TripFullData) => TripFullData) => {
    setTripData((prev) => {
      const next = updater(prev);
      saveLocalTripData(next);
      return next;
    });
  };

  // Activity handlers
  const handleAddActivity = (actData: Omit<Activity, 'id' | 'tripId'>) => {
    const newAct: Activity = {
      ...actData,
      id: `act-${Date.now()}`,
      tripId: tripData.trip.id,
    };
    updateData((prev) => ({
      ...prev,
      activities: [...prev.activities, newAct],
    }));
    syncTripItem('activity', 'insert', newAct);
  };

  const handleDeleteActivity = (id: string) => {
    updateData((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== id),
    }));
    syncTripItem('activity', 'delete', { id });
  };

  const handleUpdateActivity = (id: string, changes: Partial<Omit<Activity, 'id' | 'tripId'>>) => {
    updateData((prev) => {
      const updated = prev.activities.map((a) => (a.id === id ? { ...a, ...changes } : a));
      const act = updated.find((a) => a.id === id);
      if (act) syncTripItem('activity', 'update', act);
      return { ...prev, activities: updated };
    });
  };

  const handleToggleActivityStatus = (id: string) => {
    updateData((prev) => {
      const updated = prev.activities.map((a) =>
        a.id === id ? { ...a, status: (a.status === 'completed' ? 'planned' : 'completed') as any } : a
      );
      const act = updated.find((a) => a.id === id);
      if (act) syncTripItem('activity', 'update', act);
      return { ...prev, activities: updated };
    });
  };

  // Flight handlers
  const handleAddFlight = (flightData: Omit<Flight, 'id' | 'tripId'>) => {
    const newFlight: Flight = {
      ...flightData,
      id: `flight-${Date.now()}`,
      tripId: tripData.trip.id,
    };
    updateData((prev) => ({
      ...prev,
      flights: [...prev.flights, newFlight],
    }));
    syncTripItem('flight', 'insert', newFlight);
  };

  const handleUpdateFlight = (id: string, changes: Partial<Omit<Flight, 'id' | 'tripId'>>) => {
    updateData((prev) => {
      const updated = prev.flights.map((f) => (f.id === id ? { ...f, ...changes } : f));
      const flight = updated.find((f) => f.id === id);
      if (flight) syncTripItem('flight', 'update', flight);
      return { ...prev, flights: updated };
    });
  };

  const handleDeleteFlight = (id: string) => {
    updateData((prev) => ({
      ...prev,
      flights: prev.flights.filter((f) => f.id !== id),
    }));
    syncTripItem('flight', 'delete', { id });
  };

  // Lodging handlers
  const handleAddLodging = (lodgingData: Omit<Lodging, 'id' | 'tripId'>) => {
    const newLodging: Lodging = {
      ...lodgingData,
      id: `lodging-${Date.now()}`,
      tripId: tripData.trip.id,
    };
    updateData((prev) => ({
      ...prev,
      lodgings: [...prev.lodgings, newLodging],
    }));
    syncTripItem('lodging', 'insert', newLodging);
  };

  const handleUpdateLodging = (id: string, changes: Partial<Omit<Lodging, 'id' | 'tripId'>>) => {
    updateData((prev) => {
      const updated = prev.lodgings.map((l) => (l.id === id ? { ...l, ...changes } : l));
      const lodging = updated.find((l) => l.id === id);
      if (lodging) syncTripItem('lodging', 'update', lodging);
      return { ...prev, lodgings: updated };
    });
  };

  const handleDeleteLodging = (id: string) => {
    updateData((prev) => ({
      ...prev,
      lodgings: prev.lodgings.filter((l) => l.id !== id),
    }));
    syncTripItem('lodging', 'delete', { id });
  };

  // Budget handlers
  const handleAddBudgetItem = (itemData: Omit<BudgetItem, 'id' | 'tripId'>) => {
    const newItem: BudgetItem = {
      ...itemData,
      id: `budget-${Date.now()}`,
      tripId: tripData.trip.id,
    };
    updateData((prev) => ({
      ...prev,
      budgetItems: [...prev.budgetItems, newItem],
    }));
    syncTripItem('budget', 'insert', newItem);
  };

  const handleDeleteBudgetItem = (id: string) => {
    updateData((prev) => ({
      ...prev,
      budgetItems: prev.budgetItems.filter((b) => b.id !== id),
    }));
    syncTripItem('budget', 'delete', { id });
  };

  // Packing handlers
  const handleAddPackingItem = (itemData: Omit<PackingItem, 'id' | 'tripId'>) => {
    const newItem: PackingItem = {
      ...itemData,
      id: `packing-${Date.now()}`,
      tripId: tripData.trip.id,
    };
    updateData((prev) => ({
      ...prev,
      packingItems: [...prev.packingItems, newItem],
    }));
    syncTripItem('packing', 'insert', newItem);
  };

  const handleTogglePacked = (id: string) => {
    updateData((prev) => {
      const updated = prev.packingItems.map((p) =>
        p.id === id ? { ...p, isPacked: !p.isPacked } : p
      );
      const item = updated.find((p) => p.id === id);
      if (item) syncTripItem('packing', 'update', item);
      return { ...prev, packingItems: updated };
    });
  };

  const handleDeletePackingItem = (id: string) => {
    updateData((prev) => ({
      ...prev,
      packingItems: prev.packingItems.filter((p) => p.id !== id),
    }));
    syncTripItem('packing', 'delete', { id });
  };

  // Task handlers
  const handleAddTask = (taskData: Omit<TripTask, 'id' | 'tripId'>) => {
    const newTask: TripTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      tripId: tripData.trip.id,
    };
    updateData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    syncTripItem('task', 'insert', newTask);
  };

  const handleUpdateTask = (id: string, changes: Partial<Omit<TripTask, 'id' | 'tripId'>>) => {
    updateData((prev) => {
      const updated = prev.tasks.map((t) => (t.id === id ? { ...t, ...changes } : t));
      syncTripItem('task', 'update', updated.find((t) => t.id === id));
      return { ...prev, tasks: updated };
    });
  };

  // Marks a destination as not needing a hotel (or brings it back)
  const handleToggleNoHotel = (stopId: string) => {
    updateData((prev) => {
      const current = prev.trip.noHotelStops ?? [];
      const noHotelStops = current.includes(stopId) ? current.filter((s) => s !== stopId) : [...current, stopId];
      const trip = { ...prev.trip, noHotelStops };
      syncTripItem('trip', 'update', trip);
      return { ...prev, trip };
    });
  };

  const handleToggleTask = (id: string) => {
    updateData((prev) => {
      const target = prev.tasks.find((t) => t.id === id);
      if (!target) return prev;
      // A task cannot be completed while something it depends on is still open
      if (!target.isDone && getBlockingTasks(target, prev.tasks).length > 0) return prev;

      const updated = prev.tasks.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t));
      syncTripItem('task', 'update', updated.find((t) => t.id === id));
      return { ...prev, tasks: updated };
    });
  };

  const handleDeleteTask = (id: string) => {
    updateData((prev) => {
      // Tasks that waited for the deleted one are released from it
      const tasks = prev.tasks
        .filter((t) => t.id !== id)
        .map((t) => {
          if (!t.dependsOn.includes(id)) return t;
          const released = { ...t, dependsOn: t.dependsOn.filter((d) => d !== id) };
          syncTripItem('task', 'update', released);
          return released;
        });
      return { ...prev, tasks };
    });
    syncTripItem('task', 'delete', { id });
  };

  // AI Function Calling execution dispatcher
  const handleApplyAiAction = (actionName: string, args: any) => {
    console.log('Executing AI Action:', actionName, args);

    switch (actionName) {
      case 'add_activity': {
        // The place is what matters; a day is saved only when it was explicitly given
        const act: Omit<Activity, 'id' | 'tripId'> = {
          stopId: routeStops.some((s) => s.id === args.stopId)
            ? args.stopId
            : args.activityDate
              ? stopForDate(args.activityDate)?.id
              : undefined,
          activityDate: args.activityDate || undefined,
          title: args.title,
          timeSlot: args.timeSlot || undefined,
          location: args.location,
          category: (args.category || 'sightseeing') as any,
          cost: Number(args.cost || 0),
          description: args.description,
          status: 'planned',
        };
        handleAddActivity(act);
        break;
      }

      case 'update_activity': {
        const match = findItem(tripData.activities, args, (a) => a.title, (a) => a.activityDate ?? '', 'currentDate');
        if (match) {
          handleUpdateActivity(
            match.id,
            pick(args, ['stopId', 'activityDate', 'timeSlot', 'location', 'category', 'description', 'status'], args.newTitle, 'title', { cost: args.cost })
          );
        }
        break;
      }

      case 'delete_activity': {
        const match = findItem(tripData.activities, args, (a) => a.title, (a) => a.activityDate ?? '', 'activityDate');
        if (match) handleDeleteActivity(match.id);
        break;
      }

      case 'update_flight': {
        const match = findItem(tripData.flights, args, flightLabel);
        if (match) {
          handleUpdateFlight(
            match.id,
            pick(args, ['airline', 'departureAirport', 'arrivalAirport', 'departureTime', 'arrivalTime', 'confirmationCode', 'seat', 'notes'], args.newFlightNumber, 'flightNumber', { price: args.price })
          );
        }
        break;
      }

      case 'delete_flight': {
        const match = findItem(tripData.flights, args, flightLabel);
        if (match) handleDeleteFlight(match.id);
        break;
      }

      case 'update_lodging': {
        const match = findItem(tripData.lodgings, args, (l) => l.name);
        if (match) {
          handleUpdateLodging(
            match.id,
            pick(args, ['type', 'address', 'checkInDate', 'checkOutDate', 'confirmationCode', 'notes', 'contactPhone', 'bookingUrl'], args.newName, 'name', { price: args.price })
          );
        }
        break;
      }

      case 'delete_lodging': {
        const match = findItem(tripData.lodgings, args, (l) => l.name);
        if (match) handleDeleteLodging(match.id);
        break;
      }

      case 'add_flight': {
        const flight: Omit<Flight, 'id' | 'tripId'> = {
          airline: args.airline || 'טיסה',
          flightNumber: args.flightNumber || 'FL100',
          departureAirport: args.departureAirport || 'TLV',
          arrivalAirport: args.arrivalAirport || tripData.trip.destination,
          departureTime: args.departureTime || `${tripData.trip.startDate}T08:00:00`,
          arrivalTime: args.arrivalTime || `${tripData.trip.startDate}T12:00:00`,
          confirmationCode: args.confirmationCode,
          seat: args.seat,
          price: Number(args.price || 0),
          notes: args.notes,
        };
        handleAddFlight(flight);
        break;
      }

      case 'add_lodging': {
        const lodging: Omit<Lodging, 'id' | 'tripId'> = {
          name: args.name,
          type: (args.type || 'hotel') as any,
          address: args.address || tripData.trip.destination,
          checkInDate: args.checkInDate || tripData.trip.startDate,
          checkOutDate: args.checkOutDate || tripData.trip.endDate,
          confirmationCode: args.confirmationCode,
          price: Number(args.price || 0),
          notes: args.notes,
        };
        handleAddLodging(lodging);
        break;
      }

      case 'add_budget_item': {
        const item: Omit<BudgetItem, 'id' | 'tripId'> = {
          title: args.title,
          category: (args.category || 'general') as any,
          estimatedCost: Number(args.estimatedCost || args.actualCost || 0),
          actualCost: Number(args.actualCost || args.estimatedCost || 0),
          currency: 'ILS',
          paidBy: (args.paidBy || 'משותף') as any,
        };
        handleAddBudgetItem(item);
        break;
      }

      case 'add_packing_item': {
        const item: Omit<PackingItem, 'id' | 'tripId'> = {
          title: args.title,
          category: (args.category || 'שונות') as any,
          assignedTo: (args.assignedTo || 'שנינו') as any,
          isPacked: false,
        };
        handleAddPackingItem(item);
        break;
      }

      case 'toggle_packing_item': {
        const match = tripData.packingItems.find((p) =>
          p.title.toLowerCase().includes(args.title.toLowerCase())
        );
        if (match) {
          updateData((prev) => {
            const updated = prev.packingItems.map((p) =>
              p.id === match.id ? { ...p, isPacked: Boolean(args.isPacked) } : p
            );
            return { ...prev, packingItems: updated };
          });
        }
        break;
      }

      case 'update_trip_info': {
        updateData((prev) => {
          const updatedTrip = {
            ...prev.trip,
            title: args.title || prev.trip.title,
            destination: args.destination || prev.trip.destination,
            startDate: args.startDate || prev.trip.startDate,
            endDate: args.endDate || prev.trip.endDate,
            notes: args.notes || prev.trip.notes,
          };
          syncTripItem('trip', 'update', updatedTrip);
          return { ...prev, trip: updatedTrip };
        });
        break;
      }
    }
  };

  const handleOpenAiWithPrompt = (prompt: string) => {
    setChatInitialPrompt(prompt);
    setIsAiDrawerOpen(true);
  };

  const pendingPackingCount = tripData.packingItems.filter((i) => !i.isPacked).length;
  const pendingTasksCount = tripData.tasks.filter((t) => !t.isDone).length;

  // Until the saved data is loaded, tripData is only the built-in plan: never show it
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-stone-500" role="status">
        טוענים את הטיול…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header
        trip={tripData.trip}
        lodgings={tripData.lodgings}
        isCloudConnected={isSupabaseConfigured}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenAiChat={() => setIsAiDrawerOpen(true)}
      />

      {/* Tabs Navigation */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab === 'chat') {
            setIsAiDrawerOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        packingPendingCount={pendingPackingCount}
        tasksPendingCount={pendingTasksCount}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 pt-6 md:pt-8 pb-28 md:pb-12 flex-1">
        <DueRemindersBanner tasks={tripData.tasks} onOpenTasks={() => setActiveTab('tasks')} />

        {activeTab === 'timeline' && (
          <TimelineTab
            activities={tripData.activities}
            flights={tripData.flights}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
            onToggleStatus={handleToggleActivityStatus}
            onOpenAiChatWithPrompt={handleOpenAiWithPrompt}
          />
        )}

        {activeTab === 'flights' && (
          <FlightsTab
            flights={tripData.flights}
            tripId={tripData.trip.id}
            onAddFlight={handleAddFlight}
            onUpdateFlight={handleUpdateFlight}
            onDeleteFlight={handleDeleteFlight}
            onOpenAiChatWithPrompt={handleOpenAiWithPrompt}
          />
        )}

        {activeTab === 'lodgings' && (
          <LodgingsTab
            lodgings={tripData.lodgings}
            noHotelStops={tripData.trip.noHotelStops ?? []}
            onToggleNoHotel={handleToggleNoHotel}
            onAddLodging={handleAddLodging}
            onUpdateLodging={handleUpdateLodging}
            onDeleteLodging={handleDeleteLodging}
            onOpenAiChatWithPrompt={handleOpenAiWithPrompt}
          />
        )}

        {activeTab === 'map' && (
          <MapTab
            lodgings={tripData.lodgings}
            noHotelStops={tripData.trip.noHotelStops ?? []}
            activities={tripData.activities}
            onAddActivity={handleAddActivity}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTab
            budgetItems={tripData.budgetItems}
            onAddBudgetItem={handleAddBudgetItem}
            onDeleteBudgetItem={handleDeleteBudgetItem}
            onOpenAiChatWithPrompt={handleOpenAiWithPrompt}
          />
        )}

        {activeTab === 'packing' && (
          <PackingTab
            packingItems={tripData.packingItems}
            onAddPackingItem={handleAddPackingItem}
            onTogglePacked={handleTogglePacked}
            onDeletePackingItem={handleDeletePackingItem}
            onOpenAiChatWithPrompt={handleOpenAiWithPrompt}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            tasks={tripData.tasks}
            tripStart={tripData.trip.startDate}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>

      {/* AI Assistant Drawer Modal */}
      <AiChatDrawer
        tripData={tripData}
        onApplyAction={handleApplyAiAction}
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        initialPrompt={chatInitialPrompt}
      />

      {/* Cloud Sync Setup Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />
    </div>
  );
}
