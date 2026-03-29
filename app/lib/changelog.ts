export const APP_VERSION = '1.0.0';

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  changes: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-03-29',
    title: '初回リリース',
    changes: [
      'カスタム作成・編集・削除',
      'プレイヤー登録とランク設定（ブロンズ〜プレデター）',
      'チーム分け（レベル順 / ランダム）',
      'マップルーレット（使用しないマップの除外機能付き）',
      'レジェンド縛り（ロール除外・チーム別同構成モード）',
      '武器縛り（ランダム選択）',
      '追加ルール設定',
    ],
  },
];
