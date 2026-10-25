'use client';

import React, { useState } from 'react';
import { BudgetItem } from '../types/trip';
import { DollarSign, Plus, Trash2, PieChart, Users, Wallet, CreditCard } from 'lucide-react';

interface BudgetTabProps {
  budgetItems: BudgetItem[];
  onAddBudgetItem: (item: Omit<BudgetItem, 'id' | 'tripId'>) => void;
  onDeleteBudgetItem: (id: string) => void;
  onOpenAiChatWithPrompt: (prompt: string) => void;
}

export function BudgetTab({
  budgetItems,
  onAddBudgetItem,
  onDeleteBudgetItem,
  onOpenAiChatWithPrompt,
}: BudgetTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BudgetItem['category']>('food');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [paidBy, setPaidBy] = useState<BudgetItem['paidBy']>('משותף');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddBudgetItem({
      title: title.trim(),
      category,
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
      actualCost: actualCost ? Number(actualCost) : (estimatedCost ? Number(estimatedCost) : 0),
      currency: 'ILS',
      paidBy,
      expenseDate: new Date().toISOString().split('T')[0],
    });

    setTitle('');
    setEstimatedCost('');
    setActualCost('');
    setShowAddForm(false);
  };

  // Calculations
  const totalEstimated = budgetItems.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);
  const totalActual = budgetItems.reduce((acc, curr) => acc + (curr.actualCost || 0), 0);
  const remaining = totalEstimated - totalActual;

  // Breakdown by person
  const paidByHusband = budgetItems.filter((b) => b.paidBy === 'הוא').reduce((a, c) => a + (c.actualCost || 0), 0);
  const paidByWife = budgetItems.filter((b) => b.paidBy === 'היא').reduce((a, c) => a + (c.actualCost || 0), 0);
  const paidJointly = budgetItems.filter((b) => b.paidBy === 'משותף').reduce((a, c) => a + (c.actualCost || 0), 0);

  const getCategoryHebrew = (cat: BudgetItem['category']) => {
    switch (cat) {
      case 'flights': return 'טיסות';
      case 'hotels': return 'מלונות ולינה';
      case 'food': return 'אוכל ומסעדות';
      case 'activities': return 'אטרקציות וסיורים';
      case 'shopping': return 'קניות ומזכרות';
      case 'transit': return 'רכב ותחבורה';
      default: return 'שונות';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>תקציב והוצאות הטיול</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            מעקב אחר תכנון מול ביצוע, חלוקת תשלומים ושליטה מלאה בהוצאות
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת הוצאה'}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>תקציב משוער כולל</span>
            <Wallet className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            ₪{totalEstimated.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-400">לפי {budgetItems.length} סעיפים</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>שולם בפועל עד כה</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            ₪{totalActual.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-400">
            {totalEstimated > 0 ? `${Math.round((totalActual / totalEstimated) * 100)}% מהתקציב` : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>יתרה מתוכננת</span>
            <PieChart className="w-4 h-4 text-teal-500" />
          </div>
          <p className={`text-2xl font-bold mt-2 ${remaining >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
            ₪{remaining.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-400">
            {remaining >= 0 ? 'נותר לניצול' : 'חריגה מהתקציב!'}
          </span>
        </div>
      </div>

      {/* Couple Breakdown Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-3">
          <Users className="w-4 h-4 text-teal-600" />
          <span>חלוקת תשלומים בפועל בין בני הזוג:</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-teal-50/70 p-2.5 rounded-xl border border-teal-100">
            <span className="text-xs text-teal-700 font-medium">שילם הוא</span>
            <p className="text-sm font-bold text-teal-900 mt-0.5">₪{paidByHusband.toLocaleString()}</p>
          </div>
          <div className="bg-pink-50/70 p-2.5 rounded-xl border border-pink-100">
            <span className="text-xs text-pink-700 font-medium">שילמה היא</span>
            <p className="text-sm font-bold text-pink-900 mt-0.5">₪{paidByWife.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
            <span className="text-xs text-purple-700 font-medium">משותף / יחד</span>
            <p className="text-sm font-bold text-purple-900 mt-0.5">₪{paidJointly.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>הוספת סעיף תקציב או הוצאה</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">סעיף / הוצאה *</label>
              <input
                type="text"
                required
                placeholder="למשל: סדנת שוקולד, מונית לשדה"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">קטגוריה</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="food">אוכל ומסעדות</option>
                <option value="activities">אטרקציות וסיורים</option>
                <option value="hotels">מלונות ולינה</option>
                <option value="flights">טיסות</option>
                <option value="transit">רכב ותחבורה</option>
                <option value="shopping">קניות ומזכרות</option>
                <option value="general">שונות</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מי שילם?</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="משותף">משותף (שנינו)</option>
                <option value="הוא">הוא</option>
                <option value="היא">היא</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">תקציב משוער (₪)</label>
              <input
                type="number"
                placeholder="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">שולם בפועל (₪)</label>
              <input
                type="number"
                placeholder="0"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              שמור הוצאה
            </button>
          </div>
        </form>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 font-bold text-sm text-stone-800">
          פירוט סעיפי התקציב ({budgetItems.length})
        </div>

        <div className="divide-y divide-stone-100">
          {budgetItems.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-stone-900">{item.title}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                    {getCategoryHebrew(item.category)}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-medium">
                    {item.paidBy}
                  </span>
                </div>
                <div className="text-xs text-stone-500">
                  משוער: ₪{item.estimatedCost.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <span className="font-bold text-sm text-stone-900">
                    ₪{item.actualCost.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-stone-400">בפועל</span>
                </div>

                <button
                  onClick={() => onDeleteBudgetItem(item.id)}
                  title="מחק סעיף"
                  className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
