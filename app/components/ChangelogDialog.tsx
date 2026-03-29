'use client';

import { CHANGELOG, APP_VERSION } from '../lib/changelog';

type Props = {
  onClose: () => void;
};

export default function ChangelogDialog({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-[#20213a] mx-4" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">アップデート情報</h2>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              v{APP_VERSION}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#272847]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Changelog list */}
        <div className="min-h-0 overflow-y-auto px-6 pb-6">
          <div className="space-y-4">
            {CHANGELOG.map((entry, i) => (
              <div
                key={entry.version}
                className="rounded-xl border border-zinc-200 dark:border-[#2c2f52] overflow-hidden"
              >
                {/* Version header */}
                <div className="flex items-center justify-between bg-zinc-50 px-4 py-3 dark:bg-[#272847]">
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      i === 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-[#383c68] dark:text-zinc-300'
                    }`}>
                      v{entry.version}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">{entry.title}</span>
                  </div>
                  <span className="text-xs text-zinc-400">{entry.date}</span>
                </div>

                {/* Changes */}
                <ul className="space-y-1.5 p-4">
                  {entry.changes.map((change, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
