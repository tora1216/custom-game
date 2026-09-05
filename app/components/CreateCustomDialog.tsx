'use client';

import { useState } from 'react';
import {
  MODES,
  Mode,
  Custom,
  DEFAULT_KILL_POINT_VALUE,
  DEFAULT_PLACEMENT_BONUS,
  DEFAULT_KILL_POINT_CAPS,
  DEFAULT_KILL_POINT_CAPS_ENABLED,
  DEFAULT_BR_RANK_POINTS,
  DEFAULT_BR_TEAM_POINT_CAP,
  DEFAULT_BR_FEMALE_DISCOUNT,
  DEFAULT_BR_FEMALE_DISCOUNT_ENABLED,
  DEFAULT_BR_HANDICAPS,
} from '../lib/types';

export type { Custom };

type Props = {
  onClose: () => void;
  onSave: (custom: Custom) => void;
};

export default function CreateCustomDialog({ onClose, onSave }: Props) {
  const [customName, setCustomName] = useState('');
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [error, setError] = useState('');

  function handleSave() {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setError('カスタム名を入力してください');
      return;
    }
    const custom: Custom = {
      id: crypto.randomUUID(),
      name: trimmedName,
      mode,
      players: [],
      brTeams: [],
      brMatch: {
        killPointValue: DEFAULT_KILL_POINT_VALUE,
        placementBonus: [...DEFAULT_PLACEMENT_BONUS],
        killPointCaps: [...DEFAULT_KILL_POINT_CAPS],
        killPointCapsEnabled: DEFAULT_KILL_POINT_CAPS_ENABLED,
      },
      brMatchCount: 1,
      brRankPoints: {
        rankPoints: { ...DEFAULT_BR_RANK_POINTS },
        teamPointCap: DEFAULT_BR_TEAM_POINT_CAP,
        femaleDiscount: DEFAULT_BR_FEMALE_DISCOUNT,
        femaleDiscountEnabled: DEFAULT_BR_FEMALE_DISCOUNT_ENABLED,
      },
      brHandicaps: { ...DEFAULT_BR_HANDICAPS },
      specialRules: [],
      legendExcludedRoles: [],
      weaponRestriction: [],
      createdAt: new Date().toISOString(),
    };
    onSave(custom);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-[#20213a] mx-4">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">カスタムを作成</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#272847]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Custom name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              カスタム名 <span className="font-normal text-zinc-400">*</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="例: 第1回カスタム"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50 dark:placeholder-zinc-500"
            />
          </div>

          {/* Mode selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              モード <span className="font-normal text-zinc-400">*</span>
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50"
            >
              {MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-[#2c2f52]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 active:scale-95 transition-transform"
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
}
