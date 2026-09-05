'use client';

import { useEffect, useState } from 'react';
import { Custom, isBRMode } from '../../lib/types';
import CustomDetailBR from './CustomDetailBR';
import CustomDetailTDM from './CustomDetailTDM';

const STORAGE_KEY = 'customs';

export default function CustomDetail({ id }: { id: string }) {
  const [mode, setMode] = useState<Custom['mode'] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all: Custom[] = JSON.parse(stored);
        const found = all.find((c) => c.id === id) ?? null;
        setMode(found?.mode ?? null);
      }
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, [id]);

  if (!loaded) return null;

  if (!mode) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        カスタムが見つかりません
      </div>
    );
  }

  return isBRMode(mode) ? <CustomDetailBR id={id} /> : <CustomDetailTDM id={id} />;
}
