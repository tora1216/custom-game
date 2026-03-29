'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import ChangelogDialog from './ChangelogDialog';

type Props = {
  right?: React.ReactNode;
};

export default function AppHeader({ right }: Props) {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-[#2c2f52] dark:bg-[#20213a]/80">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">🐯</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-50">カスタム管理</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              aria-label="設定"
              onClick={() => setShowChangelog(true)}
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-[#272847] dark:hover:text-zinc-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            {right}
          </div>
        </div>
      </header>

      {showChangelog && <ChangelogDialog onClose={() => setShowChangelog(false)} />}
    </>
  );
}
