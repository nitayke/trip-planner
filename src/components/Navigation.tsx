'use client';

import React from 'react';
import { Calendar, Plane, Hotel, DollarSign, CheckSquare, Sparkles } from 'lucide-react';

export type TabType = 'timeline' | 'flights' | 'lodgings' | 'budget' | 'packing' | 'chat';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  packingPendingCount?: number;
}

export function Navigation({
  activeTab,
  onChangeTab,
  packingPendingCount = 0,
}: NavigationProps) {
  const tabs = [
    { id: 'timeline' as TabType, label: 'מסלול יומי', icon: Calendar },
    { id: 'flights' as TabType, label: 'טיסות', icon: Plane },
    { id: 'lodgings' as TabType, label: 'מלונות', icon: Hotel },
    { id: 'budget' as TabType, label: 'תקציב', icon: DollarSign },
    {
      id: 'packing' as TabType,
      label: 'רשימת ציוד',
      icon: CheckSquare,
      badge: packingPendingCount > 0 ? packingPendingCount : undefined,
    },
    { id: 'chat' as TabType, label: 'עוזר AI', icon: Sparkles, highlight: true },
  ];

  return (
    <>
      {/* Desktop Top Tabs Navigation */}
      <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center space-x-1 space-x-reverse py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : tab.highlight
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-amber-600 fill-amber-500' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 pb-safe">
        <div className="grid grid-cols-6 gap-0.5 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-blue-600 font-bold scale-105'
                    : tab.highlight
                    ? 'text-amber-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'stroke-[2.5px]' : tab.highlight ? 'stroke-[2.2px] fill-amber-400/30' : 'stroke-[1.8px]'
                    }`}
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] mt-0.5 leading-tight truncate w-full text-center">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
