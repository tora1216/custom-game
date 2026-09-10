'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Custom,
  BRTeam,
  BRRank,
  BRMatchResult,
  BRMatchSettings,
  BRRankPointSettings,
  BR_RANKS,
  BR_RANK_COLORS,
  Player,
  DEFAULT_KILL_POINT_VALUE,
  DEFAULT_PLACEMENT_BONUS,
  DEFAULT_KILL_POINT_CAPS,
  DEFAULT_KILL_POINT_CAPS_ENABLED,
  DEFAULT_BR_RANK_POINTS,
  DEFAULT_BR_TEAM_POINT_CAP,
  DEFAULT_BR_FEMALE_DISCOUNT,
  DEFAULT_BR_FEMALE_DISCOUNT_ENABLED,
  DEFAULT_BR_HANDICAPS,
  brMatchScore,
  brMatchScoreBreakdown,
} from '../../lib/types';
import { brPlayerPoints, brHandicapBonus, brTeamGrandTotal } from '../../lib/teamDivision';

const STORAGE_KEY = 'customs';
const TEAM_HEADER = [
  'bg-indigo-600',
  'bg-rose-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-purple-600',
  'bg-cyan-600',
];

function emptyMatchResult(): BRMatchResult {
  return { kills: 0, placement: null };
}

