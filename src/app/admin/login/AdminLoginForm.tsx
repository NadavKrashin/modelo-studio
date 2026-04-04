'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/admin/dashboard';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(data.error === 'Invalid credentials' ? 'סיסמה שגויה' : 'התחברות נכשלה');
        setLoading(false);
        return;
      }
      const safeFrom = from.startsWith('/admin') && !from.startsWith('/admin/login') ? from : '/admin/dashboard';
      router.replace(safeFrom);
      router.refresh();
    } catch {
      setError('שגיאת רשת. נסו שוב.');
    } finally {
      setLoading(false);
    }
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
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">M</span>
          </div>
          <span className="font-bold text-xl text-white">Modelo Admin</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-gray-400 mb-1.5">
              סיסמת מנהל
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              dir="ltr"
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
            className="w-full rounded-xl bg-primary py-3.5 font-bold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? 'מתחבר…' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  );
}
