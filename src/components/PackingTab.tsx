'use client';

import React, { useState } from 'react';
import { PackingItem } from '../types/trip';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle, Sparkles, User, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PackingTabProps {
  packingItems: PackingItem[];
  onAddPackingItem: (item: Omit<PackingItem, 'id' | 'tripId'>) => void;
  onTogglePacked: (id: string) => void;
  onDeletePackingItem: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function PackingTab({
  packingItems,
  onAddPackingItem,
  onTogglePacked,
  onDeletePackingItem,
  onOpenAiChatWithPrompt,
}: PackingTabProps) {
  const [filterPerson, setFilterPerson] = useState<'all' | 'הוא' | 'היא' | 'שנינו'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PackingItem['category']>('בגדים');
  const [assignedTo, setAssignedTo] = useState<PackingItem['assignedTo']>('שנינו');

  const filteredItems = packingItems.filter((item) => {
    if (filterPerson === 'all') return true;
    return item.assignedTo === filterPerson;
  });

  const packedCount = packingItems.filter((i) => i.isPacked).length;
  const totalCount = packingItems.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const handleToggle = (id: string, currentlyPacked: boolean) => {
    onTogglePacked(id);
    if (!currentlyPacked && packedCount + 1 === totalCount && totalCount > 0) {
      // All items packed! Celebrate!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddPackingItem({
      title: title.trim(),
      category,
      assignedTo,
      isPacked: false,
    });

    setTitle('');
    setShowAddForm(false);
  };

  // Group filtered items by category
  const categories: PackingItem['category'][] = [
    'מסמכים וכרטיסים',
    'אלקטרוניקה',
    'בגדים',
    'רפואי וטואלטיקה',
    'שונות',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>רשימת ציוד ואריזה ({packedCount}/{totalCount})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            כל מה שצריך לקחת במזוודות, מסודר לפי קטגוריות ולפי מי שאחראי
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת פריט'}</span>
        </button>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span>התקדמות אריזה: {progressPercent}%</span>
          <span className="text-slate-500 font-normal">
            נארזו {packedCount} מתוך {totalCount} פריטים
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : progressPercent > 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {progressPercent === 100 && (
          <p className="text-xs text-emerald-600 font-bold mt-2 text-center animate-bounce">
            🎉 המזוודות מוכנות לגמרי! שתהיה טיסה נעימה! ✈️
          </p>
        )}
      </div>

      {/* Filter by Person Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterPerson('all')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterPerson === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>הכל ({totalCount})</span>
        </button>

        <button
          onClick={() => setFilterPerson('שנינו')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterPerson === 'שנינו'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>שנינו יחד</span>
        </button>

        <button
          onClick={() => setFilterPerson('הוא')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterPerson === 'הוא'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>עבורו</span>
        </button>

        <button
          onClick={() => setFilterPerson('היא')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterPerson === 'היא'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>עבורה</span>
        </button>

        <div className="mr-auto">
          <button
            onClick={() => onOpenAiChatWithPrompt('תציע רשימת פריטים חיוניים שאולי שכחנו לארוז לטיול')}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2.5 py-1.5 rounded-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>הצעות AI לרשימה</span>
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-3 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>הוספת פריט לאריזה</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">שם הפריט *</label>
              <input
                type="text"
                required
                placeholder="למשל: קרם הגנה, מברשת שיניים"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">קטגוריה</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="בגדים">בגדים</option>
                <option value="מסמכים וכרטיסים">מסמכים וכרטיסים</option>
                <option value="אלקטרוניקה">אלקטרוניקה</option>
                <option value="רפואי וטואלטיקה">רפואי וטואלטיקה</option>
                <option value="שונות">שונות</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">עבור מי?</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="שנינו">שנינו</option>
                <option value="הוא">הוא</option>
                <option value="היא">היא</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              הוסף פריט
            </button>
          </div>
        </form>
      )}

      {/* Categorized Items List */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catItems = filteredItems.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;

          return (
            <div key={cat} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-700 flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-slate-400 font-normal">
                  {catItems.filter((i) => i.isPacked).length}/{catItems.length} נארזו
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggle(item.id, item.isPacked)}
                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.isPacked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <div>
                        <span
                          className={`text-sm font-medium ${
                            item.isPacked ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="mr-2 text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 font-medium">
                          {item.assignedTo}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePackingItem(item.id);
                      }}
                      title="מחק פריט"
                      className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