function BRTeamCard({
  team,
  index,
  teamCount,
  matchResult,
  matchNumber,
  matchSettings,
  rankPointSettings,
  handicapEnabled,
  takenPlacements,
  onRename,
  onRemoveTeam,
  onRenamePlayer,
  onRankChange,
  onToggleFemale,
  onKillsChange,
  onPlacementChange,
}: {
  team: BRTeam;
  index: number;
  teamCount: number;
  matchResult: BRMatchResult;
  matchNumber: number;
  matchSettings: BRMatchSettings;
  rankPointSettings: BRRankPointSettings;
  handicapEnabled: boolean;
  takenPlacements: Set<number>;
  onRename: (name: string) => void;
  onRemoveTeam: () => void;
  onRenamePlayer: (playerIdx: number, name: string) => void;
  onRankChange: (playerIdx: number, rank: BRRank) => void;
  onToggleFemale: (playerIdx: number) => void;
  onKillsChange: (kills: number) => void;
  onPlacementChange: (placement: number | null) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.name);

  const totalPoints = team.players.reduce((sum, p) => sum + brPlayerPoints(p, rankPointSettings), 0);
  const overCap = totalPoints > rankPointSettings.teamPointCap;
  const shortfallBonus = handicapEnabled && !overCap ? rankPointSettings.teamPointCap - totalPoints : 0;
  const scoreBreakdown = brMatchScoreBreakdown(matchResult, matchSettings, matchNumber - 1);

  function commitName() {
    onRename(nameDraft.trim() || team.name);
    setEditingName(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-[#2c2f52] dark:bg-[#20213a] overflow-hidden">
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 ${TEAM_HEADER[index % TEAM_HEADER.length]}`}>
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') setEditingName(false);
            }}
            className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-white/50 outline-none border-b border-white/50 min-w-0"
          />
        ) : (
          <button
            onClick={() => { setNameDraft(team.name); setEditingName(true); }}
            className="flex items-center gap-1 text-sm font-semibold text-white hover:opacity-75 transition-opacity min-w-0"
          >
            <span className="truncate">{team.name}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <span className={`text-xs font-semibold ${overCap ? 'text-red-200' : 'text-white/70'}`}>
            {totalPoints}pt{overCap ? '（上限超過）' : ''}
            {shortfallBonus > 0 ? `（+${shortfallBonus}pt）` : ''}
          </span>
          <button
            onClick={() => { if (window.confirm(`「${team.name}」を削除しますか？`)) onRemoveTeam(); }}
            aria-label="チーム削除"
            className="text-white/70 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
          </button>
        </div>
      </div>

      {team.players.length === 0 ? (
        <p className="px-3 py-3 text-xs text-zinc-400">プレイヤー未登録</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-[#2c2f52]">
          {team.players.map((p, j) => {
            const brRank = p.brRank ?? 'ルーキー';
            return (
              <li key={j} className="flex items-center gap-1 px-3 py-1.5">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => onRenamePlayer(j, e.target.value)}
                  title={p.name}
                  className="min-w-[64px] flex-1 truncate rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-zinc-800 outline-none focus:border-zinc-300 focus:bg-zinc-50 dark:text-zinc-200 dark:focus:border-zinc-600 dark:focus:bg-[#272847]"
                />
                <select
                  value={brRank}
                  onChange={(e) => onRankChange(j, e.target.value as BRRank)}
                  className={`w-24 shrink-0 rounded-full border-0 px-1.5 py-0.5 text-center text-xs font-semibold ${BR_RANK_COLORS[brRank]}`}
                >
                  {BR_RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {rankPointSettings.femaleDiscountEnabled && (
                  <button
                    onClick={() => onToggleFemale(j)}
                    title={`性別（女性−${rankPointSettings.femaleDiscount}pt）`}
                    className={`shrink-0 text-sm hover:opacity-70 ${p.isFemale ? 'text-pink-400' : 'text-blue-400'}`}
                  >
                    {p.isFemale ? '♀' : '♂'}
                  </button>
                )}
                <span className="w-8 shrink-0 text-right text-xs font-medium text-zinc-400">{brPlayerPoints(p, rankPointSettings)}pt</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-1.5 border-t border-zinc-100 px-3 py-1.5 dark:border-[#2c2f52]">
        <span className="shrink-0 text-xs text-zinc-400">結果</span>
        <label className="ml-auto flex shrink-0 items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          キル
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={matchResult.kills}
            onChange={(e) => onKillsChange(Math.max(0, Number(e.target.value) || 0))}
            onFocus={(e) => e.target.select()}
            className="w-12 rounded-lg border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50"
          />
        </label>
        <label className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          順位
          <select
            value={matchResult.placement ?? ''}
            onChange={(e) => onPlacementChange(e.target.value === '' ? null : Number(e.target.value))}
            className="w-20 shrink-0 rounded-lg border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50"
          >
            <option value="">未設定</option>
            {Array.from({ length: teamCount }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p} disabled={takenPlacements.has(p)}>
                {p}位{takenPlacements.has(p) ? '（使用済み）' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-3 py-1 text-xs text-zinc-400 dark:border-[#2c2f52]">
        <span>キル{scoreBreakdown.killPoints}pt</span>
        <span>+</span>
        <span>順位{scoreBreakdown.placementPoints}pt</span>
        <span>=</span>
        <span className="font-bold text-indigo-600 dark:text-indigo-400">累計{scoreBreakdown.total}pt</span>
      </div>
    </div>
  );
}

function BRSettingsDialog({
  custom,
  onClose,
  onUpdateKillPointValue,
  onUpdatePlacementBonus,
  onUpdateKillPointCap,
  onUpdateRankPoint,
  onUpdateTeamPointCap,
  onUpdateFemaleDiscount,
  onUpdateFemaleDiscountEnabled,
  onUpdateCapShortfallHandicap,
  onUpdateKillPointCapsEnabled,
}: {
  custom: Custom;
  onClose: () => void;
  onUpdateKillPointValue: (value: number) => void;
  onUpdatePlacementBonus: (place: number, value: number) => void;
  onUpdateKillPointCap: (matchIdx: number, value: number | null) => void;
  onUpdateRankPoint: (rank: BRRank, value: number) => void;
  onUpdateTeamPointCap: (value: number) => void;
  onUpdateFemaleDiscount: (value: number) => void;
  onUpdateFemaleDiscountEnabled: (value: boolean) => void;
  onUpdateCapShortfallHandicap: (value: boolean) => void;
  onUpdateKillPointCapsEnabled: (value: boolean) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-[#20213a] mx-4">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">設定</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#272847]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 pb-6">
          {/* ランク制限ポイント表 */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="mb-3 text-sm font-bold text-amber-700 dark:text-amber-400">ランク制限ポイント</p>
            <div className="mb-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                1チーム上限
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={custom.brRankPoints.teamPointCap}
                  onChange={(e) => onUpdateTeamPointCap(Math.max(0, Number(e.target.value) || 0))}
                  onFocus={(e) => e.target.select()}
                  className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#20213a] dark:text-zinc-50"
                />
                pt
              </label>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {BR_RANKS.map((r) => (
                <label key={r} className="flex items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {r}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={custom.brRankPoints.rankPoints[r]}
                    onChange={(e) => onUpdateRankPoint(r, Math.max(0, Number(e.target.value) || 0))}
                    onFocus={(e) => e.target.select()}
                    className="w-14 rounded-lg border border-zinc-200 px-1.5 py-1 text-xs text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#20213a] dark:text-zinc-50"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 試合結果設定 */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#2c2f52] dark:bg-[#272847]">
            <p className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">試合結果設定</p>
            <label className="mb-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              キル1つあたり
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={custom.brMatch.killPointValue}
                onChange={(e) => onUpdateKillPointValue(Math.max(0, Number(e.target.value) || 0))}
                onFocus={(e) => e.target.select()}
                className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#20213a] dark:text-zinc-50"
              />
              pt
            </label>
            {custom.brTeams.length > 0 && (
              <>
                <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">順位ボーナス</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: custom.brTeams.length }, (_, i) => i + 1).map((place) => (
                    <label key={place} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {place}位
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={custom.brMatch.placementBonus[place - 1] ?? 0}
                        onChange={(e) => onUpdatePlacementBonus(place, Math.max(0, Number(e.target.value) || 0))}
                        onFocus={(e) => e.target.select()}
                        className="w-14 min-w-0 flex-1 rounded-lg border border-zinc-200 px-1.5 py-1 text-xs text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#20213a] dark:text-zinc-50"
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ハンデ設定 */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#2c2f52] dark:bg-[#272847]">
            <p className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">ハンデ設定</p>
            <div className="space-y-3">
              <label className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={custom.brRankPoints.femaleDiscountEnabled}
                  onChange={(e) => onUpdateFemaleDiscountEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300"
                />
                女性ディスカウント
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  disabled={!custom.brRankPoints.femaleDiscountEnabled}
                  value={custom.brRankPoints.femaleDiscount}
                  onChange={(e) => onUpdateFemaleDiscount(Math.max(0, Number(e.target.value) || 0))}
                  onFocus={(e) => e.target.select()}
                  className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 focus:border-emerald-400 focus:outline-none disabled:opacity-40 dark:border-[#383c68] dark:bg-[#20213a] dark:text-zinc-50"
                />
                pt
              </label>
              <label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={custom.brHandicaps.capShortfallBonus}
                  onChange={(e) => onUpdateCapShortfallHandicap(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300"
                />
                <span>
                  上限に満たなかった分をハンデとして加算
                  <br />
                  <span className="text-xs text-zinc-400">
                    （例: 25pt上限でチームが20ptの場合、5ptハンデ）
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* 特別ルール */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-[#2c2f52] dark:bg-[#272847]">
            <p className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">特別ルール</p>
            <label className="mb-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={custom.brMatch.killPointCapsEnabled}
                onChange={(e) => onUpdateKillPointCapsEnabled(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300"
              />
              キルポイント上限（試合ごと）を有効にする
            </label>
            <div className={`space-y-1.5 ${custom.brMatch.killPointCapsEnabled ? '' : 'opacity-40'}`}>
              {Array.from({ length: custom.brMatchCount }, (_, i) => i).map((matchIdx) => {
                const cap = custom.brMatch.killPointCaps[matchIdx] ?? null;
                return (
                  <div key={matchIdx} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="w-16 shrink-0">第{matchIdx + 1}試合</span>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={cap == null}
                        disabled={!custom.brMatch.killPointCapsEnabled}
                        onChange={(e) => onUpdateKillPointCap(matchIdx, e.target.checked ? null : 6)}
                        className="h-3.5 w-3.5 rounded border-zinc-300"
                      />
                      上限なし
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      disabled={cap == null || !custom.brMatch.killPointCapsEnabled}
                      value={cap ?? ''}
                      onChange={(e) => onUpdateKillPointCap(matchIdx, Math.max(0, Number(e.target.value) || 0))}
                      onFocus={(e) => e.target.select()}
                      className="w-16 rounded-lg border border-zinc-200 px-1.5 py-1 text-xs text-zinc-900 focus:border-emerald-400 focus:outline-none disabled:opacity-40 dark:border-[#383c68] dark:bg-[#20213a] dark:text-zinc-50"
                    />
                    <span>pt</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomDetailBR({ id }: { id: string }) {
  const [custom, setCustom] = useState<Custom | null>(null);

  // 設定ダイアログ開閉
  const [showSettings, setShowSettings] = useState(false);

  // 表示中の試合（0始まり）
  const [selectedMatch, setSelectedMatch] = useState(0);
  // 「合計」タブ表示中かどうか
  const [showTotal, setShowTotal] = useState(false);

  // テキスト共有トースト
  const [copyToast, setCopyToast] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all: Custom[] = JSON.parse(stored);
        const found = all.find((c) => c.id === id) ?? null;
        if (found) {
          if (!found.mode) found.mode = 'バトルロイアル：トリオ';
          if (!found.brTeams) found.brTeams = [];
          if (!found.brMatchCount) {
            found.brMatchCount = Math.max(
              1,
              ...found.brTeams.map((t) => (t as unknown as { matches?: unknown[] }).matches?.length ?? 1),
            );
          }
          found.brTeams = found.brTeams.map((t) => {
            const legacy = t as unknown as { kills?: number; placement?: number | null };
            const matches = t.matches ?? [{ kills: legacy.kills ?? 0, placement: legacy.placement ?? null }];
            const padded = Array.from({ length: found.brMatchCount }, (_, i) => matches[i] ?? emptyMatchResult());
            return { ...t, matches: padded };
          });
          if (!found.brMatch) {
            found.brMatch = {
              killPointValue: DEFAULT_KILL_POINT_VALUE,
              placementBonus: [...DEFAULT_PLACEMENT_BONUS],
              killPointCaps: [...DEFAULT_KILL_POINT_CAPS],
              killPointCapsEnabled: DEFAULT_KILL_POINT_CAPS_ENABLED,
            };
          }
          if (!found.brMatch.killPointCaps) found.brMatch.killPointCaps = [...DEFAULT_KILL_POINT_CAPS];
          if (found.brMatch.killPointCapsEnabled === undefined) {
            found.brMatch.killPointCapsEnabled = DEFAULT_KILL_POINT_CAPS_ENABLED;
          }
          if (!found.brRankPoints) {
            found.brRankPoints = {
              rankPoints: { ...DEFAULT_BR_RANK_POINTS },
              teamPointCap: DEFAULT_BR_TEAM_POINT_CAP,
              femaleDiscount: DEFAULT_BR_FEMALE_DISCOUNT,
              femaleDiscountEnabled: DEFAULT_BR_FEMALE_DISCOUNT_ENABLED,
            };
          }
          if (found.brRankPoints.femaleDiscountEnabled === undefined) {
            found.brRankPoints.femaleDiscountEnabled = DEFAULT_BR_FEMALE_DISCOUNT_ENABLED;
          }
          if (!found.brHandicaps) {
            found.brHandicaps = { ...DEFAULT_BR_HANDICAPS };
          }
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

  const teamSize = custom?.mode.includes('トリオ') ? 3 : 2;
  const maxTeamCount = teamSize === 3 ? 20 : 30;
  const matchCount = custom?.brMatchCount ?? 1;
  const currentMatch = Math.min(selectedMatch, matchCount - 1);

  function makeDefaultPlayer(n: number): Player {
    return { name: `プレイヤー${n}`, rank: 'ブロンズ', brRank: 'ルーキー', isFemale: false };
  }

  function makeDefaultTeam(n: number): BRTeam {
    return {
      id: crypto.randomUUID(),
      name: `チーム${n}`,
      players: Array.from({ length: teamSize }, (_, i) => makeDefaultPlayer(i + 1)),
      matches: Array.from({ length: matchCount }, () => emptyMatchResult()),
    };
  }

  function setTeamCount(newCount: number) {
    if (!custom) return;
    const current = custom.brTeams;
    if (newCount > current.length) {
      const added = Array.from({ length: newCount - current.length }, (_, i) =>
        makeDefaultTeam(current.length + i + 1),
      );
      persist({ ...custom, brTeams: [...current, ...added] });
    } else if (newCount < current.length) {
      const removed = current.slice(newCount);
      const names = removed.map((t) => t.name).join('、');
      if (!window.confirm(`参加チーム数を${newCount}に減らすと、以下のチームが削除されます。\n${names}\n\nよろしいですか？`)) {
        return;
      }
      persist({ ...custom, brTeams: current.slice(0, newCount) });
    }
  }

  function setMatchCount(newCount: number) {
    if (!custom) return;
    const clamped = Math.max(1, newCount);
    if (clamped < custom.brMatchCount) {
      if (
        !window.confirm(
          `試合数を${clamped}に減らすと、第${clamped + 1}試合以降の記録がすべてのチームで削除されます。よろしいですか？`,
        )
      ) {
        return;
      }
    }
    const nextTeams = custom.brTeams.map((t) => {
      const matches = [...t.matches];
      while (matches.length < clamped) matches.push(emptyMatchResult());
      while (matches.length > clamped) matches.pop();
      return { ...t, matches };
    });
    persist({ ...custom, brMatchCount: clamped, brTeams: nextTeams });
    setSelectedMatch((m) => Math.min(m, clamped - 1));
  }

  function removeTeam(teamIdx: number) {
    if (!custom) return;
    persist({ ...custom, brTeams: custom.brTeams.filter((_, i) => i !== teamIdx) });
  }

  function updateTeamMatch(teamIdx: number, matchIdx: number, patch: Partial<BRMatchResult>) {
    if (!custom) return;
    const next = custom.brTeams.map((t, i) =>
      i === teamIdx
        ? { ...t, matches: t.matches.map((m, j) => (j === matchIdx ? { ...m, ...patch } : m)) }
        : t,
    );
    persist({ ...custom, brTeams: next });
  }

  function updateKillPointValue(value: number) {
    if (!custom) return;
    persist({ ...custom, brMatch: { ...custom.brMatch, killPointValue: value } });
  }

  function updatePlacementBonus(place: number, value: number) {
    if (!custom) return;
    const next = [...custom.brMatch.placementBonus];
    next[place - 1] = value;
    persist({ ...custom, brMatch: { ...custom.brMatch, placementBonus: next } });
  }

  function updateKillPointCap(matchIdx: number, value: number | null) {
    if (!custom) return;
    const next = [...custom.brMatch.killPointCaps];
    while (next.length <= matchIdx) next.push(null);
    next[matchIdx] = value;
    persist({ ...custom, brMatch: { ...custom.brMatch, killPointCaps: next } });
  }

  function updateKillPointCapsEnabled(value: boolean) {
    if (!custom) return;
    persist({ ...custom, brMatch: { ...custom.brMatch, killPointCapsEnabled: value } });
  }

  function updateRankPoint(rank: BRRank, value: number) {
    if (!custom) return;
    persist({
      ...custom,
      brRankPoints: { ...custom.brRankPoints, rankPoints: { ...custom.brRankPoints.rankPoints, [rank]: value } },
    });
  }

  function updateTeamPointCap(value: number) {
    if (!custom) return;
    persist({ ...custom, brRankPoints: { ...custom.brRankPoints, teamPointCap: value } });
  }

  function updateFemaleDiscount(value: number) {
    if (!custom) return;
    persist({ ...custom, brRankPoints: { ...custom.brRankPoints, femaleDiscount: value } });
  }

  function updateFemaleDiscountEnabled(value: boolean) {
    if (!custom) return;
    persist({ ...custom, brRankPoints: { ...custom.brRankPoints, femaleDiscountEnabled: value } });
  }

  function updateCapShortfallHandicap(value: boolean) {
    if (!custom) return;
    persist({ ...custom, brHandicaps: { ...custom.brHandicaps, capShortfallBonus: value } });
  }

  function renameTeam(teamIdx: number, name: string) {
    if (!custom) return;
    const next = custom.brTeams.map((t, i) => (i === teamIdx ? { ...t, name } : t));
    persist({ ...custom, brTeams: next });
  }

  function updatePlayer(teamIdx: number, playerIdx: number, patch: Partial<Player>) {
    if (!custom) return;
    const next = custom.brTeams.map((t, i) =>
      i === teamIdx
        ? { ...t, players: t.players.map((p, j) => (j === playerIdx ? { ...p, ...patch } : p)) }
        : t,
    );
    persist({ ...custom, brTeams: next });
  }

  function copyShareText() {
    if (!custom) return;
    const lines: string[] = [`【${custom.name}】`];
    custom.brTeams.forEach((team) => {
      const players = team.players
        .map((p) => `${p.name}(${p.brRank ?? 'ルーキー'}${p.isFemale ? '・♀' : ''})`)
        .join(' / ');
      const total = brTeamGrandTotal(team, custom.brMatch, custom.brRankPoints, custom.brHandicaps);
      lines.push(`${team.name}: ${players}`);
      team.matches.forEach((m, i) => {
        const placement = m.placement != null ? `${m.placement}位` : '順位未設定';
        lines.push(`  第${i + 1}試合: キル${m.kills} / ${placement} / ${brMatchScore(m, custom.brMatch, i)}pt`);
      });
      const handicap = brHandicapBonus(team, custom.brRankPoints, custom.brHandicaps);
      if (handicap > 0) lines.push(`  ハンデ: +${handicap}pt`);
      lines.push(`  累計スコア: ${total}pt`);
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }

  if (!custom) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        カスタムが見つかりません
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#181926]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-[#2c2f52] dark:bg-[#20213a]/80">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1550px]">
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
              <p className="text-xs text-zinc-400">{custom.mode}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              aria-label="設定"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-[#272847] dark:hover:text-zinc-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              onClick={copyShareText}
              aria-label="テキストをコピー"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-[#272847] dark:hover:text-zinc-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-4 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1550px]">
        <div className="space-y-4">
          {/* 参加チーム */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">参加チーム数</p>
                <select
                  value={custom.brTeams.length}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-sm font-semibold text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50"
                >
                  {Array.from({ length: maxTeamCount + 1 }, (_, i) => i).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-xs text-zinc-400">1チーム{teamSize}人想定</span>
              </div>
            </div>

            {custom.brTeams.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-zinc-200 py-10 text-center dark:border-[#383c68]">
                <p className="text-sm text-zinc-400">上のプルダウンで参加チーム数を選んでください</p>
              </div>
            ) : (
              <>
                {/* 試合切り替え */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">試合数</span>
                  <select
                    value={matchCount}
                    onChange={(e) => setMatchCount(Number(e.target.value))}
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <div className="flex flex-1 flex-wrap gap-1">
                    {Array.from({ length: matchCount }, (_, i) => i).map((i) => (
                      <button
                        key={i}
                        onClick={() => { setShowTotal(false); setSelectedMatch(i); }}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          !showTotal && currentMatch === i
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-[#30335a] dark:text-zinc-400'
                        }`}
                      >
                        第{i + 1}試合
                      </button>
                    ))}
                    <button
                      onClick={() => setShowTotal(true)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        showTotal
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-[#30335a] dark:text-zinc-400'
                      }`}
                    >
                      ランキング
                    </button>
                  </div>
                </div>

                {showTotal ? (
                  <div className="sm:columns-2 sm:gap-4 sm:[column-rule:1px_solid_#e4e4e7] dark:sm:[column-rule-color:#2c2f52]">
                    {[...custom.brTeams]
                      .map((team) => {
                        const breakdowns = team.matches.map((m, idx) => brMatchScoreBreakdown(m, custom.brMatch, idx));
                        const totalKills = team.matches.reduce((sum, m) => sum + m.kills, 0);
                        const placements = team.matches
                          .map((m) => m.placement)
                          .filter((p): p is number => p != null);
                        const wins = placements.filter((p) => p === 1).length;
                        const bestPlacement = placements.length > 0 ? Math.min(...placements) : null;
                        return {
                          team,
                          total: brTeamGrandTotal(team, custom.brMatch, custom.brRankPoints, custom.brHandicaps),
                          handicap: brHandicapBonus(team, custom.brRankPoints, custom.brHandicaps),
                          totalKills,
                          wins,
                          bestPlacement,
                          perMatch: breakdowns.map((b) => b.total),
                        };
                      })
                      .sort((a, b) => b.total - a.total)
                      .map(({ team, total, handicap, totalKills, wins, bestPlacement, perMatch }, rank) => (
                        <div
                          key={team.id}
                          className="mb-1.5 break-inside-avoid rounded-xl border border-zinc-200 bg-white px-4 py-2.5 dark:border-[#2c2f52] dark:bg-[#20213a]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                              {rank + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{team.name}</p>
                                <p className="truncate text-xs text-zinc-400">
                                  {team.players.map((p) => p.name).join(' / ')}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-lg font-bold text-indigo-600 dark:text-indigo-400">{total}pt</span>
                          </div>
                          <p className="mt-1 pl-10 text-xs text-zinc-400">
                            合計キル{totalKills}
                            {wins > 0 ? ` ・ 優勝${wins}回` : ''}
                            {bestPlacement != null ? ` ・ 最高順位${bestPlacement}位` : ''}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 pl-10">
                            {perMatch.map((score, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-[#30335a] dark:text-zinc-400"
                              >
                                第{i + 1}試合 {score}pt
                              </span>
                            ))}
                            {handicap > 0 && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                ハンデ +{handicap}pt
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-xs text-zinc-400">
                      第{currentMatch + 1}試合のキルポイント上限:{' '}
                      {custom.brMatch.killPointCapsEnabled && custom.brMatch.killPointCaps[currentMatch] != null
                        ? `${custom.brMatch.killPointCaps[currentMatch]}pt`
                        : 'なし'}
                    </p>

                    <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {custom.brTeams.map((team, i) => {
                        const takenPlacements = new Set(
                          custom.brTeams
                            .filter((_, idx) => idx !== i)
                            .map((t) => t.matches[currentMatch]?.placement)
                            .filter((p): p is number => p != null),
                        );
                        return (
                          <BRTeamCard
                            key={team.id}
                            team={team}
                            index={i}
                            teamCount={custom.brTeams.length}
                            matchResult={team.matches[currentMatch] ?? emptyMatchResult()}
                            matchNumber={currentMatch + 1}
                            matchSettings={custom.brMatch}
                            rankPointSettings={custom.brRankPoints}
                            handicapEnabled={custom.brHandicaps.capShortfallBonus}
                            takenPlacements={takenPlacements}
                            onRename={(name) => renameTeam(i, name)}
                            onRemoveTeam={() => removeTeam(i)}
                            onRenamePlayer={(playerIdx, name) => updatePlayer(i, playerIdx, { name })}
                            onRankChange={(playerIdx, rank) => updatePlayer(i, playerIdx, { brRank: rank })}
                            onToggleFemale={(playerIdx) =>
                              updatePlayer(i, playerIdx, {
                                isFemale: !custom.brTeams[i].players[playerIdx].isFemale,
                              })
                            }
                            onKillsChange={(kills) => updateTeamMatch(i, currentMatch, { kills })}
                            onPlacementChange={(placement) => updateTeamMatch(i, currentMatch, { placement })}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* コピートースト */}
      <div
        className={`pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          copyToast ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400 dark:text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          コピーしました
        </div>
      </div>

      {showSettings && (
        <BRSettingsDialog
          custom={custom}
          onClose={() => setShowSettings(false)}
          onUpdateKillPointValue={updateKillPointValue}
          onUpdatePlacementBonus={updatePlacementBonus}
          onUpdateKillPointCap={updateKillPointCap}
          onUpdateRankPoint={updateRankPoint}
          onUpdateTeamPointCap={updateTeamPointCap}
          onUpdateFemaleDiscount={updateFemaleDiscount}
          onUpdateFemaleDiscountEnabled={updateFemaleDiscountEnabled}
          onUpdateCapShortfallHandicap={updateCapShortfallHandicap}
          onUpdateKillPointCapsEnabled={updateKillPointCapsEnabled}
        />
      )}

    </div>
  );
}
