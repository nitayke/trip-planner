'use client';

import React, { useState } from 'react';
import { Flight } from '../types/trip';
import { Plane, Plus, Trash2, Pencil, Ticket, ShieldCheck } from 'lucide-react';

interface FlightsTabProps {
  flights: Flight[];
  tripId: string;
  onAddFlight: (flight: Omit<Flight, 'id' | 'tripId'>) => void;
  onUpdateFlight: (id: string, flight: Omit<Flight, 'id' | 'tripId'>) => void;
  onDeleteFlight: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function FlightsTab({
  flights,
  onAddFlight,
  onUpdateFlight,
  onDeleteFlight,
  onOpenAiChatWithPrompt,
}: FlightsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureAirport, setDepartureAirport] = useState('נתב״ג טרמינל 3 (TLV)');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [seat, setSeat] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!airline.trim() || !flightNumber.trim()) return;

    const data = {
      airline: airline.trim(),
      flightNumber: flightNumber.trim().toUpperCase(),
      departureAirport: departureAirport.trim(),
      arrivalAirport: arrivalAirport.trim(),
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      confirmationCode: confirmationCode.trim().toUpperCase() || undefined,
      seat: seat.trim() || undefined,
      price: price ? Number(price) : 0,
      notes: notes.trim() || undefined,
    };
    if (editingId) onUpdateFlight(editingId, data);
    else onAddFlight(data);

    setAirline('');
    setFlightNumber('');
    setArrivalAirport('');
    setDepartureTime('');
    setArrivalTime('');
    setConfirmationCode('');
    setSeat('');
    setPrice('');
    setNotes('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const startEdit = (f: Flight) => {
    setEditingId(f.id);
    setAirline(f.airline);
    setFlightNumber(f.flightNumber);
    setDepartureAirport(f.departureAirport);
    setArrivalAirport(f.arrivalAirport);
    setDepartureTime(f.departureTime.slice(0, 16));
    setArrivalTime(f.arrivalTime.slice(0, 16));
    setConfirmationCode(f.confirmationCode ?? '');
    setSeat(f.seat ?? '');
    setPrice(f.price ? String(f.price) : '');
    setNotes(f.notes ?? '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  const formatDateTime = (dtStr: string) => {
    try {
      const d = new Date(dtStr);
      return new Intl.DateTimeFormat('he-IL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dtStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Plane className="w-5 h-5 text-teal-600 rotate-45" />
            <span>טיסות ונסיעות ({flights.length})</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            כל פרטי הטיסות, מספרי כרטיס, מקומות ישיבה וזמני המראה ונחיתה
          </p>
        </div>

        <button
          onClick={() => (showAddForm ? closeForm() : setShowAddForm(true))}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת טיסה'}</span>
        </button>
      </div>

      {/* Add Flight Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-4 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-teal-600" />
            <span>{editingId ? 'עריכת פרטי טיסה' : 'הוספת פרטי טיסה'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">חברת תעופה *</label>
              <input
                type="text"
                required
                placeholder="אל על / Ryanair / Wizz"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מספר טיסה *</label>
              <input
                type="text"
                required
                placeholder="LY385"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">קוד הזמנה (PNR)</label>
              <input
                type="text"
                placeholder="6 אותיות / מספרים"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">שדה המראה *</label>
              <input
                type="text"
                required
                placeholder="TLV נתב״ג טרמינל 3"
                value={departureAirport}
                onChange={(e) => setDepartureAirport(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">שדה נחיתה *</label>
              <input
                type="text"
                required
                placeholder="FCO רומא פיומיצ׳ינו"
                value={arrivalAirport}
                onChange={(e) => setArrivalAirport(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">זמן המראה *</label>
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">זמן נחיתה *</label>
              <input
                type="datetime-local"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מקומות ישיבה</label>
              <input
                type="text"
                placeholder="למשל: 14A, 14B"
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מחיר כולל (בש״ח)</label>
              <input
                type="number"
                placeholder="1850"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-stone-600 mb-1">הערות כבודה או צ׳ק אין</label>
              <input
                type="text"
                placeholder="כולל מזוודות 23 ק״ג, טרולי 8 ק״ג"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              {editingId ? 'עדכן טיסה' : 'שמור טיסה'}
            </button>
          </div>
        </form>
      )}

      {/* Flight Cards List */}
      {flights.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center">
          <Plane className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-700">עדיין אין טיסות ברשימה</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            הוסיפו טיסה ידנית או בקשו מה-AI בצ׳אט (למשל: ״תוסיף טיסה למנילה ב-20 בדצמבר״)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {flights.map((f) => (
            <div
              key={f.id}
              className="relative bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
            >
              {/* Boarding Pass Top Strip */}
              <div className="bg-gradient-to-l from-teal-800 via-teal-700 to-emerald-700 text-white px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-amber-300 -rotate-45" />
                  </div>
                  <span className="font-bold text-sm tracking-wide">{f.airline}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono font-bold tracking-wider">
                    {f.flightNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {f.confirmationCode && (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-200 bg-black/20 px-3 py-1 rounded-full border border-white/15">
                      <Ticket className="w-3.5 h-3.5 text-amber-300" />
                      <span>PNR: {f.confirmationCode}</span>
                    </span>
                  )}
                  <button
                    onClick={() => startEdit(f)}
                    title="ערוך טיסה"
                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteFlight(f.id)}
                    title="מחק טיסה"
                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Route Section */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-center sm:text-right">
                  {/* Departure */}
                  <div className="sm:text-right">
                    <span className="inline-block text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md mb-1">
                      המראה
                    </span>
                    <p className="font-display text-xl text-stone-900">{f.departureAirport}</p>
                    <p className="text-xs font-semibold text-stone-500 mt-1">
                      {formatDateTime(f.departureTime)}
                    </p>
                  </div>

                  {/* Flight Path Graphic */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 w-full max-w-[180px]">
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-teal-600 bg-white shrink-0" />
                      <div className="h-0.5 flex-1 border-b-2 border-dashed border-stone-300" />
                      <div className="p-2 rounded-full bg-amber-50 border border-amber-200 text-amber-600 shadow-2xs">
                        <Plane className="w-4 h-4 rotate-180" />
                      </div>
                      <div className="h-0.5 flex-1 border-b-2 border-dashed border-stone-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                    </div>
                    {f.seat && (
                      <span className="text-xs font-medium text-stone-500 mt-2 bg-stone-100 px-3 py-0.5 rounded-full">
                        מושבים: <strong className="text-stone-800">{f.seat}</strong>
                      </span>
                    )}
                  </div>

                  {/* Arrival */}
                  <div className="sm:text-left">
                    <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md mb-1">
                      נחיתה
                    </span>
                    <p className="font-display text-xl text-stone-900">{f.arrivalAirport}</p>
                    <p className="text-xs font-semibold text-stone-500 mt-1">
                      {formatDateTime(f.arrivalTime)}
                    </p>
                  </div>
                </div>

                {/* Perforated Tear Line & Stub */}
                {(f.notes || (f.price && f.price > 0)) && (
                  <div className="relative mt-5 pt-4 border-t-2 border-dashed border-stone-200 flex items-center justify-between text-xs text-stone-600 flex-wrap gap-2">
                    <span className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-[#f7f4ee] border border-stone-200/80" />
                    <span className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-[#f7f4ee] border border-stone-200/80" />
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{f.notes || 'כבודה מאושרת'}</span>
                    </div>
                    {f.price && f.price > 0 ? (
                      <span className="font-bold text-stone-900 bg-stone-100 px-3 py-1 rounded-full">
                        ₪{f.price.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
