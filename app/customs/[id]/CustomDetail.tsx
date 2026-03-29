'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RANK_COLORS, RANK_POINTS, Custom } from '../../lib/types';
import { Team, DivisionMode, divideTeams, divideTeamsRandom } from '../../lib/teamDivision';
import { Legend, LEGENDS, LEGEND_ROLES, ROLE_COLORS, assignLegends } from '../../lib/legends';
import ThemeToggle from '../../components/ThemeToggle';

const STORAGE_KEY = 'customs';
const TEAM_BG = [
  'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800',
  'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800',
  'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
  'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
  'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800',
  'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800',
];
const TEAM_HEADER = [
  'bg-indigo-600',
  'bg-rose-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-purple-600',
  'bg-cyan-600',
];

const TDM_MAPS = [
  'フラグメント・イースト',
  'スカルタウン',
  'エステーツ',
  'サーマル・ステーション',
  'バロメーター',
  'ラバ・フィッシャー',
  'ゼウス・ステーション',
  'パーティ・クラッシャー',
  'フェーズ・ランナー',
  'オーバーフロー',
  'プロダクション・ヤード',
  'アンコール',
  'ハビタット',
];

export default function CustomDetail({ id }: { id: string }) {
  const [custom, setCustom] = useState<Custom | null>(null);

  // チーム分け
  const numTeams = 2;
  const [divisionMode, setDivisionMode] = useState<DivisionMode>('balanced');
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisionAnimating, setDivisionAnimating] = useState(false);
  const [displayTeams, setDisplayTeams] = useState<Team[]>([]);

  // チーム名編集
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [editingTeamIdx, setEditingTeamIdx] = useState<number | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const teamNameInputRef = useRef<HTMLInputElement>(null);

  // 特別ルール
  const [ruleInput, setRuleInput] = useState('');

  // 特別ルールセクション開閉
  const [openMap, setOpenMap] = useState(false);
  const [openWeapon, setOpenWeapon] = useState(false);
  const [openLegend, setOpenLegend] = useState(false);
  const [openTextRules, setOpenTextRules] = useState(false);

  // レジェンド割り当て
  const [legendResult, setLegendResult] = useState<Record<string, Legend>>({});
  const [legendTeamMode, setLegendTeamMode] = useState(false);

  // マップルーレット
  const [mapResult, setMapResult] = useState('');
  const [mapAnimating, setMapAnimating] = useState(false);
  const [mapDisplay, setMapDisplay] = useState('');
  const [disabledMaps, setDisabledMaps] = useState<string[]>([]);
  const [showMapList, setShowMapList] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all: Custom[] = JSON.parse(stored);
        const found = all.find((c) => c.id === id) ?? null;
        if (found) {
          if (!found.specialRules) found.specialRules = [];
          if (!found.legendExcludedRoles) found.legendExcludedRoles = [];
          if (!found.weaponRestriction) found.weaponRestriction = [];
        }
        setCustom(found);
      }
    } catch {
      // ignore
    }
  }, [id]);

  function persist(updated: Custom) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all: Custom[] = stored ? JSON.parse(stored) : [];
      const next = all.map((c) => (c.id === updated.id ? updated : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setCustom(updated);
    } catch {
      // ignore
    }
  }

  function runDivision() {
    if (!custom || divisionAnimating) return;
    const result = divisionMode === 'random'
      ? divideTeamsRandom(custom.players, numTeams)
      : divideTeams(custom.players, numTeams);

    setDivisionAnimating(true);
    setEditingTeamIdx(null);

    let tick = 0;
    const totalTicks = 18;

    function step() {
      tick++;
      if (tick >= totalTicks) {
        setDisplayTeams(result);
        setTeams(result);
        setTeamNames(result.map((t) => t.name));
        setTimeout(() => setDivisionAnimating(false), 150);
        return;
      }
      setDisplayTeams(divideTeamsRandom(custom!.players, numTeams));
      const delay = tick < 6 ? 60 : tick < 12 ? 110 : 180;
      setTimeout(step, delay);
    }
    step();
  }

  function startEditTeamName(idx: number) {
    setEditingTeamIdx(idx);
    setEditingTeamName(teamNames[idx] ?? teams[idx].name);
    setTimeout(() => teamNameInputRef.current?.select(), 0);
  }

  function commitTeamName() {
    if (editingTeamIdx === null) return;
    const next = [...teamNames];
    next[editingTeamIdx] = editingTeamName.trim() || (teams[editingTeamIdx]?.name ?? `チーム${editingTeamIdx + 1}`);
    setTeamNames(next);
    setEditingTeamIdx(null);
  }

  function addRule() {
    if (!custom || !ruleInput.trim()) return;
    const updated = { ...custom, specialRules: [...custom.specialRules, ruleInput.trim()] };
    persist(updated);
    setRuleInput('');
  }

  function removeRule(index: number) {
    if (!custom) return;
    persist({ ...custom, specialRules: custom.specialRules.filter((_, i) => i !== index) });
  }

  const [slotAnimating, setSlotAnimating] = useState(false);
  const [slotDisplay, setSlotDisplay] = useState<string[]>([]);
  const [randomSlotCount, setRandomSlotCount] = useState<number | 'random'>(2);

  function toggleWeaponSlot(num: number) {
    if (slotAnimating || !custom) return;
    const current = custom.weaponRestriction ?? [];
    const key = String(num);
    const next = current.includes(key)
      ? current.filter((s) => s !== key)
      : [...current, key].sort();
    persist({ ...custom, weaponRestriction: next });
  }

  function randomWeaponSlot() {
    if (slotAnimating || !custom) return;
    setSlotAnimating(true);

    const count = randomSlotCount === 'random'
      ? Math.floor(Math.random() * 4) + 1
      : randomSlotCount;
    const final = [1, 2, 3, 4, 5]
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(String)
      .sort();

    let tick = 0;
    const totalTicks = 20;

    function step() {
      tick++;
      if (tick >= totalTicks) {
        setSlotDisplay(final);
        persist({ ...custom!, weaponRestriction: final });
        setTimeout(() => setSlotAnimating(false), 200);
        return;
      }
      const c = Math.floor(Math.random() * 4) + 1;
      const rand = [1, 2, 3, 4, 5]
        .sort(() => Math.random() - 0.5)
        .slice(0, c)
        .map(String);
      setSlotDisplay(rand);
      const delay = tick < 8 ? 60 : tick < 14 ? 110 : 180;
      setTimeout(step, delay);
    }
    step();
  }

  const displayedSlots = slotAnimating
    ? slotDisplay
    : (custom?.weaponRestriction ?? []);

  function toggleExcludedRole(role: string) {
    if (!custom) return;
    const excluded = custom.legendExcludedRoles ?? [];
    const next = excluded.includes(role)
      ? excluded.filter((r) => r !== role)
      : [...excluded, role];
    persist({ ...custom, legendExcludedRoles: next });
    setLegendResult({});
  }

  function runLegendAssign() {
    if (!custom || custom.players.length === 0) return;

    if (legendTeamMode && teams.length >= 2) {
      const excluded = custom.legendExcludedRoles ?? [];
      const pool = LEGENDS.filter((l) => !excluded.includes(l.role));
      // 共通レジェンドプールをシャッフルして各チームの人数分を確保
      const maxSize = Math.max(...teams.map((t) => t.players.length));
      const sharedLegends = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(maxSize, pool.length));

      const result: Record<string, Legend> = {};
      teams.forEach((team) => {
        const teamLegends = [...sharedLegends].sort(() => Math.random() - 0.5);
        team.players.forEach((p, i) => {
          result[p.name] = teamLegends[i % teamLegends.length];
        });
      });
      setLegendResult(result);
    } else {
      const result = assignLegends(
        custom.players.map((p) => p.name),
        custom.legendExcludedRoles ?? [],
      );
      setLegendResult(result);
    }
  }

  function spinMap() {
    if (mapAnimating) return;
    const available = TDM_MAPS.filter((m) => !disabledMaps.includes(m));
    if (available.length === 0) return;
    setMapAnimating(true);
    const final = available[Math.floor(Math.random() * available.length)];

    let tick = 0;
    const totalTicks = 22;

    function step() {
      tick++;
      if (tick >= totalTicks) {
        setMapDisplay(final);
        setMapResult(final);
        setTimeout(() => setMapAnimating(false), 200);
        return;
      }
      setMapDisplay(available[Math.floor(Math.random() * available.length)]);
      const delay = tick < 8 ? 55 : tick < 15 ? 100 : 190;
      setTimeout(step, delay);
    }
    step();
  }

  if (!custom) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        カスタムが見つかりません
      </div>
    );
  }

  const maxPoints = teams.length > 0 ? Math.max(...teams.map((t) => t.totalPoints)) : 0;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#181926]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-[#2c2f52] dark:bg-[#20213a]/80">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              className="shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-[#272847]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <div className="min-w-0">
              <p className="truncate font-bold text-zinc-900 dark:text-zinc-50">{custom.name}</p>
              <p className="text-xs text-zinc-400">{custom.players.length}人参加</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              aria-label="設定"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-[#272847] dark:hover:text-zinc-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Player summary */}
      <div className="mx-auto max-w-xl px-4 pt-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#2c2f52] dark:bg-[#20213a]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">参加プレイヤー</p>
          {custom.players.length === 0 ? (
            <p className="text-sm text-zinc-400">プレイヤーなし</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {custom.players.map((p, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-1 pr-2.5 text-xs dark:border-[#383c68] dark:bg-[#272847]"
                >
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${RANK_COLORS[p.rank]}`}>
                    {p.rank}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{p.name}</span>
                  <span className="text-zinc-400">({RANK_POINTS[p.rank]}pt)</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="space-y-6">
            {/* チーム分け・ハンデ */}
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-[#2c2f52] dark:bg-[#20213a] overflow-hidden">
              <div className="px-4 pt-3 pb-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">チーム分け</p>
              </div>
              {/* 分け方 + 実行ボタン */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-1 gap-2">
                  {([
                    { value: 'balanced', label: '🎯 レベル順' },
                    { value: 'random',   label: '🎲 ランダム' },
                  ] as { value: DivisionMode; label: string }[]).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDivisionMode(value)}
                      className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                        divisionMode === value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-[#383c68] dark:text-zinc-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={runDivision}
                  disabled={custom.players.length === 0 || divisionAnimating}
                  className="shrink-0 flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {teams.length > 0 ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      再実行
                    </>
                  ) : (
                    'チーム分け'
                  )}
                </button>
              </div>

              {/* チーム結果 */}
              {(teams.length > 0 || divisionAnimating) && displayTeams.length > 0 && (
                <>
                  <div className={`grid grid-cols-2 border-t border-zinc-100 dark:border-[#2c2f52]`}>
                    {displayTeams.map((team, i) => (
                      <div
                        key={i}
                        className={`${i > 0 ? 'border-l border-zinc-100 dark:border-[#2c2f52]' : ''} overflow-hidden`}
                      >
                        <div className={`flex items-center justify-between px-3 py-2 ${TEAM_HEADER[i % TEAM_HEADER.length]}`}>
                          {!divisionAnimating && editingTeamIdx === i ? (
                            <input
                              ref={teamNameInputRef}
                              value={editingTeamName}
                              onChange={(e) => setEditingTeamName(e.target.value)}
                              onBlur={commitTeamName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitTeamName();
                                if (e.key === 'Escape') setEditingTeamIdx(null);
                              }}
                              className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-white/50 outline-none border-b border-white/50 min-w-0"
                            />
                          ) : (
                            <button
                              onClick={() => startEditTeamName(i)}
                              className="flex items-center gap-1 text-sm font-semibold text-white hover:opacity-75 transition-opacity min-w-0"
                            >
                              <span className="truncate">{teamNames[i] ?? team.name}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          )}
                          <span className="shrink-0 text-xs text-white/70 ml-1">{team.totalPoints}pt</span>
                        </div>
                        <ul className="divide-y divide-zinc-100 dark:divide-[#2c2f52]">
                          {team.players.map((p, j) => (
                            <li key={j} className="flex items-center gap-1.5 px-3 py-1.5">
                              <span className={`inline-block w-14 rounded-full py-0.5 text-center text-xs font-semibold ${RANK_COLORS[p.rank]}`}>
                                {p.rank}
                              </span>
                              <span className="flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">{p.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                </>
              )}
            </div>

            {/* ── セクション区切り ── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-[#2c2f52]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">特別ルール</span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-[#2c2f52]" />
            </div>

            {/* ── マップルーレット ── */}
            <div className={`rounded-xl border bg-white dark:bg-[#20213a] overflow-hidden transition-colors ${openMap ? 'border-indigo-300 dark:border-indigo-700' : 'border-zinc-200 dark:border-[#2c2f52]'}`}>
              <button
                onClick={() => setOpenMap((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${openMap ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500' : 'border-zinc-300 dark:border-[#4a4e7a]'}`}>
                  {openMap && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">マップルーレット</p>
                  <p className="text-xs text-zinc-400">TDMマップをランダムで決定</p>
                </div>
                {mapResult && !openMap && (
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">{mapResult}</span>
                )}
              </button>

              {openMap && (
                <div className="border-t border-zinc-100 p-4 dark:border-[#2c2f52]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShowMapList((v) => !v)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        showMapList
                          ? 'bg-zinc-200 text-zinc-600 dark:bg-[#383c68] dark:text-zinc-300'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-[#30335a] dark:text-zinc-400'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.553.894l-4 2A1 1 0 017 17v-6.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      マップを絞り込む
                      {disabledMaps.length > 0 && (
                        <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-xs text-white leading-none">
                          {disabledMaps.length}除外
                        </span>
                      )}
                    </button>
                    <button
                      onClick={spinMap}
                      disabled={mapAnimating || TDM_MAPS.filter((m) => !disabledMaps.includes(m)).length === 0}
                      className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-500 hover:bg-violet-100 disabled:opacity-50 active:scale-95 transition-transform dark:bg-violet-900/30 dark:text-violet-400"
                    >
                      🎲 スピン
                    </button>
                  </div>

                  {showMapList && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {TDM_MAPS.map((m) => {
                        const disabled = disabledMaps.includes(m);
                        return (
                          <button
                            key={m}
                            onClick={() => setDisabledMaps((prev) =>
                              disabled ? prev.filter((x) => x !== m) : [...prev, m]
                            )}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                              disabled
                                ? 'bg-zinc-100 text-zinc-300 line-through dark:bg-[#272847] dark:text-zinc-600'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-[#30335a] dark:text-zinc-300 dark:hover:bg-[#383c68]'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className={`flex min-h-[4.5rem] items-center justify-center rounded-xl border-2 transition-colors ${
                    mapResult && !mapAnimating
                      ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/40'
                      : 'border-dashed border-zinc-200 bg-zinc-50 dark:border-[#383c68] dark:bg-[#272847]'
                  }`}>
                    {mapDisplay || mapResult ? (
                      <p className={`text-lg font-bold transition-all ${mapAnimating ? 'text-zinc-400 dark:text-zinc-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {mapAnimating ? (mapDisplay || '…') : mapResult}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400">スピンボタンでマップを決定</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── レジェンド縛り ── */}
            <div className={`rounded-xl border bg-white dark:bg-[#20213a] overflow-hidden transition-colors ${openLegend ? 'border-indigo-300 dark:border-indigo-700' : 'border-zinc-200 dark:border-[#2c2f52]'}`}>
              <button
                onClick={() => setOpenLegend((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${openLegend ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500' : 'border-zinc-300 dark:border-[#4a4e7a]'}`}>
                  {openLegend && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">レジェンド縛り</p>
                  <p className="text-xs text-zinc-400">各プレイヤーにレジェンドをランダムで割り当て</p>
                </div>
              </button>

              {openLegend && (
                <>
                  <div className="border-t border-zinc-100 px-4 py-3 dark:border-[#2c2f52]">
                    <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">除外するロール</p>
                    <div className="flex flex-wrap gap-2">
                      {LEGEND_ROLES.map((role) => {
                        const excluded = (custom.legendExcludedRoles ?? []).includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleExcludedRole(role)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-opacity ${
                              excluded ? 'opacity-35 ring-2 ring-zinc-300 dark:ring-zinc-600' : ''
                            } ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}
                          >
                            {excluded ? '✕ ' : ''}{role}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 px-4 py-3 dark:border-[#2c2f52]">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={runLegendAssign}
                        disabled={custom.players.length === 0}
                        className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 transition-transform"
                      >
                        レジェンド割り当て
                      </button>
                      <button
                        onClick={() => setLegendTeamMode((v) => !v)}
                        disabled={teams.length < 2}
                        className="flex items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 transition-colors ${legendTeamMode ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-300 dark:border-zinc-500'}`}>
                          {legendTeamMode && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">チーム別で同じ構成</span>
                      </button>
                    </div>
                  </div>
                  {Object.keys(legendResult).length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-[#2c2f52]">
                      {legendTeamMode && teams.length >= 2 ? (
                        <>
                          {teams.map((team, ti) => (
                            <div key={ti} className={ti > 0 ? 'border-t border-zinc-100 dark:border-[#2c2f52]' : ''}>
                              <p className={`px-4 py-1.5 text-xs font-semibold text-white ${TEAM_HEADER[ti % TEAM_HEADER.length]}`}>
                                {teamNames[ti] ?? team.name}
                              </p>
                              <ul className="divide-y divide-zinc-100 dark:divide-[#2c2f52]">
                                {team.players.map((p, idx) => {
                                  const legend = legendResult[p.name];
                                  if (!legend) return null;
                                  return (
                                    <li key={idx} className="flex items-center justify-between px-4 py-2.5">
                                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[legend.role]}`}>
                                          {legend.role}
                                        </span>
                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{legend.name}</span>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </>
                      ) : (
                        <ul className="divide-y divide-zinc-100 dark:divide-[#2c2f52]">
                          {custom.players.map((p, idx) => {
                            const legend = legendResult[p.name];
                            if (!legend) return null;
                            return (
                              <li key={idx} className="flex items-center justify-between px-4 py-2.5">
                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[legend.role]}`}>
                                    {legend.role}
                                  </span>
                                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{legend.name}</span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── 武器縛り ── */}
            <div className={`rounded-xl border bg-white dark:bg-[#20213a] overflow-hidden transition-colors ${openWeapon ? 'border-indigo-300 dark:border-indigo-700' : 'border-zinc-200 dark:border-[#2c2f52]'}`}>
              <button
                onClick={() => {
                  const next = !openWeapon;
                  setOpenWeapon(next);
                  if (!next && custom) persist({ ...custom, weaponRestriction: [] });
                }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${openWeapon ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500' : 'border-zinc-300 dark:border-[#4a4e7a]'}`}>
                  {openWeapon && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">武器縛り</p>
                  <p className="text-xs text-zinc-400">使用できる武器スロットを選択</p>
                </div>
                {(custom.weaponRestriction ?? []).length > 0 && !openWeapon && (
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                    スロット {[...(custom.weaponRestriction ?? [])].sort().join('・')}
                  </span>
                )}
              </button>

              {openWeapon && (
                <div className="border-t border-zinc-100 p-4 dark:border-[#2c2f52]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">選択数</span>
                      <div className="flex gap-1">
                        {(['random', 1, 2, 3, 4, 5] as (number | 'random')[]).map((v) => (
                          <button
                            key={v}
                            onClick={() => setRandomSlotCount(v)}
                            className={`h-7 min-w-[1.75rem] rounded-lg px-1.5 text-xs font-semibold transition-colors ${
                              randomSlotCount === v
                                ? 'bg-indigo-600 text-white'
                                : 'border border-zinc-200 text-zinc-500 hover:border-indigo-400 hover:text-indigo-500 dark:border-[#383c68] dark:text-zinc-400'
                            }`}
                          >
                            {v === 'random' ? '？' : v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={randomWeaponSlot}
                      disabled={slotAnimating}
                      className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-500 hover:bg-violet-100 disabled:opacity-50 active:scale-95 transition-transform dark:bg-violet-900/30 dark:text-violet-400"
                    >
                      🎲 ランダム
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const active = displayedSlots.includes(String(num));
                      return (
                        <button
                          key={num}
                          onClick={() => toggleWeaponSlot(num)}
                          disabled={slotAnimating}
                          className={`relative flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold transition-all duration-100 ${
                            active
                              ? 'bg-indigo-600 text-white shadow-lg scale-110'
                              : 'border-2 border-zinc-200 text-zinc-400 hover:border-indigo-400 hover:text-indigo-500 dark:border-[#383c68] dark:text-zinc-500'
                          } ${slotAnimating && active ? 'animate-bounce' : ''}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  {displayedSlots.length > 0 && (
                    <p className={`mt-3 text-sm transition-opacity ${slotAnimating ? 'opacity-0' : 'opacity-100'} text-zinc-500 dark:text-zinc-400`}>
                      スロット {displayedSlots.sort().join(' ・ ')} を使用
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── テキスト特別ルール ── */}
            <div className={`rounded-xl border bg-white dark:bg-[#20213a] overflow-hidden transition-colors ${openTextRules ? 'border-indigo-300 dark:border-indigo-700' : 'border-zinc-200 dark:border-[#2c2f52]'}`}>
              <button
                onClick={() => setOpenTextRules((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${openTextRules ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500' : 'border-zinc-300 dark:border-[#4a4e7a]'}`}>
                  {openTextRules && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">追加ルール</p>
                  <p className="text-xs text-zinc-400">独自のルールを追加</p>
                </div>
                {custom.specialRules.length > 0 && !openTextRules && (
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                    {custom.specialRules.length}件
                  </span>
                )}
              </button>

              {openTextRules && (
                <div className="border-t border-zinc-100 p-4 dark:border-[#2c2f52]">
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={ruleInput}
                      onChange={(e) => setRuleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRule()}
                      placeholder="例: 建物上禁止、ケアパケ武器禁止など"
                      className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50 dark:placeholder-zinc-500"
                    />
                    <button
                      onClick={addRule}
                      className="shrink-0 rounded-2xl bg-violet-50 px-5 py-2.5 text-sm font-bold text-violet-500 hover:bg-violet-100 active:scale-95 transition-transform dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
                    >
                      追加
                    </button>
                  </div>
                  {custom.specialRules.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-zinc-200 py-8 text-center dark:border-[#383c68]">
                      <p className="text-sm text-zinc-400">ルールがまだありません</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {custom.specialRules.map((rule, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-[#2c2f52] dark:bg-[#272847]"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{rule}</span>
                          <button onClick={() => removeRule(i)} className="shrink-0 text-zinc-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
