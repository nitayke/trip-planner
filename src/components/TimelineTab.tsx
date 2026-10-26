'use client';

import React, { useState, useMemo } from 'react';
import { Activity, Flight } from '../types/trip';
import { routeStops, stopById, countryStyle, formatDM } from '../lib/route';
import { buildItinerary, flightsForStop, formatDuration, ItineraryItem } from '../lib/itinerary';
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
  Sparkles,
  Plane,
  Hourglass,
  Bus,
  Map as MapIcon,
} from 'lucide-react';

interface TimelineTabProps {
  activities: Activity[];
  flights: Flight[];
  onAddActivity: (act: Omit<Activity, 'id' | 'tripId'>) => void;
  onUpdateActivity: (id: string, changes: Partial<Omit<Activity, 'id' | 'tripId'>>) => void;
  onDeleteActivity: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

type View = 'places' | 'flights';

// Activities that belong to no place yet (old data, or a place that was removed from the route)
const NO_PLACE = 'none';

const formatHebrewDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'short' }).format(
      new Date(`${dateStr}T00:00:00`)
    );
  } catch {
    return dateStr;
  }
};

const timeOf = (iso: string) => iso.slice(11, 16);
const dateOf = (iso: string) => iso.slice(0, 10);

function FlightCard({ flight }: { flight: Flight }) {
  const crossesDay = dateOf(flight.arrivalTime) !== dateOf(flight.departureTime);
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4">
      <Plane className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-bold text-sky-900">
            {formatHebrewDate(dateOf(flight.departureTime))} · {timeOf(flight.departureTime)}
          </span>
          <span className="text-stone-500">
            {flight.airline} · {flight.flightNumber}
          </span>
        </div>
        <p className="text-sm font-bold text-stone-900">
          {flight.departureAirport} ← {flight.arrivalAirport}
        </p>
        <p className="text-xs text-stone-500">
          נחיתה {crossesDay ? `${formatHebrewDate(dateOf(flight.arrivalTime))} · ` : ''}
          {timeOf(flight.arrivalTime)}
          {flight.seat ? ` · מושבים ${flight.seat}` : ''}
        </p>
      </div>
    </div>
  );
}

