'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Custom } from '../lib/types';
import AppHeader from './AppHeader';
import CreateCustomDialog from './CreateCustomDialog';
import EditCustomDialog from './EditCustomDialog';

const STORAGE_KEY = 'customs';

const SAMPLE_CUSTOMS: Custom[] = [
  {
    id: 'sample-1',
    name: '第1回カスタム',
    players: [
      { name: 'レイス', rank: 'プレデター' },
      { name: 'バンガロール', rank: 'マスター' },
      { name: 'ジブラルタル', rank: 'ダイヤ' },
      { name: 'ライフライン', rank: 'ダイヤ' },
      { name: 'パスファインダー', rank: 'プラチナ' },
      { name: 'ブラッドハウンド', rank: 'プラチナ' },
      { name: 'オクタン', rank: 'ゴールド' },
      { name: 'ローバ', rank: 'ゴールド' },
      { name: 'コースティック', rank: 'シルバー' },
      { name: 'ランパート', rank: 'シルバー' },
    ],
    specialRules: ['ケアパケ武器禁止'],
    legendExcludedRoles: [],
    weaponRestriction: [],
    createdAt: new Date('2026-03-29T10:00:00').toISOString(),
  },
];

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CustomsPage() {
  const [customs, setCustoms] = useState<Custom[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Custom | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustoms(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_CUSTOMS));
        setCustoms(SAMPLE_CUSTOMS);
      }
    } catch {
      // ignore
    }
  }, []);

  function persist(next: Custom[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCustoms(next);
  }

  function saveCustom(custom: Custom) {
    persist([custom, ...customs]);
  }

  function updateCustom(updated: Custom) {
    persist(customs.map((c) => (c.id === updated.id ? updated : c)));
  }

  function deleteCustom(id: string) {
    persist(customs.filter((c) => c.id !== id));
  }

  function duplicateCustom(c: Custom) {
    const copy: Custom = {
      ...c,
      id: crypto.randomUUID(),
      name: c.name + ' (コピー)',
      createdAt: new Date().toISOString(),
    };
    persist([copy, ...customs]);
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#181926]">
      <AppHeader />

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 px-4 pb-10 pt-8 text-white">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-200">CUSTOM GAME</p>
          <h1 className="mt-1.5 text-3xl font-extrabold leading-tight">カスタム管理</h1>
          <p className="mt-2 text-sm leading-relaxed text-purple-200">
            プレイヤーを登録してチーム分け。ランクに応じた<br />
            均等なマッチで白熱のカスタムを楽しもう。
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-6">
        {/* Row: count + create button */}
        <div className="mb-5 flex items-center justify-between">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            {customs.length}件のカスタム
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新しいカスタム
          </button>
        </div>

        {/* Empty state */}
        {customs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white py-20 text-center dark:border-[#383c68] dark:bg-[#20213a]">
            <span className="mb-3 text-5xl">🎮</span>
            <p className="font-semibold text-zinc-500 dark:text-zinc-400">カスタムがまだありません</p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">「新しいカスタム」から作成してください</p>
          </div>
        )}

        {/* Cards */}
        <ul className="space-y-4">
          {customs.map((custom) => (
            <li key={custom.id} className="relative">
              <Link
                href={`/customs/${custom.id}`}
                className="block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-[#20213a]"
              >
                <div className="px-4 pb-4 pt-4 pr-14">
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-50">{custom.name}</h2>
                  <div className="mt-2.5">
                    <span className="flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {custom.players.length}人
                    </span>
                  </div>
                </div>
              </Link>
              {/* Gear + date — absolute right column */}
              <div className="absolute right-2 top-2 flex flex-col items-end gap-7">
                <button
                  onClick={() => setEditTarget(custom)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-[#272847] dark:hover:text-zinc-300 transition-colors"
                  aria-label="編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
                <span className="pr-1.5 text-[10px] leading-none text-zinc-400">作成日：{shortDate(custom.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {createOpen && (
        <CreateCustomDialog
          onClose={() => setCreateOpen(false)}
          onSave={saveCustom}
        />
      )}

      {editTarget && (
        <EditCustomDialog
          custom={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(updated) => { updateCustom(updated); setEditTarget(null); }}
          onDelete={(id) => { deleteCustom(id); setEditTarget(null); }}
          onDuplicate={() => { duplicateCustom(editTarget!); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
