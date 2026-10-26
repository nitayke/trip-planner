'use client';

import React, { useState } from 'react';
import { Lodging } from '../types/trip';
import { Hotel, Plus, Trash2, Pencil, MapPin, Phone, ExternalLink, Hash, BedDouble, X, Undo2 } from 'lucide-react';
import { routeStops, lodgingForStop, formatDM } from '../lib/route';

interface LodgingsTabProps {
  lodgings: Lodging[];
  noHotelStops: string[];
  onToggleNoHotel: (stopId: string) => void;
  onAddLodging: (lodging: Omit<Lodging, 'id' | 'tripId'>) => void;
  onUpdateLodging: (id: string, lodging: Omit<Lodging, 'id' | 'tripId'>) => void;
  onDeleteLodging: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function LodgingsTab({
  lodgings,
  noHotelStops,
  onToggleNoHotel,
  onAddLodging,
  onUpdateLodging,
  onDeleteLodging,
  onOpenAiChatWithPrompt,
}: LodgingsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const stopStatuses = routeStops.map((stop) => ({ stop, ...lodgingForStop(stop, lodgings, noHotelStops) }));
  const stopsWithoutHotel = stopStatuses.filter((x) => x.status === 'none' || x.status === 'partial');
  const stopsNotNeeded = stopStatuses.filter((x) => x.status === 'notNeeded');

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<Lodging['type']>('hotel');
  const [address, setAddress] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [price, setPrice] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !checkInDate || !checkOutDate) return;

    const data = {
      name: name.trim(),
      type,
      address: address.trim(),
      checkInDate,
      checkOutDate,
      confirmationCode: confirmationCode.trim() || undefined,
      price: price ? Number(price) : 0,
      contactPhone: contactPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      bookingUrl: bookingUrl.trim() || undefined,
    };
    if (editingId) onUpdateLodging(editingId, data);
    else onAddLodging(data);

