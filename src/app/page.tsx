'use client';

import React, { useState, useEffect } from 'react';
import { TripFullData, Activity, Flight, Lodging, BudgetItem, PackingItem } from '../types/trip';
import { loadTripData, saveLocalTripData, syncTripItem, isSupabaseConfigured } from '../lib/supabase';
import { initialTripData } from '../lib/mockData';
import { Header } from '../components/Header';
import { Navigation, TabType } from '../components/Navigation';
import { TimelineTab } from '../components/TimelineTab';
import { FlightsTab } from '../components/FlightsTab';
import { LodgingsTab } from '../components/LodgingsTab';
import { BudgetTab } from '../components/BudgetTab';
import { PackingTab } from '../components/PackingTab';
import { AiChatDrawer } from '../components/AiChatDrawer';
import { CloudSyncModal } from '../components/CloudSyncModal';

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

  // AI Function Calling execution dispatcher
  const handleApplyAiAction = (actionName: string, args: any) => {
    console.log('Executing AI Action:', actionName, args);

    switch (actionName) {
      case 'add_activity': {
        const act: Omit<Activity, 'id' | 'tripId'> = {
          activityDate: args.activityDate || tripData.trip.startDate,
          title: args.title,
          timeSlot: args.timeSlot || '12:00',
          location: args.location,
          category: (args.category || 'sightseeing') as any,
          cost: Number(args.cost || 0),
          description: args.description,
          status: 'planned',
        };
        handleAddActivity(act);
        break;
      }

      case 'delete_activity': {
        const match = tripData.activities.find((a) =>
          a.title.toLowerCase().includes(args.title.toLowerCase())
        );
        if (match) {
          handleDeleteActivity(match.id);
        }
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header
        trip={tripData.trip}
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
      />

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 pt-6 md:pt-8 pb-28 md:pb-12 flex-1">
        {activeTab === 'timeline' && (
          <TimelineTab
            trip={tripData.trip}
            activities={tripData.activities}
            onAddActivity={handleAddActivity}
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
            onDeleteFlight={handleDeleteFlight}
            onOpenAiChatWithPrompt={handleOpenAiWithPrompt}
          />
        )}

        {activeTab === 'lodgings' && (
          <LodgingsTab
            lodgings={tripData.lodgings}
            onAddLodging={handleAddLodging}
            onDeleteLodging={handleDeleteLodging}
            onOpenAiChatWithPrompt={handleOpenAiWithPrompt}
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
