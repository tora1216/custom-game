export type WeaponCategory =
  | 'アサルトライフル'
  | 'SMG'
  | 'ショットガン'
  | 'LMG'
  | 'スナイパー'
  | 'マークスマン'
  | 'ハンドガン';

export type Weapon = {
  name: string;
  category: WeaponCategory;
};

export const WEAPON_CATEGORIES: WeaponCategory[] = [
  'アサルトライフル',
  'SMG',
  'ショットガン',
  'LMG',
  'スナイパー',
  'マークスマン',
  'ハンドガン',
];

export const CATEGORY_COLORS: Record<WeaponCategory, string> = {
  アサルトライフル: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SMG:             'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  ショットガン:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  LMG:             'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  スナイパー:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  マークスマン:     'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ハンドガン:       'bg-zinc-100 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300',
};

export const WEAPONS: Weapon[] = [
  // アサルトライフル
  { name: 'R-301',      category: 'アサルトライフル' },
  { name: 'フラットライン', category: 'アサルトライフル' },
  { name: 'ヘムロック',  category: 'アサルトライフル' },
  { name: 'ネメシス',    category: 'アサルトライフル' },
  // SMG
  { name: 'R-99',       category: 'SMG' },
  { name: 'ボルト',      category: 'SMG' },
  { name: 'CAR',        category: 'SMG' },
  { name: 'プラウラー',  category: 'SMG' },
  { name: 'オルタネーター', category: 'SMG' },
  // ショットガン
  { name: 'ピースキーパー', category: 'ショットガン' },
  { name: 'EVA-8',      category: 'ショットガン' },
  { name: 'マスティフ',  category: 'ショットガン' },
  { name: 'モザンビーク', category: 'ショットガン' },
  // LMG
  { name: 'スピットファイア', category: 'LMG' },
  { name: 'デボーション',   category: 'LMG' },
  { name: 'L-STAR',     category: 'LMG' },
  { name: 'ランページ',  category: 'LMG' },
  // スナイパー
  { name: 'ロングボウ',  category: 'スナイパー' },
  { name: 'センチネル',  category: 'スナイパー' },
  { name: 'チャージライフル', category: 'スナイパー' },
  { name: 'クレーバー',  category: 'スナイパー' },
  // マークスマン
  { name: 'トリプルテイク', category: 'マークスマン' },
  { name: '30-30',      category: 'マークスマン' },
  { name: 'G7スカウト',  category: 'マークスマン' },
  { name: 'ボセック',    category: 'マークスマン' },
  // ハンドガン
  { name: 'ウィングマン', category: 'ハンドガン' },
  { name: 'RE-45',      category: 'ハンドガン' },
  { name: 'P2020',      category: 'ハンドガン' },
];

export const WEAPON_SLOTS = 5;
