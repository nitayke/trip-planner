'use client';

import React, { useState } from 'react';
import { Lodging } from '../types/trip';
import { Hotel, Plus, Trash2, MapPin, Calendar, Phone, ExternalLink, Hash } from 'lucide-react';

interface LodgingsTabProps {
  lodgings: Lodging[];
  onAddLodging: (lodging: Omit<Lodging, 'id' | 'tripId'>) => void;
  onDeleteLodging: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function LodgingsTab({
  lodgings,
  onAddLodging,
  onDeleteLodging,
  onOpenAiChatWithPrompt,
}: LodgingsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);

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

    onAddLodging({
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
    });

    setName('');
    setAddress('');
    setCheckInDate('');
    setCheckOutDate('');
    setConfirmationCode('');
    setPrice('');
    setContactPhone('');
    setNotes('');
    setBookingUrl('');
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
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-indigo-600" />
            <span>מלונות ולינה ({lodgings.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            פרטי המלונות, תאריכי צ׳ק אין/אאוט, כתובות וקודי אישור
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת מלון'}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-indigo-600" />
            <span>הוספת מקום לינה</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">שם המלון / הדירה *</label>
              <input
                type="text"
                required
                placeholder="Boutique Hotel Campo de Fiori"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">סוג מקום לינה</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="hotel">מלון</option>
                <option value="airbnb">Airbnb</option>
                <option value="resort">ריזורט / כפר נופש</option>
                <option value="apartment">דירה שכורה</option>
                <option value="other">אחר</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">כתובת או עיר *</label>
              <input
                type="text"
                required
                placeholder="Via dei Giubbonari 39, Rome"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">תאריך צ׳ק אין *</label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">תאריך צ׳ק אאוט *</label>
              <input
                type="date"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">מספר אישור הזמנה</label>
              <input
                type="text"
                placeholder="קוד בוקינג או Airbnb"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">עלות כוללת (בש״ח)</label>
              <input
                type="number"
                placeholder="2400"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">טלפון לקשר</label>
              <input
                type="tel"
                placeholder="+39 06 6880 6865"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">קישור להזמנה</label>
              <input
                type="url"
                placeholder="https://booking.com/..."
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">הערות נוספות (ארוחת בוקר, חניה וכו׳)</label>
              <input
                type="text"
                placeholder="כולל ארוחת בוקר, קומה 3, יש מעלית"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
            >
              שמור מלון
            </button>
          </div>
        </form>
      )}

      {/* Lodgings List */}
      {lodgings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <Hotel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">עדיין אין מלונות ברשימה</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            הוסיפו מלון או דירה, או כתבו ל-AI בצ׳אט שיוסיף את המלון שלכם!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lodgings.map((l) => {
            const nights = calculateNights(l.checkInDate, l.checkOutDate);
            return (
              <div
                key={l.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                        {getTypeName(l.type)} ({nights} לילות)
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5">{l.name}</h3>
                    </div>

                    <button
                      onClick={() => onDeleteLodging(l.id)}
                      title="מחק מקום לינה"
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Address & Navigation */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{l.address}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.name + ' ' + l.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline font-medium mr-1 text-[11px] flex items-center gap-0.5"
                    >
                      <span>נווט</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      צ׳ק אין: <strong>{l.checkInDate}</strong> | צ׳ק אאוט: <strong>{l.checkOutDate}</strong>
                    </span>
                  </div>

                  {/* Confirmation & Phone */}
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    {l.confirmationCode && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg font-mono font-medium text-slate-700">
                        <Hash className="w-3 h-3 text-slate-500" />
                        <span>קוד: {l.confirmationCode}</span>
                      </span>
                    )}

                    {l.contactPhone && (
                      <a
                        href={`tel:${l.contactPhone}`}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{l.contactPhone}</span>
                      </a>
                    )}
                  </div>

                  {l.notes && (
                    <p className="text-xs text-slate-600 mt-3 p-2 bg-amber-50/60 rounded-xl border border-amber-100/80">
                      💡 {l.notes}
                    </p>
                  )}
                </div>

                {/* Price & Booking link footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {l.price && l.price > 0 ? (
                    <span className="font-bold text-slate-800 text-sm">
                      סה״כ: ₪{l.price.toLocaleString()}
                    </span>
                  ) : <span />}

                  {l.bookingUrl && (
                    <a
                      href={l.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>פתח הזמנה</span>
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
