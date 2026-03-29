'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchSportFilaments } from '@/lib/firebase/sport-filaments';
import type { Filament } from '@/lib/types';

export function useSportFilaments() {
  const [items, setItems] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSportFilaments();
      setItems(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאת טעינה';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
