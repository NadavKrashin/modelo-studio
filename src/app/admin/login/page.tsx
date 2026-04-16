'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => {
        if (res.ok) {
          router.replace('/admin/dashboard');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === 'Invalid credentials') {
          setError('סיסמה שגויה');
        } else if (data.error === 'Server misconfiguration') {
          setError('שגיאת תצורת שרת — ADMIN_PASSWORD לא מוגדר.');
        } else {
          setError('התחברות נכשלה');
        }
        return;
      }

      router.replace('/admin/dashboard');
      router.refresh();

      setTimeout(() => {
        if (window.location.pathname.includes('/login')) {
          window.location.href = '/admin/dashboard';
        }
      }, 2000);
    } catch {
      setError('שגיאת רשת. נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="absolute top-6 end-6 text-sm text-gray-400 hover:text-white transition-colors"
      >
        לאתר
      </Link>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">M</span>
          </div>
          <span className="font-bold text-xl text-white">Modelo Admin</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-gray-400 mb-1.5"
            >
              סיסמת מנהל
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
              dir="ltr"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-500 disabled:opacity-40 transition-all"
          >
            {loading ? 'מתחבר…' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  );
}
