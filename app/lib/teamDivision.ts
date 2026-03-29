import { Player, RANK_POINTS } from './types';

export type Team = {
  name: string;
  players: Player[];
  totalPoints: number;
};

const TEAM_NAMES = ['チームA', 'チームB', 'チームC', 'チームD', 'チームE', 'チームF'];

/**
 * スネークドラフト方式でプレイヤーをチームに均等配分する。
 * 例: 3チーム → A B C C B A A B C ...
 */
export function divideTeams(players: Player[], numTeams: number): Team[] {
  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    name: TEAM_NAMES[i] ?? `チーム${i + 1}`,
    players: [],
    totalPoints: 0,
  }));

  const sorted = [...players].sort(
    (a, b) => RANK_POINTS[b.rank] - RANK_POINTS[a.rank],
  );

  let direction = 1;
  let idx = 0;

  for (const player of sorted) {
    teams[idx].players.push(player);
    teams[idx].totalPoints += RANK_POINTS[player.rank];

    const next = idx + direction;
    if (next >= numTeams) {
      direction = -1;
      idx = numTeams - 1;
    } else if (next < 0) {
      direction = 1;
      idx = 0;
    } else {
      idx = next;
    }
  }

  return teams;
}

export type DivisionMode = 'balanced' | 'random';

/**
 * 完全ランダムでプレイヤーをチームに配分する。
 */
export function divideTeamsRandom(players: Player[], numTeams: number): Team[] {
  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    name: TEAM_NAMES[i] ?? `チーム${i + 1}`,
    players: [],
    totalPoints: 0,
  }));

  const shuffled = [...players].sort(() => Math.random() - 0.5);

  shuffled.forEach((player, i) => {
    const t = teams[i % numTeams];
    t.players.push(player);
    t.totalPoints += RANK_POINTS[player.rank];
  });

  return teams;
}

/**
 * 各チームのハンデ（最強チームとの差）を返す。
 * 差が大きいほどそのチームは有利になるべき。
 */
export function calcHandicap(teams: Team[]): number[] {
  if (teams.length === 0) return [];
  const max = Math.max(...teams.map((t) => t.totalPoints));
  return teams.map((t) => max - t.totalPoints);
}

/**
 * ポイント差からハンデの提案文を返す。
 */
export function handicapSuggestion(diff: number): string {
  if (diff === 0) return 'ハンデなし（均等）';
  if (diff <= 2) return `軽度のハンデ推奨（例: キル数 −1、回復アイテム −1個 など）`;
  if (diff <= 5) return `中程度のハンデ推奨（例: キル数 −2、スタート装備なし など）`;
  return `大きなハンデ推奨（例: 人数差、ハンデスポーン など）`;
}