function ItineraryRow({ item }: { item: ItineraryItem }) {
  if (item.kind === 'flight') return <FlightCard flight={item.flight} />;

  if (item.kind === 'layover') {
    const long = item.minutes >= 8 * 60;
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-xs ${
          long ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-stone-300 bg-stone-50 text-stone-600'
        }`}
      >
        <Hourglass className="h-4 w-4 shrink-0" />
        <span>
          <strong>מעבר ב{item.airport}</strong> · המתנה של {formatDuration(item.minutes)} ({timeOf(item.arrival)}–
          {timeOf(item.departure)})
          {long && ' · כדאי לתכנן איפה לבלות ואם לאסוף מזוודות'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 text-xs text-emerald-900">
      <Bus className="h-4 w-4 shrink-0" />
      <span>
        <strong>מעבר יבשתי</strong> · {item.from.name} ← {item.to.name} · {formatHebrewDate(item.date)} (שעה עוד לא נקבעה)
      </span>
    </div>
  );
}

export function TimelineTab({
  activities,
  flights,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onToggleStatus,
  onOpenAiChatWithPrompt,
}: TimelineTabProps) {
  const [view, setView] = useState<View>('places');
  const [selectedStopId, setSelectedStopId] = useState<string>(routeStops[0].id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formStopId, setFormStopId] = useState<string>(routeStops[0].id);
  const [newDate, setNewDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<Activity['category']>('sightseeing');
  const [newCost, setNewCost] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const placeOf = (a: Activity) => (a.stopId && stopById(a.stopId) ? a.stopId : NO_PLACE);
  const countFor = (placeId: string) => activities.filter((a) => placeOf(a) === placeId).length;
  const unplacedCount = countFor(NO_PLACE);

  const itinerary = useMemo(() => buildItinerary(flights), [flights]);

  const selectedStop = stopById(selectedStopId);

  // Days that were decided come first in date order; the rest keep the order they were added in
  const placeActivities = useMemo(() => {
    const inPlace = activities.filter((a) => placeOf(a) === selectedStopId);
    const dated = inPlace
      .filter((a) => a.activityDate)
      .sort((a, b) => a.activityDate!.localeCompare(b.activityDate!) || (a.timeSlot ?? '').localeCompare(b.timeSlot ?? ''));
    const undated = inPlace.filter((a) => !a.activityDate).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return [...undated, ...dated];
  }, [activities, selectedStopId]);

  const placeFlights = useMemo(() => (selectedStop ? flightsForStop(selectedStop, flights) : []), [selectedStop, flights]);

  const resetForm = () => {
    setNewDate('');
    setNewTitle('');
    setNewTime('');
    setNewLocation('');
    setNewCategory('sightseeing');
    setNewCost('');
    setNewDescription('');
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const fields = {
      stopId: formStopId === NO_PLACE ? undefined : formStopId,
      activityDate: newDate || undefined,
      title: newTitle.trim(),
      timeSlot: newTime.trim() || undefined,
      location: newLocation.trim() || undefined,
      category: newCategory,
      cost: newCost ? Number(newCost) : 0,
      description: newDescription.trim() || undefined,
    };
    if (editingId) {
      onUpdateActivity(editingId, fields);
    } else {
      onAddActivity({ ...fields, status: 'planned', orderIndex: placeActivities.length + 1 });
    }
    setSelectedStopId(formStopId);

    resetForm();
    setEditingId(null);
    setShowAddForm(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormStopId(selectedStopId);
    resetForm();
    setShowAddForm(true);
  };

  const startEdit = (a: Activity) => {
    setEditingId(a.id);
    setFormStopId(placeOf(a));
    setNewDate(a.activityDate ?? '');
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

  const placeName = selectedStop ? `${selectedStop.emoji} ${selectedStop.name}` : 'פעילויות בלי יעד';

  return (
    <div className="space-y-6">
      {/* View switch */}
      <div className="flex gap-1.5 text-xs font-semibold">
        {(
          [
            { id: 'places', label: 'לפי יעדים', icon: <MapIcon className="h-4 w-4" /> },
            { id: 'flights', label: 'טיסות ומעברים', icon: <Plane className="h-4 w-4" /> },
          ] as const
        ).map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-colors ${
              view === v.id
                ? 'bg-teal-700 text-white shadow-md shadow-teal-900/15'
                : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {v.icon}
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {view === 'flights' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">
            כל הטיסות בסדר כרונולוגי, עם זמני ההמתנה בין טיסות ממשיכות והמעברים היבשתיים במסלול. שעות הן שעון מקומי של שדה
            התעופה.
          </p>
          {itinerary.map((item, i) => (
            <ItineraryRow
              key={item.kind === 'flight' ? item.flight.id : `${item.kind}-${item.sortKey}-${i}`}
              item={item}
            />
          ))}
        </div>
      )}

      {view === 'places' && (
        <>
          {/* Place picker */}
          <div className="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-xs">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <MapPin className="h-4 w-4 text-teal-600" />
                {routeStops.length} יעדים
              </span>
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
              {routeStops.map((stop) => {
                const isSelected = stop.id === selectedStopId;
                const count = countFor(stop.id);
                const sky = stop.country === 'ph';
                return (
                  <button
                    key={stop.id}
                    onClick={() => setSelectedStopId(stop.id)}
                    className={`relative flex shrink-0 snap-start flex-col items-center rounded-xl border px-3 py-2 transition ${
                      isSelected
                        ? 'border-teal-700 bg-teal-700 text-white shadow-md shadow-teal-900/20'
                        : sky
                          ? 'border-sky-100 bg-sky-50/60 text-stone-700 hover:bg-sky-100'
                          : 'border-emerald-100 bg-emerald-50/60 text-stone-700 hover:bg-emerald-100'
                    } ${stop.tentative ? 'border-dashed' : ''}`}
                  >
                    <span className="text-lg">{stop.emoji}</span>
                    <span className="text-xs font-bold">{stop.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-stone-500'}`}>
                      {formatDM(stop.start)}–{formatDM(stop.end)}
                    </span>
                    {count > 0 && (
                      <span
                        className={`absolute top-1 left-1 min-w-4 rounded-full px-1 text-center text-[10px] font-bold ${
                          isSelected ? 'bg-amber-300 text-stone-900' : 'bg-teal-600 text-white'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
              {unplacedCount > 0 && (
                <button
                  onClick={() => setSelectedStopId(NO_PLACE)}
                  className={`relative flex shrink-0 snap-start flex-col items-center justify-center rounded-xl border border-dashed px-3 py-2 text-xs font-bold transition ${
                    selectedStopId === NO_PLACE
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>בלי יעד</span>
                  <span className="text-[10px] font-normal">{unplacedCount} פעילויות</span>
                </button>
              )}
            </div>
          </div>

          {/* Selected place header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {selectedStop && (
                <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                  <span>
                    {formatDM(selectedStop.start)}–{formatDM(selectedStop.end)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 ring-1 ${countryStyle[selectedStop.country].chip}`}>
                    {countryStyle[selectedStop.country].flag} {countryStyle[selectedStop.country].label}
                  </span>
                  {selectedStop.tentative && <span className="text-amber-700">עדיין לא סגור</span>}
                </div>
              )}
              <h2 className="font-display mt-1 text-2xl text-stone-900 sm:text-3xl">{placeName}</h2>
              <p className="mt-0.5 text-xs text-stone-500">
                {placeActivities.length === 0 ? 'אין עדיין אירועים ביעד הזה' : `${placeActivities.length} אירועים`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedStop && (
                <button
                  onClick={() => onOpenAiChatWithPrompt(`תציע פעילויות ב${selectedStop.name}`)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>רעיונות מה-AI</span>
                </button>
              )}
              <button
                onClick={() => (showAddForm ? closeForm() : startAdd())}
                className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-800"
              >
                <Plus className="h-4 w-4" />
                <span>{showAddForm ? 'ביטול' : 'הוספת אירוע'}</span>
              </button>
            </div>
          </div>

          {/* Flights that land or take off while at this place */}
          {placeFlights.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                <Plane className="h-4 w-4" />
                <span>טיסות ביעד הזה</span>
              </h3>
              {placeFlights.map((f) => (
                <FlightCard key={f.id} flight={f} />
              ))}
            </div>
          )}

          {/* Add / edit form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateActivity}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2"
            >
              <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-teal-600" />
                <span>{editingId ? 'עריכת אירוע' : 'הוספת אירוע חדש'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">יעד *</label>
                  <select
                    value={formStopId}
                    onChange={(e) => setFormStopId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {routeStops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.emoji} {s.name} ({formatDM(s.start)}–{formatDM(s.end)})
                      </option>
                    ))}
                    {editingId && <option value={NO_PLACE}>בלי יעד</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">שם האירוע או המקום *</label>
                  <input
                    type="text"
                    required
                    placeholder="למשל: טרק בעמק מואונג הואה"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">יום מסוים (רק אם כבר נקבע)</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">שעה / חלק ביום (אופציונלי)</label>
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
                    placeholder="למשל: Ban Gioc Waterfall"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">קטגוריה</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Activity['category'])}
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
                  {editingId ? 'עדכן אירוע' : 'שמור אירוע'}
                </button>
              </div>
            </form>
          )}

          {/* Activities of the place */}
          <div className="space-y-3">
            {placeActivities.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center">
                <Compass className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-stone-700">אין אירועים מתוכננים ליעד הזה</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  תוכלו ללחוץ על ״הוספת אירוע״ למעלה, או לבקש מצ׳אט ה-AI להציע פעילויות.
                </p>
                {selectedStop && (
                  <button
                    onClick={() => onOpenAiChatWithPrompt(`תבנה לנו רשימת פעילויות מומלצות ב${selectedStop.name}, בלי לקבוע ימים`)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium text-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>בקש המלצות מה-AI ליעד הזה</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="relative border-r-2 border-teal-600/25 mr-4 pr-6 space-y-4">
                {placeActivities.map((act) => {
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
                            {act.activityDate && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60">
                                {formatHebrewDate(act.activityDate)}
                              </span>
                            )}
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

                        {/* Action buttons: Toggle complete / Edit / Delete */}
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
                            title="ערוך אירוע"
                            className="p-2 text-stone-300 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteActivity(act.id)}
                            title="מחק אירוע"
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
        </>
      )}
    </div>
  );
}
