export const RANKS = ['ブロンズ', 'シルバー', 'ゴールド', 'プラチナ', 'ダイヤ', 'マスター', 'プレデター'] as const;
export type Rank = (typeof RANKS)[number];

export const RANK_POINTS: Record<Rank, number> = {
  ブロンズ: 1,
  シルバー: 2,
  ゴールド: 3,
  プラチナ: 4,
  ダイヤ: 5,
  マスター: 6,
  プレデター: 7,
};

export const RANK_COLORS: Record<Rank, string> = {
  ブロンズ: 'bg-amber-700 text-white',
  シルバー: 'bg-slate-400 text-white',
  ゴールド: 'bg-yellow-400 text-black',
  プラチナ: 'bg-teal-400 text-black',
  ダイヤ: 'bg-cyan-500 text-white',
  マスター: 'bg-purple-600 text-white',
  プレデター: 'bg-red-600 text-white',
};

// バトルロイアルモード用のランク制限ポイント表
export const BR_RANKS = [
  'プレデター',
  'マスター',
  'ダイヤ1',
  'ダイヤ2',
  'ダイヤ3',
  'ダイヤ4',
  'プラチナ1',
  'プラチナ2',
  'プラチナ3',
  'プラチナ4',
  'ゴールド',
  'シルバー',
  'ブロンズ',
  'ルーキー',
] as const;
export type BRRank = (typeof BR_RANKS)[number];

// カスタムごとに編集可能なランク制限ポイントのデフォルト値
export const DEFAULT_BR_RANK_POINTS: Record<BRRank, number> = {
  プレデター: 15,
  マスター: 12,
  ダイヤ1: 10,
  ダイヤ2: 9,
  ダイヤ3: 8,
  ダイヤ4: 7,
  プラチナ1: 6,
  プラチナ2: 5,
  プラチナ3: 5,
  プラチナ4: 5,
  ゴールド: 5,
  シルバー: 5,
  ブロンズ: 5,
  ルーキー: 5,
};

export const BR_RANK_COLORS: Record<BRRank, string> = {
  プレデター: 'bg-red-600 text-white',
  マスター: 'bg-purple-600 text-white',
  ダイヤ1: 'bg-cyan-600 text-white',
  ダイヤ2: 'bg-cyan-500 text-white',
  ダイヤ3: 'bg-cyan-400 text-black',
  ダイヤ4: 'bg-cyan-300 text-black',
  プラチナ1: 'bg-teal-500 text-black',
  プラチナ2: 'bg-teal-400 text-black',
  プラチナ3: 'bg-teal-300 text-black',
  プラチナ4: 'bg-teal-200 text-black',
  ゴールド: 'bg-yellow-400 text-black',
  シルバー: 'bg-slate-400 text-white',
  ブロンズ: 'bg-amber-700 text-white',
  ルーキー: 'bg-zinc-300 text-black',
};

export const DEFAULT_BR_TEAM_POINT_CAP = 25;
export const DEFAULT_BR_FEMALE_DISCOUNT = 2;
export const DEFAULT_BR_FEMALE_DISCOUNT_ENABLED = true;

export type BRRankPointSettings = {
  rankPoints: Record<BRRank, number>;
  teamPointCap: number;
  femaleDiscount: number;
  femaleDiscountEnabled: boolean;
};

// ハンデ機能: ON/OFF切り替え可能な各種ハンデ
export type BRHandicapSettings = {
  // 例: 上限25pt・チーム20ptなら5ptハンデとして加算
  capShortfallBonus: boolean;
};

export const DEFAULT_BR_HANDICAPS: BRHandicapSettings = {
  capShortfallBonus: false,
};

export type Player = {
  name: string;
  rank: Rank;
  brRank?: BRRank;
  isFemale?: boolean;
};

// 1試合ごとのキル数・順位
export type BRMatchResult = {
  kills: number;
  placement: number | null; // 1位=1, 未設定はnull
};

// バトルロイアルモードでは、プレイヤー個人ではなくチーム単位で参加登録する
export type BRTeam = {
  id: string;
  name: string;
  players: Player[];
  matches: BRMatchResult[]; // index 0 = 試合1
};

// 順位ボーナス（配列のindex 0 = 1位の点数）。
// 1位12/2位9/3位7/4位5/5位4/6-7位3/8-10位2/11-15位1/16-20位0
export const DEFAULT_PLACEMENT_BONUS = [
  12, 9, 7, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
];
export const DEFAULT_KILL_POINT_VALUE = 1;
// キルポイント上限（配列のindex 0 = 1試合目の上限）。配列外の試合は上限なし。
export const DEFAULT_KILL_POINT_CAPS: (number | null)[] = [6, 6];
export const DEFAULT_KILL_POINT_CAPS_ENABLED = true;

export type BRMatchSettings = {
  killPointValue: number;
  placementBonus: number[];
  killPointCaps: (number | null)[];
  killPointCapsEnabled: boolean;
};

export type BRMatchScoreBreakdown = {
  killPoints: number;
  placementPoints: number;
  total: number;
};

export function brMatchScoreBreakdown(
  result: BRMatchResult,
  settings: BRMatchSettings,
  matchIndex: number,
): BRMatchScoreBreakdown {
  const rawKillPoints = result.kills * settings.killPointValue;
  const cap = settings.killPointCapsEnabled ? settings.killPointCaps[matchIndex] : null;
  const killPoints = cap != null ? Math.min(rawKillPoints, cap) : rawKillPoints;
  const placementPoints = result.placement != null ? (settings.placementBonus[result.placement - 1] ?? 0) : 0;
  return { killPoints, placementPoints, total: killPoints + placementPoints };
}

export function brMatchScore(result: BRMatchResult, settings: BRMatchSettings, matchIndex: number): number {
  return brMatchScoreBreakdown(result, settings, matchIndex).total;
}

export function brTeamTotalScore(team: BRTeam, settings: BRMatchSettings): number {
  return team.matches.reduce((sum, m, i) => sum + brMatchScore(m, settings, i), 0);
}

export const MODES = ['バトルロイアル：トリオ', 'バトルロイアル：デュオ', 'チームデスマッチ'] as const;
export type Mode = (typeof MODES)[number];

export function isBRMode(mode: Mode): boolean {
  return mode.startsWith('バトルロイアル');
}

export type Custom = {
  id: string;
  name: string;
  mode: Mode;
  players: Player[];
  brTeams: BRTeam[];
  brMatch: BRMatchSettings;
  brMatchCount: number;
  brRankPoints: BRRankPointSettings;
  brHandicaps: BRHandicapSettings;
  specialRules: string[];
  legendExcludedRoles: string[];
  weaponRestriction: string[]; // 長さ5のスロット配列、空文字は未選択
  createdAt: string;
};
