'use client';

import React, { useState, useMemo } from 'react';
import { Activity, Trip } from '../types/trip';
import { stopForDate, countryStyle } from '../lib/route';
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
  Pencil,
  Calendar,
  Sparkles
} from 'lucide-react';

interface TimelineTabProps {
  trip: Trip;
  activities: Activity[];
  onAddActivity: (act: Omit<Activity, 'id' | 'tripId'>) => void;
  onUpdateActivity: (id: string, changes: Partial<Omit<Activity, 'id' | 'tripId'>>) => void;
  onDeleteActivity: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function TimelineTab({
  trip,
  activities,
  onAddActivity,
  onUpdateActivity,
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(daysList[0] || trip.startDate);

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

    const fields = {
      activityDate: formDate,
      title: newTitle.trim(),
      timeSlot: newTime.trim() || undefined,
      location: newLocation.trim() || undefined,
      category: newCategory,
      cost: newCost ? Number(newCost) : 0,
      description: newDescription.trim() || undefined,
    };
    if (editingId) {
      onUpdateActivity(editingId, fields);
      setSelectedDate(formDate);
    } else {
      onAddActivity({ ...fields, status: 'planned', orderIndex: currentDayActivities.length + 1 });
    }

    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
    setNewCost('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormDate(selectedDate);
    setNewTitle('');
    setNewTime('10:00');
    setNewLocation('');
    setNewCategory('sightseeing');
    setNewCost('');
    setNewDescription('');
    setShowAddForm(true);
  };

  const startEdit = (a: Activity) => {
    setEditingId(a.id);
    setFormDate(a.activityDate);
    setNewTitle(a.title);
    setNewTime(a.timeSlot ?? '');
    setNewLocation(a.location ?? '');
    setNewCategory(a.category);
    setNewCost(a.cost ? String(a.cost) : '');
    setNewDescription(a.description ?? '');
    setShowAddForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  const getCategoryIcon = (category: Activity['category']) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'sightseeing':
      case 'attraction':
        return <Camera className="w-4 h-4 text-teal-500" />;
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
      {/* Day picker */}
      <div className="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-xs">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
            <Calendar className="h-4 w-4 text-teal-600" />
            <span>{daysList.length} ימים</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${countryStyle.vn.dot}`} />
              {countryStyle.vn.label}
            </span>
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${countryStyle.ph.dot}`} />
              {countryStyle.ph.label}
            </span>
          </div>
        </div>

        <div className="scrollbar-none flex snap-x gap-1.5 overflow-x-auto pb-1">
          {daysList.map((dateStr, idx) => {
            const isSelected = dateStr === selectedDate;
            const count = activities.filter((a) => a.activityDate === dateStr).length;
            const stop = stopForDate(dateStr);
            const prevStop = idx > 0 ? stopForDate(daysList[idx - 1]) : undefined;
            const isNewStop = stop && stop.id !== prevStop?.id;
            const accent = stop?.country === 'ph' ? 'sky' : stop ? 'emerald' : 'stone';
            return (
              <div key={dateStr} className="flex shrink-0 snap-start flex-col gap-1">
                <span
                  className={`h-4 truncate px-1 text-[10px] font-semibold ${
                    accent === 'sky' ? 'text-sky-700' : accent === 'emerald' ? 'text-emerald-700' : 'text-stone-400'
                  }`}
                >
                  {isNewStop ? `${stop.emoji} ${stop.name}` : ''}
                </span>
                <button
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative flex w-14 flex-col items-center rounded-xl border py-2 transition ${
                    isSelected
                      ? 'border-teal-700 bg-teal-700 text-white shadow-md shadow-teal-900/20'
                      : accent === 'sky'
                      ? 'border-sky-100 bg-sky-50/60 text-stone-700 hover:bg-sky-100'
                      : accent === 'emerald'
                      ? 'border-emerald-100 bg-emerald-50/60 text-stone-700 hover:bg-emerald-100'
                      : 'border-dashed border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-stone-400'}`}>
                    {new Intl.DateTimeFormat('he-IL', { weekday: 'short' }).format(new Date(dateStr))}
                  </span>
                  <span className="text-lg font-bold leading-tight">{Number(dateStr.slice(8, 10))}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-stone-500'}`}>
                    {new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(new Date(dateStr))}
                  </span>
                  {count > 0 && (
                    <span
                      className={`absolute top-1.5 left-1.5 h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-amber-300' : 'bg-teal-600'
                      }`}
                    />
                  )}
                </button>
                <span className="text-center text-[9px] text-stone-400">יום {idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day header */}
      {(() => {
        const stop = stopForDate(selectedDate);
        return (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                <span>יום {dayIndex}</span>
                <span>·</span>
                <span>{formatHebrewDate(selectedDate)}</span>
                {stop && (
                  <span className={`rounded-full px-2 py-0.5 ring-1 ${countryStyle[stop.country].chip}`}>
                    {countryStyle[stop.country].flag} {countryStyle[stop.country].label}
                  </span>
                )}
              </div>
              <h2 className="font-display mt-1 text-2xl text-stone-900 sm:text-3xl">
                {stop ? `${stop.emoji} ${stop.name}` : 'יום פתוח – עוד לא מתוכנן'}
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">
                {currentDayActivities.length === 0
                  ? 'אין עדיין פעילויות ליום הזה'
                  : `${currentDayActivities.length} פעילויות`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onOpenAiChatWithPrompt(
                    `תציע פעילויות ליום ${dayIndex} (${selectedDate})${stop ? ` ב${stop.name}` : ''}`
                  )
                }
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                <Sparkles className="h-4 w-4" />
                <span>רעיונות מה-AI</span>
              </button>
              <button
                onClick={() => (showAddForm ? closeForm() : startAdd())}
                className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-800"
              >
                <Plus className="h-4 w-4" />
                <span>{showAddForm ? 'ביטול' : 'הוספת פעילות'}</span>
              </button>
            </div>
          </div>
        );
      })()}
      {/* Add Activity Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateActivity}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2"
        >
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>{editingId ? 'עריכת פעילות' : `הוספת פעילות חדשה ליום ${formatHebrewDate(formDate)}`}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">תאריך</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">שם הפעילות או המקום *</label>
              <input
                type="text"
                required
                placeholder="למשל: סיור בפנתיאון וגלידה"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">שעה / חלק ביום</label>
              <input
                type="text"
                placeholder="למשל: 10:00 או 'בוקר'"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מיקום / כתובת</label>
              <input
                type="text"
                placeholder="למשל: Piazza della Rotonda"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">קטגוריה</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
              <label className="block text-xs font-medium text-stone-600 mb-1">עלות משוערת (בש״ח)</label>
              <input
                type="number"
                placeholder="0"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">הערות וטיפים</label>
              <input
                type="text"
                placeholder="כרטיסים מוזמנים מראש, להביא דרכונים"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-3.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
            >
              {editingId ? 'עדכן פעילות' : 'שמור פעילות'}
            </button>
          </div>
        </form>
      )}

      {/* Activities Timeline List */}
      <div className="space-y-3">
        {currentDayActivities.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center">
            <Compass className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-700">אין פעילויות מתוכננות ליום זה</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              תוכלו ללחוץ על ״הוספת פעילות״ למעלה, או לפתוח את צ׳אט ה-AI ולבקש ממנו: 
              <br />
              <span className="italic text-teal-600">״תציע לנו תוכנית מושלמת ליום {dayIndex} ב{trip.destination}״</span>
            </p>
            <button
              onClick={() => onOpenAiChatWithPrompt(`תבנה לנו לוח זמנים מומלץ ליום ${dayIndex} ב${trip.destination}`)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>בקש המלצות מה-AI ליום זה</span>
            </button>
          </div>
        ) : (
          <div className="relative border-r-2 border-teal-600/25 mr-4 pr-6 space-y-4">
            {currentDayActivities.map((act) => {
              const isDone = act.status === 'completed';
              return (
                <div
                  key={act.id}
                  className={`group relative bg-white p-5 rounded-2xl border transition-all duration-200 ${
                    isDone
                      ? 'border-emerald-200/80 bg-emerald-50/30 opacity-80'
                      : 'border-stone-200/80 hover:border-teal-400/70 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Timeline bullet icon */}
                  <div
                    className={`absolute -right-[33px] top-5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-colors shadow-2xs ${
                      isDone ? 'border-emerald-500 bg-emerald-500' : 'border-teal-600 group-hover:scale-110'
                    }`}
                  >
                    {isDone ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {act.timeSlot && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {act.timeSlot}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          {getCategoryIcon(act.category)}
                          {getCategoryLabel(act.category)}
                        </span>
                        {act.cost && act.cost > 0 ? (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                            ₪{act.cost}
                          </span>
                        ) : null}
                      </div>

                      <h4
                        className={`text-base sm:text-lg font-bold transition-all ${
                          isDone ? 'line-through text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {act.title}
                      </h4>

                      {act.location && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-medium text-stone-600">{act.location}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-teal-700 hover:text-teal-900 font-semibold hover:underline mr-1 text-[11px] bg-teal-50/70 px-2 py-0.5 rounded-full"
                          >
                            <span>מפה 🗺️</span>
                          </a>
                        </div>
                      )}

                      {act.description && (
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed bg-stone-50/90 p-3 rounded-xl border border-stone-100">
                          {act.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons: Toggle complete / Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleStatus(act.id)}
                        title={isDone ? 'סמן כפעיל' : 'סמן כהושלם'}
                        className={`p-2 rounded-xl transition-colors ${
                          isDone
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${isDone ? 'fill-emerald-100' : ''}`} />
                      </button>

                      <button
                        onClick={() => startEdit(act)}
                        title="ערוך פעילות"
                        className="p-2 text-stone-300 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteActivity(act.id)}
                        title="מחק פעילות"
                        className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
