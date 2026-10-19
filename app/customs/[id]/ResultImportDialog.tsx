'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { BRTeam } from '../../lib/types';
import {
  OCR_REF_HEIGHT,
  OCR_REF_WIDTH,
  OCR_ROW_LAYOUTS,
  OcrRect,
  binarizeForOcr,
  recognizeNumber,
  scaleRect,
} from '../../lib/resultOcr';

// 二値化前に数字の高さをこのピクセル数へ揃える
const OCR_CROP_HEIGHT = 60;

type ImportRow = {
  placement: number;
  teamNumber: number | null;
  kills: number | null;
  preview: string;
};

export type ImportedResult = { teamIdx: number; placement: number; kills: number };

function readRegion(image: HTMLImageElement, rect: OcrRect): number | null {
  const s = scaleRect(rect, image.naturalWidth, image.naturalHeight);
  const scale = OCR_CROP_HEIGHT / s.h;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(s.w * scale);
  canvas.height = Math.round(s.h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, s.x, s.y, s.w, s.h, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  binarizeForOcr(img.data, img.width, img.height);
  return recognizeNumber(img.data, img.width, img.height);
}

// 確認用に、元画像の該当行（チーム名〜キル数）を切り出す
function rowPreview(image: HTMLImageElement, placement: number): string {
  const row = OCR_ROW_LAYOUTS[placement - 1];
  const left = row.teamNumber.x < OCR_REF_WIDTH / 2;
  const rect = { x: left ? 270 : 788, y: row.kills.y, w: 460, h: row.kills.h };
  const s = scaleRect(rect, image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.height = 40;
  canvas.width = Math.round((s.w / s.h) * canvas.height);
  canvas.getContext('2d')?.drawImage(image, s.x, s.y, s.w, s.h, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL();
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を読み込めませんでした')); };
    img.src = url;
  });
}

export default function ResultImportDialog({
  teams,
  matchNumber,
  onApply,
  onClose,
}: {
  teams: BRTeam[];
  matchNumber: number;
  onApply: (results: ImportedResult[]) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: Blob) {
    setError(null);
    setWarning(null);
    try {
      const image = await loadImage(file);
      const ratio = image.naturalWidth / image.naturalHeight;
      if (Math.abs(ratio - OCR_REF_WIDTH / OCR_REF_HEIGHT) > 0.05) {
        setWarning('画像が16:9ではありません。画面全体のスクリーンショットでないと正しく読み取れない場合があります。');
      }
      setRows(
        OCR_ROW_LAYOUTS.map((layout) => ({
          placement: layout.placement,
          teamNumber: readRegion(image, layout.teamNumber),
          kills: readRegion(image, layout.kills),
          preview: rowPreview(image, layout.placement),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像を読み込めませんでした');
    }
  }

  // Ctrl+V でクリップボードの画像を貼り付け
  const onPaste = useEffectEvent((e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (file) {
      e.preventDefault();
      handleFile(file);
    }
  });
  useEffect(() => {
    const listener = (e: ClipboardEvent) => onPaste(e);
    document.addEventListener('paste', listener);
    return () => document.removeEventListener('paste', listener);
  }, []);

  function updateRow(idx: number, patch: Partial<ImportRow>) {
    setRows((prev) => prev && prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  // ゲーム内の「チーム N」はアプリの N 番目のチームに対応させる
  function findTeamIdx(teamNumber: number | null): number {
    if (teamNumber == null || teamNumber < 1 || teamNumber > teams.length) return -1;
    return teamNumber - 1;
  }

  const matched = (rows ?? []).map((r) => findTeamIdx(r.teamNumber));
  const duplicateTeamIdx = new Set(matched.filter((idx, i) => idx >= 0 && matched.indexOf(idx) !== i));
  const applicable = (rows ?? []).filter((_, i) => matched[i] >= 0);
  const canApply = applicable.length > 0 && duplicateTeamIdx.size === 0;

  function apply() {
    if (!rows || !canApply) return;
    onApply(
      rows.flatMap((r, i) =>
        matched[i] >= 0 ? [{ teamIdx: matched[i], placement: r.placement, kills: r.kills ?? 0 }] : [],
      ),
    );
  }

  const inputClass =
    'w-12 rounded-lg border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-900 focus:border-emerald-400 focus:outline-none dark:border-[#383c68] dark:bg-[#272847] dark:text-zinc-50';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-[#20213a] mx-4">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            第{matchNumber}試合 リザルト画像から入力
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#272847]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 px-6 pb-6">
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragging
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-zinc-200 hover:border-indigo-300 dark:border-[#383c68]'
            }`}
          >
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {rows ? '別の画像を選ぶ' : '「マッチリザルト」画面のスクリーンショットを選択'}
            </span>
            <span className="mt-1 text-xs text-zinc-400">クリックで選択 / ドラッグ&ドロップ / Ctrl+V で貼り付け</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {warning && <p className="text-xs text-amber-600 dark:text-amber-400">{warning}</p>}

          {rows && (
            <>
              <p className="text-xs text-zinc-400">
                読み取り結果を画像と見比べて、違っていれば修正してください。ゲーム内の「チーム N」は、上から N 番目のチームに反映されます。
              </p>
              <ul className="divide-y divide-zinc-100 dark:divide-[#2c2f52]">
                {rows.map((r, i) => {
                  const teamIdx = matched[i];
                  const isDuplicate = duplicateTeamIdx.has(teamIdx);
                  return (
                    <li key={r.placement} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5">
                      <span className="w-8 shrink-0 text-sm font-bold text-zinc-700 dark:text-zinc-300">#{r.placement}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.preview} alt="" className="h-auto max-h-9 min-w-0 flex-1 rounded object-contain object-left" />
                      <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        チーム
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={r.teamNumber ?? ''}
                          onChange={(e) => updateRow(i, { teamNumber: e.target.value === '' ? null : Number(e.target.value) })}
                          onFocus={(e) => e.target.select()}
                          className={inputClass}
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        キル
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={r.kills ?? ''}
                          onChange={(e) => updateRow(i, { kills: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
                          onFocus={(e) => e.target.select()}
                          className={inputClass}
                        />
                      </label>
                      <span
                        className={`w-24 shrink-0 truncate text-right text-xs ${
                          isDuplicate
                            ? 'font-semibold text-red-500'
                            : teamIdx >= 0
                              ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-400'
                        }`}
                      >
                        {teamIdx >= 0
                          ? `→ ${teams[teamIdx].name}${isDuplicate ? '（重複）' : ''}`
                          : r.teamNumber == null
                            ? '読み取れず'
                            : '該当チームなし'}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-end gap-3 pt-2">
                <span className="text-xs text-zinc-400">{applicable.length}チームに反映</span>
                <button
                  onClick={apply}
                  disabled={!canApply}
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 active:scale-95 transition-transform"
                >
                  反映する
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
