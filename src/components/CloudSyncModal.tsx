'use client';

import React, { useState } from 'react';
import { X, Cloud, Check, Copy, ExternalLink, ShieldAlert, Sparkles, Smartphone, Server } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudSyncModal({ isOpen, onClose }: CloudSyncModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySqlInstructions = () => {
    navigator.clipboard.writeText(`-- פתח את Supabase (supabase.com)
-- 1. צור פרויקט חינמי חדש
-- 2. כנס ל-SQL Editor
-- 3. הדבק את תוכן הקובץ: supabase/schema.sql ולחץ RUN`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">חיבור ענן חינמי (גישה מהטלפון 24/7)</h3>
              <p className="text-xs text-blue-100">המחשב שלכם יכול להיות כבוי – הכל נשמר בענן!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Status Box */}
          <div className={`p-4 rounded-2xl border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start gap-2.5">
              {isSupabaseConfigured ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">
                  {isSupabaseConfigured ? 'הענן מחובר ופעיל!' : 'כרגע פועל מקומית (Offline/Local)'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {isSupabaseConfigured
                    ? 'כל העדכונים שלכם ושל ה-AI נשמרים ישירות ב-Supabase בענן ומסתנכרנים מיד בין הטלפונים שלכם.'
                    : 'המערכת כרגע שומרת את הנתונים בדפדפן המקומי. כדי שהנתונים יהיו זמינים לשניכם בטלפונים גם כשהמחשב כבוי – חברו חשבון Supabase חינמי ב-3 צעדים פשוטים.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Step Setup Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              3 צעדים להפעלה חינמית בענן (לוקח 2 דקות):
            </h4>

            {/* Step 1 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div className="space-y-1">
                <p className="font-bold text-xs text-slate-800">פתיחת פרויקט חינמי ב-Supabase</p>
                <p className="text-xs text-slate-600">
                  היכנסו ל-{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>supabase.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  ופתחו פרויקט חינם.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div className="space-y-1 w-full">
                <p className="font-bold text-xs text-slate-800">הרצת סקריפט הנתונים (SQL)</p>
                <p className="text-xs text-slate-600">
                  כנסו ללשונית <strong>SQL Editor</strong> ב-Supabase והדביקו את הסקריפט מתוך התיקייה{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">supabase/schema.sql</code>.
                </p>
                <button
                  onClick={handleCopySqlInstructions}
                  className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'הועתק!' : 'העתק הוראות ללוח'}</span>
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div className="space-y-1">
                <p className="font-bold text-xs text-slate-800">העלאה בחינם ל-Vercel</p>
                <p className="text-xs text-slate-600">
                  מעלים את הפרויקט בחינם ל-{' '}
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>vercel.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  ומגדירים את משתני הסביבה:
                  <br />
                  <code className="text-[11px] text-slate-800">NEXT_PUBLIC_SUPABASE_URL</code>
                  <br />
                  <code className="text-[11px] text-slate-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                  <br />
                  <code className="text-[11px] text-slate-800">GEMINI_API_KEY</code>
                </p>
              </div>
            </div>
          </div>

          {/* Mobile tip */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex items-center gap-2.5 text-xs text-blue-900">
            <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              <strong>טיפ לנייד:</strong> פתחו את הכתובת של Vercel בספארי (אייפון) או כרום (אנדרואיד) ולחצו על <strong>״הוסף למסך הבית״</strong> כדי לקבל אפליקציה מושלמת!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
          >
            הבנתי, סגור
          </button>
        </div>
      </div>
    </div>
  );
}
