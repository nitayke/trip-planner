'use client';

import React, { useState, useMemo } from 'react';
import { Activity, Trip } from '../types/trip';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Utensils, 
  Camera, 
  Compass, 
  Coffee, 
  Car, 
  ShoppingBag, 
  CheckCircle2, 
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface TimelineTabProps {
  trip: Trip;
  activities: Activity[];
  onAddActivity: (act: Omit<Activity, 'id' | 'tripId'>) => void;
  onDeleteActivity: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function TimelineTab({
  trip,
  activities,
  onAddActivity,
  onDeleteActivity,
  onToggleStatus,
  onOpenAiChatWithPrompt,
}: TimelineTabProps) {
  // Generate list of days between startDate and endDate
  const daysList = useMemo(() => {
    const list: string[] = [];
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const current = new Date(start);

      while (current <= end) {
        list.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    } catch {
      list.push(trip.startDate);
    }
    return list.length > 0 ? list : [trip.startDate];
  }, [trip.startDate, trip.endDate]);

  const [selectedDate, setSelectedDate] = useState<string>(daysList[0] || trip.startDate);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<Activity['category']>('sightseeing');
  const [newCost, setNewCost] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Filter activities for selected date
  const currentDayActivities = useMemo(() => {
    return activities
      .filter((a) => a.activityDate === selectedDate)
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }, [activities, selectedDate]);

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddActivity({
      activityDate: selectedDate,
      title: newTitle.trim(),
      timeSlot: newTime.trim() || undefined,
      location: newLocation.trim() || undefined,
      category: newCategory,
      cost: newCost ? Number(newCost) : 0,
      description: newDescription.trim() || undefined,
      status: 'planned',
      orderIndex: currentDayActivities.length + 1,
    });

    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
    setNewCost('');
    setShowAddForm(false);
  };

  const getCategoryIcon = (category: Activity['category']) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'sightseeing':
      case 'attraction':
        return <Camera className="w-4 h-4 text-blue-500" />;
      case 'transport':
        return <Car className="w-4 h-4 text-emerald-500" />;
      case 'relaxation':
        return <Coffee className="w-4 h-4 text-purple-500" />;
      case 'shopping':
        return <ShoppingBag className="w-4 h-4 text-pink-500" />;
      default:
        return <Compass className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getCategoryLabel = (category: Activity['category']) => {
    switch (category) {
      case 'food': return 'אוכל ומסעדות';
      case 'sightseeing': return 'סיורים ואתרים';
      case 'attraction': return 'אטרקציה';
      case 'transport': return 'נסיעות והתניידות';
      case 'relaxation': return 'מנוחה ופנאי';
      case 'shopping': return 'קניות ומזכרות';
      default: return 'כללי';
    }
  };

  // Format date in Hebrew e.g. "יום ראשון, 10 במאי"
  const formatHebrewDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('he-IL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const dayIndex = daysList.indexOf(selectedDate) + 1;

  return (
    <div className="space-y-6">
      {/* Date Carousel / Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>לוח הימים של הטיול ({daysList.length} ימים)</span>
          </div>
          <button
            onClick={() => onOpenAiChatWithPrompt(`המלץ לי על פעילויות מעניינות ליום ${dayIndex} בתאריך ${selectedDate}`)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>הצעות AI ליום זה</span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {daysList.map((dateStr, idx) => {
            const isSelected = dateStr === selectedDate;
            const count = activities.filter((a) => a.activityDate === dateStr).length;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <span className={`text-[11px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  יום {idx + 1}
                </span>
                <span className="text-xs font-bold whitespace-nowrap mt-0.5">
                  {formatHebrewDate(dateStr)}
                </span>
                {count > 0 && (
                  <span
                    className={`mt-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count} פעילויות
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Header & Add Activity Button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>יום {dayIndex}: {formatHebrewDate(selectedDate)}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentDayActivities.length === 0
              ? 'עדיין אין פעילויות מתוכננות ליום זה. אפשר להוסיף ידנית או לבקש מה-AI!'
              : `${currentDayActivities.length} פעילויות מתוכננות`}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת פעילות'}</span>
        </button>
      </div>

      {/* Add Activity Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateActivity}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2"
        >
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>הוספת פעילות חדשה ליום {formatHebrewDate(selectedDate)}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">שם הפעילות או המקום *</label>
              <input
                type="text"
                required
                placeholder="למשל: סיור בפנתיאון וגלידה"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">שעה / חלק ביום</label>
              <input
                type="text"
                placeholder="למשל: 10:00 או 'בוקר'"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">מיקום / כתובת</label>
              <input
                type="text"
                placeholder="למשל: Piazza della Rotonda"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">קטגוריה</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="sightseeing">סיורים ואתרים</option>
                <option value="food">אוכל ומסעדות</option>
                <option value="attraction">אטרקציה</option>
                <option value="transport">נסיעות והתניידות</option>
                <option value="relaxation">מנוחה ופנאי</option>
                <option value="shopping">קניות ומזכרות</option>
                <option value="other">אחר</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">עלות משוערת (בש״ח)</label>
              <input
                type="number"
                placeholder="0"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">הערות וטיפים</label>
              <input
                type="text"
                placeholder="כרטיסים מוזמנים מראש, להביא דרכונים"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              שמור פעילות
            </button>
          </div>
        </form>
      )}

      {/* Activities Timeline List */}
      <div className="space-y-3">
        {currentDayActivities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">אין פעילויות מתוכננות ליום זה</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              תוכלו ללחוץ על ״הוספת פעילות״ למעלה, או לפתוח את צ׳אט ה-AI ולבקש ממנו: 
              <br />
              <span className="italic text-blue-600">״תציע לנו תוכנית מושלמת ליום {dayIndex} ב{trip.destination}״</span>
            </p>
            <button
              onClick={() => onOpenAiChatWithPrompt(`תבנה לנו לוח זמנים מומלץ ליום ${dayIndex} ב${trip.destination}`)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>בקש המלצות מה-AI ליום זה</span>
            </button>
          </div>
        ) : (
          <div className="relative border-r-2 border-blue-200 mr-4 pr-6 space-y-4">
            {currentDayActivities.map((act) => {
              const isDone = act.status === 'completed';
              return (
                <div
                  key={act.id}
                  className={`group relative bg-white p-4 rounded-2xl border transition-all ${
                    isDone
                      ? 'border-emerald-200/80 bg-emerald-50/20 opacity-80'
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* Timeline bullet icon */}
                  <div
                    className={`absolute -right-[33px] top-4 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-colors ${
                      isDone ? 'border-emerald-500 bg-emerald-500' : 'border-blue-600'
                    }`}
                  >
                    {isDone && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {act.timeSlot && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                            <Clock className="w-3 h-3" />
                            {act.timeSlot}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                          {getCategoryIcon(act.category)}
                          {getCategoryLabel(act.category)}
                        </span>
                        {act.cost && act.cost > 0 ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            ₪{act.cost}
                          </span>
                        ) : null}
                      </div>

                      <h4
                        className={`text-base font-bold transition-all ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {act.title}
                      </h4>

                      {act.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{act.location}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline mr-1 text-[11px]"
                          >
                            (פתח במפה 🗺️)
                          </a>
                        </div>
                      )}

                      {act.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/80 p-2 rounded-xl">
                          {act.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons: Toggle complete / Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleStatus(act.id)}
                        title={isDone ? 'סמן כפעיל' : 'סמן כהושלם'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDone
                            ? 'text-emerald-600 hover:bg-emerald-100'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${isDone ? 'fill-emerald-100' : ''}`} />
                      </button>

                      <button
                        onClick={() => onDeleteActivity(act.id)}
                        title="מחק פעילות"
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
