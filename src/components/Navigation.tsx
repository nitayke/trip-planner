'use client';

import React from 'react';
import { Calendar, Plane, Hotel, Wallet, Luggage, ListChecks, Sparkles, Map } from 'lucide-react';

export type TabType = 'timeline' | 'flights' | 'lodgings' | 'budget' | 'packing' | 'tasks' | 'map' | 'chat';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  packingPendingCount?: number;
  tasksPendingCount?: number;
}

export function Navigation({ activeTab, onChangeTab, packingPendingCount = 0, tasksPendingCount = 0 }: NavigationProps) {
  const tabs = [
    { id: 'timeline' as TabType, label: 'מסלול', icon: Calendar },
    { id: 'flights' as TabType, label: 'טיסות', icon: Plane },
    { id: 'lodgings' as TabType, label: 'לינה', icon: Hotel },
    { id: 'map' as TabType, label: 'מפה', icon: Map },
    { id: 'budget' as TabType, label: 'תקציב', icon: Wallet },
    {
      id: 'packing' as TabType,
      label: 'אריזה',
      icon: Luggage,
      badge: packingPendingCount > 0 ? packingPendingCount : undefined,
    },
    {
      id: 'tasks' as TabType,
      label: 'משימות',
      icon: ListChecks,
      badge: tasksPendingCount > 0 ? tasksPendingCount : undefined,
    },
  ];

  return (
    <>
      {/* Desktop: floating pill bar that overlaps the hero edge */}
      <nav className="sticky top-3 z-30 -mt-6 hidden md:block">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-1 rounded-2xl border border-stone-200/70 bg-white/80 p-1.5 shadow-lg shadow-stone-900/5 backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-md shadow-teal-900/20'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`rounded-full px-1.5 text-[11px] font-bold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => onChangeTab('chat')}
              className="mr-auto flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-bold text-stone-900 shadow-md shadow-amber-500/20 transition hover:brightness-105"
            >
              <Sparkles className="h-4 w-4" />
              <span>שאלו את ה-AI</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile: floating bottom dock */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 px-3 md:hidden">
        <div className="mx-auto mb-2 grid max-w-md grid-cols-8 items-center rounded-2xl border border-stone-200/70 bg-white/90 p-1 shadow-xl shadow-stone-900/10 backdrop-blur-md">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] transition ${
                  isActive ? 'bg-teal-50 font-bold text-teal-800' : 'text-stone-500'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="absolute top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => onChangeTab('chat')}
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-stone-900 shadow-md shadow-amber-500/30"
            aria-label="עוזר AI"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}
