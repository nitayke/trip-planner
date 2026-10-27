'use client';

import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

// SHA-256 of the password: only the hash is kept in the code, never the password itself
const PASSWORD_HASH = 'c05940ea23fed7a94117e4deefc630c3a88a4f78d41d30e226dc9e38f1846a7b';
const STORAGE_KEY = 'trip-unlocked-hash';

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let remembered: string | null = null;
    try {
      remembered = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable: just ask for the password
    }
    setStatus(remembered === PASSWORD_HASH ? 'unlocked' : 'locked');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await sha256Hex(input.trim());
    if (hash === PASSWORD_HASH) {
      try {
        localStorage.setItem(STORAGE_KEY, hash);
      } catch {
        // not remembered, still let them in for this visit
      }
      setStatus('unlocked');
    } else {
      setError(true);
    }
  };

  if (status === 'unlocked') return <>{children}</>;
  if (status === 'checking') return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl max-w-sm w-full shadow-xl border border-stone-200 p-6 flex flex-col gap-4 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-semibold">הטיול שלנו</h1>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="סיסמה"
          aria-label="סיסמה"
          className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-center outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            סיסמה שגויה
          </p>
        )}
        <button
          type="submit"
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 transition-colors"
        >
          כניסה
        </button>
      </form>
    </div>
  );
}
