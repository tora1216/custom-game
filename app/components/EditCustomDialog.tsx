'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { RANKS, RANK_COLORS, Rank, Player, Custom } from '../lib/types';

type Props = {
  custom: Custom;
  onClose: () => void;
  onSave: (updated: Custom) => void;
  onDelete: (id: string) => void;
};

export default function EditCustomDialog({ custom, onClose, onSave, onDelete }: Props) {
  const [customName, setCustomName] = useState(custom.name);
  const [playerName, setPlayerName] = useState('');
  const [playerRank, setPlayerRank] = useState<Rank>('ブロンズ');
  const [players, setPlayers] = useState<Player[]>(custom.players);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function addPlayer() {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setError('プレイヤー名を入力してください');
      return;
    }
    setPlayers((prev) => [...prev, { name: trimmed, rank: playerRank }]);
    setPlayerName('');
    setError('');
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setError('カスタム名を入力してください');
      return;
    }
    onSave({ ...custom, name: trimmedName, players });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-[#20213a]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">カスタムを編集</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#272847]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 pb-2">
          {/* Custom name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              カスタム名 <span className="font-normal text-zinc-400">*</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50"
            />
          </div>

          {/* Add player */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              プレイヤー名 <span className="font-normal text-zinc-400">（任意）</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="例）あおい"
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <select
                value={playerRank}
                onChange={(e) => setPlayerRank(e.target.value as Rank)}
                className="rounded-xl border border-zinc-200 px-2 py-2.5 text-sm text-zinc-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={addPlayer}
                className="shrink-0 rounded-2xl bg-violet-50 px-5 py-2.5 text-sm font-bold text-violet-500 hover:bg-violet-100 active:scale-95 transition-transform dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
              >
                追加
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Player list */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              参加プレイヤー ({players.length}人)
            </p>
            {players.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-400 dark:border-[#383c68]">
                プレイヤーを追加してください
              </p>
            ) : (
              <ul className="max-h-84 space-y-1.5 overflow-y-auto">
                {players.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 dark:bg-[#272847]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RANK_COLORS[p.rank]}`}>
                        {p.rank}
                      </span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200">{p.name}</span>
                    </div>
                    <button
                      onClick={() => removePlayer(i)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Delete — left */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onDelete(custom.id); onClose(); }}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 active:scale-95 transition-transform"
              >
                削除する
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                戻る
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-100 active:scale-95 transition-transform dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <TrashIcon className="h-4 w-4" />
              削除
            </button>
          )}

          {/* Cancel + Save — right */}
          <div className="flex items-center gap-2">
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
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
