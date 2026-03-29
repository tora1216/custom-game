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

export type Player = {
  name: string;
  rank: Rank;
};

export type Custom = {
  id: string;
  name: string;
  players: Player[];
  specialRules: string[];
  legendExcludedRoles: string[];
  weaponRestriction: string[]; // 長さ5のスロット配列、空文字は未選択
  createdAt: string;
};
