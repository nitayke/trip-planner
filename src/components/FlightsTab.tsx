'use client';

import React, { useState } from 'react';
import { Flight } from '../types/trip';
import { Plane, Plus, Trash2, ArrowLeft, Ticket, ShieldCheck } from 'lucide-react';

interface FlightsTabProps {
  flights: Flight[];
  tripId: string;
  onAddFlight: (flight: Omit<Flight, 'id' | 'tripId'>) => void;
  onDeleteFlight: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function FlightsTab({
  flights,
  onAddFlight,
  onDeleteFlight,
  onOpenAiChatWithPrompt,
}: FlightsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);

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

    onAddFlight({
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
    });

    setAirline('');
    setFlightNumber('');
    setArrivalAirport('');
    setDepartureTime('');
    setArrivalTime('');
    setConfirmationCode('');
    setSeat('');
    setPrice('');
    setNotes('');
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
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600 rotate-45" />
            <span>טיסות ונסיעות ({flights.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            כל פרטי הטיסות, מספרי כרטיס, מקומות ישיבה וזמני המראה ונחיתה
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת טיסה'}</span>
        </button>
      </div>

      {/* Add Flight Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-blue-600" />
            <span>הוספת פרטי טיסה</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">חברת תעופה *</label>
              <input
                type="text"
                required
                placeholder="אל על / Ryanair / Wizz"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">מספר טיסה *</label>
              <input
                type="text"
                required
                placeholder="LY385"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">קוד הזמנה (PNR)</label>
              <input
                type="text"
                placeholder="6 אותיות / מספרים"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">שדה המראה *</label>
              <input
                type="text"
                required
                placeholder="TLV נתב״ג טרמינל 3"
                value={departureAirport}
                onChange={(e) => setDepartureAirport(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">שדה נחיתה *</label>
              <input
                type="text"
                required
                placeholder="FCO רומא פיומיצ׳ינו"
                value={arrivalAirport}
                onChange={(e) => setArrivalAirport(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">זמן המראה *</label>
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">זמן נחיתה *</label>
              <input
                type="datetime-local"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">מקומות ישיבה</label>
              <input
                type="text"
                placeholder="למשל: 14A, 14B"
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">מחיר כולל (בש״ח)</label>
              <input
                type="number"
                placeholder="1850"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">הערות כבודה או צ׳ק אין</label>
              <input
                type="text"
                placeholder="כולל מזוודות 23 ק״ג, טרולי 8 ק״ג"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              שמור טיסה
            </button>
          </div>
        </form>
      )}

      {/* Flight Cards List */}
      {flights.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">עדיין אין טיסות ברשימה</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            הוסיפו טיסה ידנית או בקשו מה-AI בצ׳אט (למשל: ״תוסיף טיסת אל על לרומא ב-10 במאי״)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {flights.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Airline & Ticket Top Bar */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-blue-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-blue-900">{f.airline}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold tracking-wider">
                    {f.flightNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {f.confirmationCode && (
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      <Ticket className="w-3.5 h-3.5 text-blue-600" />
                      <span>{f.confirmationCode}</span>
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteFlight(f.id)}
                    title="מחק טיסה"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Flight Route & Timings */}
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-center sm:text-right">
                  {/* Departure */}
                  <div className="sm:text-right">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">המראה</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{f.departureAirport}</p>
                    <p className="text-xs font-medium text-blue-600 mt-0.5">
                      {formatDateTime(f.departureTime)}
                    </p>
                  </div>

                  {/* Flight Plane Icon & Arrow */}
                  <div className="flex flex-col items-center justify-center my-1 sm:my-0">
                    <div className="flex items-center gap-2 text-slate-300 w-full max-w-[140px]">
                      <div className="h-0.5 flex-1 bg-slate-200" />
                      <Plane className="w-5 h-5 text-blue-500 rotate-180" />
                      <div className="h-0.5 flex-1 bg-slate-200" />
                    </div>
                    {f.seat && (
                      <span className="text-[11px] font-medium text-slate-500 mt-1">
                        מושבים: <strong className="text-slate-800">{f.seat}</strong>
                      </span>
                    )}
                  </div>

                  {/* Arrival */}
                  <div className="sm:text-left">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">נחיתה</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{f.arrivalAirport}</p>
                    <p className="text-xs font-medium text-blue-600 mt-0.5">
                      {formatDateTime(f.arrivalTime)}
                    </p>
                  </div>
                </div>

                {/* Additional Notes or Baggage */}
                {(f.notes || (f.price && f.price > 0)) && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>{f.notes || 'כבודה מאושרת'}</span>
                    </div>
                    {f.price && f.price > 0 ? (
                      <span className="font-bold text-slate-800">
                        עלות: ₪{f.price.toLocaleString()}
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
