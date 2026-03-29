export type LegendRole = 'アサルト' | 'スカーミッシャー' | 'スキャン' | 'サポート' | 'コントローラー';

export type Legend = {
  name: string;
  role: LegendRole;
};

export const LEGEND_ROLES: LegendRole[] = [
  'アサルト',
  'スカーミッシャー',
  'スキャン',
  'サポート',
  'コントローラー',
];

export const ROLE_COLORS: Record<LegendRole, string> = {
  アサルト:       'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  スカーミッシャー: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  スキャン:       'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  サポート:       'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  コントローラー:  'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export const LEGENDS: Legend[] = [
  // アサルト
  { name: 'アッシュ',        role: 'アサルト' },
  { name: 'バンガロール',     role: 'アサルト' },
  { name: 'フューズ',        role: 'アサルト' },
  { name: 'レヴナント',      role: 'アサルト' },
  { name: 'マッドマギー',     role: 'アサルト' },
  { name: 'バリスティック',   role: 'アサルト' },
  { name: 'オルター',        role: 'アサルト' },
  // スカーミッシャー
  { name: 'レイス',          role: 'スカーミッシャー' },
  { name: 'オクタン',        role: 'スカーミッシャー' },
  { name: 'パスファインダー', role: 'スカーミッシャー' },
  { name: 'ホライゾン',      role: 'スカーミッシャー' },
  { name: 'ミラージュ',      role: 'スカーミッシャー' },
  // スキャン
  { name: 'ブラッドハウンド', role: 'スキャン' },
  { name: 'クリプト',        role: 'スキャン' },
  { name: 'シア',            role: 'スキャン' },
  { name: 'ヴァンテージ',    role: 'スキャン' },
  { name: 'ヴァルキリー',    role: 'スキャン' },
  // サポート
  { name: 'ライフライン',     role: 'サポート' },
  { name: 'ニューキャッスル', role: 'サポート' },
  { name: 'ローバ',          role: 'サポート' },
  { name: 'コンジット',      role: 'サポート' },
  { name: 'ジブラルタル',    role: 'サポート' },
  // コントローラー
  { name: 'コースティック',   role: 'コントローラー' },
  { name: 'ワットソン',      role: 'コントローラー' },
  { name: 'ランパート',      role: 'コントローラー' },
  { name: 'カタリスト',      role: 'コントローラー' },
];

/** 除外ロールを除いたプールからプレイヤー数分ランダムに割り当てる */
export function assignLegends(
  playerNames: string[],
  excludedRoles: string[],
): Record<string, Legend> {
  const pool = LEGENDS.filter((l) => !excludedRoles.includes(l.role));
  if (pool.length === 0) return {};

  // Fisher-Yates shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const result: Record<string, Legend> = {};
  playerNames.forEach((name, i) => {
    result[name] = shuffled[i % shuffled.length];
  });
  return result;
}
