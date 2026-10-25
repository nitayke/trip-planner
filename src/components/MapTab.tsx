'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, Lodging } from '../types/trip';
import { routeStops, lodgingForStop, stopForDate, formatDM, countryStyle } from '../lib/route';
import { lodgingCoords } from '../lib/tripLodgings';
import { Map as MapIcon, Search, MapPinPlus, X, Loader2 } from 'lucide-react';

interface MapTabProps {
  lodgings: Lodging[];
  activities: Activity[];
  defaultDate: string;
  onAddActivity: (activity: Omit<Activity, 'id' | 'tripId'>) => void;
}

type LayerKey = 'stops' | 'hotels' | 'transitions' | 'attractions';

const LAYERS: { id: LayerKey; label: string }[] = [
  { id: 'stops', label: 'יעדים' },
  { id: 'hotels', label: 'מלונות' },
  { id: 'transitions', label: 'מעברים' },
  { id: 'attractions', label: 'אטרקציות' },
];

const STATUS_COLOR = { booked: '#059669', partial: '#d97706', none: '#e11d48' } as const;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Pending {
  lat: number;
  lng: number;
  name: string;
}

export function MapTab({ lodgings, activities, defaultDate, onAddActivity }: MapTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupsRef = useRef<Record<LayerKey, L.LayerGroup> | null>(null);
  const pendingMarkerRef = useRef<L.Marker | null>(null);
  const addModeRef = useRef(false);

  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    stops: true,
    hotels: true,
    transitions: true,
    attractions: true,
  });
  const [addMode, setAddMode] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState<Activity['category']>('attraction');

  const stopStatuses = useMemo(
    () => routeStops.map((stop) => ({ stop, ...lodgingForStop(stop, lodgings) })),
    [lodgings]
  );
  const missingCount = stopStatuses.filter((s) => s.status !== 'booked').length;
  const mappedActivities = activities.filter((a) => a.lat !== undefined && a.lng !== undefined);
  const unmappedCount = activities.length - mappedActivities.length;

  // Create the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const groups = {
      transitions: L.layerGroup().addTo(map),
      hotels: L.layerGroup().addTo(map),
      stops: L.layerGroup().addTo(map),
      attractions: L.layerGroup().addTo(map),
    };
    groupsRef.current = groups;
    mapRef.current = map;

    const bounds = L.latLngBounds(routeStops.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.1));

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!addModeRef.current) return;
      setPending({ lat: e.latlng.lat, lng: e.latlng.lng, name: '' });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      groupsRef.current = null;
      pendingMarkerRef.current = null;
    };
  }, []);

  // Redraw everything when the data changes
  useEffect(() => {
    const groups = groupsRef.current;
    if (!groups) return;
    Object.values(groups).forEach((g) => g.clearLayers());

    // Transitions between consecutive destinations
    routeStops.forEach((stop, i) => {
      if (i === 0) return;
      const prev = routeStops[i - 1];
      const flight = stop.arriveBy === 'flight';
      const line = L.polyline(
        [
          [prev.lat, prev.lng],
          [stop.lat, stop.lng],
        ],
        flight
          ? { color: '#0284c7', weight: 3, dashArray: '8 8', opacity: 0.85 }
          : { color: '#0f766e', weight: 3, opacity: 0.85 }
      );
      line.bindTooltip(`${flight ? '✈️ טיסה' : '🚌 דרך היבשה'}: ${prev.name} ← ${stop.name}`, { sticky: true });
      line.addTo(groups.transitions);
    });

    // Destinations, colored by hotel status
    stopStatuses.forEach(({ stop, status, missingNights, lodgings: stopLodgings }, i) => {
      const color = STATUS_COLOR[status];
      const badge = status === 'booked' ? '' : `<span class="trip-pin-badge" style="background:${color}">🛏️</span>`;
      const icon = L.divIcon({
        className: 'trip-pin-wrap',
        html: `<div class="trip-pin ${status === 'none' ? 'trip-pin-pulse' : ''}" style="border-color:${color}">
                 <span class="trip-pin-emoji">${stop.emoji}</span><span class="trip-pin-num" style="background:${color}">${i + 1}</span>${badge}
               </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const hotelLine =
        status === 'none'
          ? `<div style="color:#e11d48;font-weight:700">🛏️ עדיין לא סגרתם מלון</div>`
          : status === 'partial'
            ? `<div style="color:#b45309;font-weight:700">🛏️ חסרים לילות: ${missingNights.map(formatDM).join(', ')}</div>`
            : '';
      const hotels = stopLodgings.map((l) => `<div>🏨 ${esc(l.name)}</div>`).join('');
      L.marker([stop.lat, stop.lng], { icon, zIndexOffset: 500 })
        .bindPopup(
          `<div dir="rtl" style="min-width:180px;line-height:1.5">
             <strong>${stop.emoji} ${esc(stop.name)}</strong> ${countryStyle[stop.country].flag}
             <div>${formatDM(stop.start)}–${formatDM(stop.end)}</div>${hotelLine}${hotels}
           </div>`
        )
        .addTo(groups.stops);
    });

    // Hotels
    lodgings.forEach((l) => {
      const known = lodgingCoords[l.id];
      const fallback = stopForDate(l.checkInDate);
      const pos = known ?? (fallback ? ([fallback.lat + 0.02, fallback.lng + 0.02] as [number, number]) : undefined);
      if (!pos) return;
      const icon = L.divIcon({
        className: 'trip-pin-wrap',
        html: `<div class="trip-hotel">🛏️</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(pos, { icon })
        .bindPopup(
          `<div dir="rtl" style="min-width:180px;line-height:1.5">
             <strong>🏨 ${esc(l.name)}</strong>
             <div>${formatDM(l.checkInDate)}–${formatDM(l.checkOutDate)}</div>
             ${l.bookingUrl ? `<a href="${esc(l.bookingUrl)}" target="_blank" rel="noopener noreferrer">פתיחה ב-Booking</a>` : ''}
           </div>`
        )
        .addTo(groups.hotels);
    });

    // Attractions with a saved location
    mappedActivities.forEach((a) => {
      const icon = L.divIcon({
        className: 'trip-pin-wrap',
        html: `<div class="trip-attraction">🎯</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([a.lat!, a.lng!], { icon })
        .bindPopup(
          `<div dir="rtl" style="min-width:160px;line-height:1.5"><strong>${esc(a.title)}</strong>
             <div>${formatDM(a.activityDate)}${a.location ? ` · ${esc(a.location)}` : ''}</div></div>`
        )
        .addTo(groups.attractions);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lodgings, activities, stopStatuses]);

  // Layer toggles
  useEffect(() => {
    const map = mapRef.current;
    const groups = groupsRef.current;
    if (!map || !groups) return;
    (Object.keys(groups) as LayerKey[]).forEach((key) => {
      if (visible[key]) groups[key].addTo(map);
      else map.removeLayer(groups[key]);
    });
  }, [visible]);

  // "Add attraction" mode: crosshair cursor and click handling
  useEffect(() => {
    addModeRef.current = addMode;
    const el = containerRef.current;
    if (el) el.style.cursor = addMode ? 'crosshair' : '';
  }, [addMode]);

  // Marker for the point being added
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pendingMarkerRef.current?.remove();
    pendingMarkerRef.current = null;
    if (!pending) return;
    pendingMarkerRef.current = L.marker([pending.lat, pending.lng], {
      icon: L.divIcon({
        className: 'trip-pin-wrap',
        html: `<div class="trip-attraction trip-pin-pulse">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).addTo(map);
  }, [pending]);

  const nearestStopDate = (lat: number, lng: number) => {
    let best = routeStops[0];
    let bestDist = Infinity;
    for (const s of routeStops) {
      const dist = (s.lat - lat) ** 2 + (s.lng - lng) ** 2;
      if (dist < bestDist) {
        best = s;
        bestDist = dist;
      }
    }
    return best.start;
  };

  const startPending = (p: Pending) => {
    setPending(p);
    setTitle(p.name.split(',')[0] ?? '');
    setDate(nearestStopDate(p.lat, p.lng));
    mapRef.current?.setView([p.lat, p.lng], Math.max(mapRef.current.getZoom(), 12));
  };

  // Pending point set by a click on the map
  useEffect(() => {
    if (pending && !title && !pending.name) setDate(nearestStopDate(pending.lat, pending.lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.lat, pending?.lng]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=he&q=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const data: GeoResult[] = await res.json();
      setResults(data);
      if (data.length === 0) setSearchError('לא נמצא מקום בשם הזה');
    } catch {
      setSearchError('החיפוש נכשל, אפשר גם ללחוץ על המפה במצב הוספה');
    } finally {
      setSearching(false);
    }
  };

  const cancelPending = () => {
    setPending(null);
    setTitle('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending || !title.trim()) return;
    onAddActivity({
      activityDate: date,
      title: title.trim(),
      location: pending.name || undefined,
      category,
      cost: 0,
      status: 'planned',
      lat: pending.lat,
      lng: pending.lng,
    });
    cancelPending();
    setQuery('');
    setResults([]);
    setAddMode(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-stone-800">
            <MapIcon className="h-5 w-5 text-teal-600" />
            <span>מפת הטיול</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            יעדים, מלונות, מעברים ואטרקציות. יעד באדום עדיין בלי מלון סגור
          </p>
        </div>

        <button
          onClick={() => {
            setAddMode((v) => !v);
            if (addMode) cancelPending();
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors ${
            addMode ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          <MapPinPlus className="h-4 w-4" />
          <span>{addMode ? 'סיום הוספה' : 'הוספת אטרקציה'}</span>
        </button>
      </div>

      {/* Layer toggles and legend */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => setVisible((v) => ({ ...v, [l.id]: !v[l.id] }))}
            aria-pressed={visible[l.id]}
            className={`rounded-xl border px-3 py-1.5 font-medium transition-colors ${
              visible[l.id]
                ? 'border-teal-600 bg-teal-600 text-white'
                : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50'
            }`}
          >
            {l.label}
          </button>
        ))}
        <span className="mr-auto flex flex-wrap items-center gap-3 text-stone-600">
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR.booked }} />
            מלון סגור
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR.partial }} />
            חסרים לילות
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR.none }} />
            אין מלון ({stopStatuses.filter((s) => s.status === 'none').length})
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-0.5 w-5 bg-teal-700" />
            יבשה
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-0 w-5 border-t-2 border-dashed border-sky-600" />
            טיסה
          </span>
        </span>
      </div>

      {addMode && (
        <div className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4">
          <p className="text-xs font-medium text-amber-900">
            לחצו על המפה כדי לסמן מקום, או חפשו אותו בשם:
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="למשל: Ban Gioc Waterfall"
              className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="flex items-center gap-1.5 rounded-xl bg-stone-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-900 disabled:opacity-60"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>חיפוש</span>
            </button>
          </form>
          {searchError && <p className="text-xs text-rose-700">{searchError}</p>}
          {results.length > 0 && (
            <ul className="divide-y divide-amber-200 overflow-hidden rounded-xl border border-amber-200 bg-white">
              {results.map((r) => (
                <li key={`${r.lat},${r.lon}`}>
                  <button
                    type="button"
                    onClick={() => {
                      startPending({ lat: Number(r.lat), lng: Number(r.lon), name: r.display_name });
                      setResults([]);
                    }}
                    className="w-full px-3 py-2 text-right text-xs text-stone-700 hover:bg-amber-50"
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pending && (
            <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 rounded-xl bg-white p-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-600">שם האטרקציה *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">תאריך</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">סוג</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Activity['category'])}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="attraction">אטרקציה</option>
                  <option value="sightseeing">סיור</option>
                  <option value="nature">טבע</option>
                  <option value="food">אוכל</option>
                  <option value="relaxation">רגיעה</option>
                  <option value="shopping">קניות</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 sm:col-span-4">
                <button
                  type="button"
                  onClick={cancelPending}
                  className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>ביטול</span>
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-700"
                >
                  שמירה במפה ובמסלול
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm" dir="ltr">
        <div ref={containerRef} className="h-[62vh] min-h-[380px] w-full bg-stone-100" />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-stone-500">
        <span>{mappedActivities.length} אטרקציות על המפה</span>
        {unmappedCount > 0 && <span>{unmappedCount} פעילויות במסלול עדיין בלי מיקום</span>}
        {missingCount > 0 && <span className="font-semibold text-rose-700">{missingCount} יעדים בלי מלון מלא</span>}
      </div>
    </div>
  );
}