    setName('');
    setAddress('');
    setCheckInDate('');
    setCheckOutDate('');
    setConfirmationCode('');
    setPrice('');
    setContactPhone('');
    setNotes('');
    setBookingUrl('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const startEdit = (l: Lodging) => {
    setEditingId(l.id);
    setName(l.name);
    setType(l.type);
    setAddress(l.address);
    setCheckInDate(l.checkInDate);
    setCheckOutDate(l.checkOutDate);
    setConfirmationCode(l.confirmationCode ?? '');
    setPrice(l.price ? String(l.price) : '');
    setContactPhone(l.contactPhone ?? '');
    setNotes(l.notes ?? '');
    setBookingUrl(l.bookingUrl ?? '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  const calculateNights = (inDate: string, outDate: string) => {
    try {
      const d1 = new Date(inDate);
      const d2 = new Date(outDate);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const getTypeName = (t: Lodging['type']) => {
    switch (t) {
      case 'hotel': return 'מלון';
      case 'airbnb': return 'דירת Airbnb';
      case 'resort': return 'ריזורט / כפר נופש';
      case 'apartment': return 'דירה';
      default: return 'מקום לינה';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-teal-600" />
            <span>מלונות ולינה ({lodgings.length})</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            פרטי המלונות, תאריכי צ׳ק אין/אאוט, כתובות וקודי אישור
          </p>
        </div>

        <button
          onClick={() => (showAddForm ? closeForm() : setShowAddForm(true))}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת מלון'}</span>
        </button>
      </div>

      {/* Destinations that still need a hotel */}
      {stopsWithoutHotel.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/70 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-rose-800">
            <BedDouble className="h-4 w-4" />
            <span>יעדים בלי מלון סגור ({stopsWithoutHotel.length})</span>
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {stopsWithoutHotel.map(({ stop, status, missingNights }) => (
              <span
                key={stop.id}
                className={`flex items-center gap-1.5 rounded-xl py-1.5 pr-3 pl-1.5 text-xs font-semibold ${
                  status === 'none' ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-950'
                }`}
              >
                <span>{stop.emoji}</span>
                <span>{stop.name}</span>
                <span className="font-normal opacity-90">
                  {status === 'none'
                    ? `${formatDM(stop.start)}–${formatDM(stop.lastNight ?? stop.end)}`
                    : `חסרים: ${missingNights.map(formatDM).join(', ')}`}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleNoHotel(stop.id)}
                  title="לא צריך מלון ביעד הזה"
                  className="flex items-center gap-1 rounded-lg bg-black/15 px-1.5 py-0.5 text-[10px] font-semibold hover:bg-black/25"
                >
                  <X className="h-3 w-3" />
                  <span>לא צריך</span>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Destinations marked as not needing a hotel */}
      {stopsNotNeeded.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
          <span className="font-semibold">יעדים בלי צורך במלון:</span>
          {stopsNotNeeded.map(({ stop }) => (
            <span key={stop.id} className="flex items-center gap-1.5 rounded-xl bg-white py-1 pr-2.5 pl-1.5 ring-1 ring-stone-200">
              <span>{stop.emoji}</span>
              <span>{stop.name}</span>
              <button
                type="button"
                onClick={() => onToggleNoHotel(stop.id)}
                title="להחזיר לרשימת היעדים שצריכים מלון"
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-teal-700"
              >
                <Undo2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-4 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-teal-600" />
            <span>{editingId ? 'עריכת מקום לינה' : 'הוספת מקום לינה'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">שם המלון / הדירה *</label>
              <input
                type="text"
                required
                placeholder="Boutique Hotel Campo de Fiori"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">סוג מקום לינה</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="hotel">מלון</option>
                <option value="airbnb">Airbnb</option>
                <option value="resort">ריזורט / כפר נופש</option>
                <option value="apartment">דירה שכורה</option>
                <option value="other">אחר</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">כתובת או עיר *</label>
              <input
                type="text"
                required
                placeholder="Via dei Giubbonari 39, Rome"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">תאריך צ׳ק אין *</label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">תאריך צ׳ק אאוט *</label>
              <input
                type="date"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מספר אישור הזמנה</label>
              <input
                type="text"
                placeholder="קוד בוקינג או Airbnb"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">עלות כוללת (בש״ח)</label>
              <input
                type="number"
                placeholder="2400"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">טלפון לקשר</label>
              <input
                type="tel"
                placeholder="+39 06 6880 6865"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">קישור להזמנה</label>
              <input
                type="url"
                placeholder="https://booking.com/..."
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-stone-600 mb-1">הערות נוספות (ארוחת בוקר, חניה וכו׳)</label>
              <input
                type="text"
                placeholder="כולל ארוחת בוקר, קומה 3, יש מעלית"
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
              {editingId ? 'עדכן מלון' : 'שמור מלון'}
            </button>
          </div>
        </form>
      )}

      {/* Lodgings List */}
      {lodgings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center">
          <Hotel className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-700">עדיין אין מלונות ברשימה</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            הוסיפו מלון או דירה, או כתבו ל-AI בצ׳אט שיוסיף את המלון שלכם!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {lodgings.map((l) => {
            const nights = calculateNights(l.checkInDate, l.checkOutDate);
            return (
              <div
                key={l.id}
                className="group bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-teal-400/60 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Decorative top accent */}
                  <div className="h-2 bg-gradient-to-l from-teal-600 via-emerald-500 to-amber-400" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                          🏨 {getTypeName(l.type)} · {nights} לילות
                        </span>
                        <h3 className="font-display text-xl text-stone-900 mt-2">{l.name}</h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(l)}
                          title="ערוך מקום לינה"
                          className="p-1.5 text-stone-300 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteLodging(l.id)}
                          title="מחק מקום לינה"
                          className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Address & Navigation */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-2.5 flex-wrap">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{l.address}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.name + ' ' + l.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded-full font-semibold mr-1 text-[11px] inline-flex items-center gap-0.5"
                      >
                        <span>ניווט במפה</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Check-in / Check-out Split Box */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 bg-stone-50/90 p-3 rounded-2xl border border-stone-200/60 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 block">צ׳ק-אין</span>
                        <strong className="text-stone-800 font-bold">{l.checkInDate}</strong>
                      </div>
                      <div className="border-r border-stone-200 pr-3">
                        <span className="text-[10px] font-semibold text-stone-400 block">צ׳ק-אאוט</span>
                        <strong className="text-stone-800 font-bold">{l.checkOutDate}</strong>
                      </div>
                    </div>

                    {/* Confirmation & Phone */}
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      {l.confirmationCode && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 rounded-full font-mono font-semibold text-stone-700">
                          <Hash className="w-3 h-3 text-stone-500" />
                          <span>אישור: {l.confirmationCode}</span>
                        </span>
                      )}

                      {l.contactPhone && (
                        <a
                          href={`tel:${l.contactPhone}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-medium hover:bg-emerald-100"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{l.contactPhone}</span>
                        </a>
                      )}
                    </div>

                    {l.notes && (
                      <p className="text-xs text-stone-700 mt-3 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/60 leading-relaxed">
                        ✨ {l.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Booking link footer */}
                <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between text-xs">
                  {l.price && l.price > 0 ? (
                    <span className="font-bold text-stone-900 text-sm">
                      סה״כ: ₪{l.price.toLocaleString()}
                    </span>
                  ) : <span />}

                  {l.bookingUrl && (
                    <a
                      href={l.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs"
                    >
                      <span>פתיחה ב-Booking</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
