import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, Settings, LogOut, Trash2, Check, Loader2 } from 'lucide-react';
import { GithubSVG, SunMoonToggleSVG } from './BrandIcons';

interface HeaderProps {
  activeRepo: string | null;
  recentRepos: string[];
  onSelectRepo: (repoUrl: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onOpenSettings: () => void;
  onSignOutAndClear: () => void;
  clearingData?: boolean;
}

export default function Header({
  activeRepo,
  recentRepos,
  onSelectRepo,
  theme,
  toggleTheme,
  onOpenMobileMenu,
  onOpenSettings,
  onSignOutAndClear,
  clearingData = false,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [repoMenuOpen, setRepoMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const repoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (repoRef.current && !repoRef.current.contains(e.target as Node)) {
        setRepoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shortRepoName = activeRepo
    ? activeRepo.replace('https://github.com/', '').split('/').slice(0, 2).join('/')
    : 'owner/repo';

  
  const activeRepoOnlyName = activeRepo
    ? activeRepo.replace('https://github.com/', '').split('/')[1] ||
      activeRepo.replace('https://github.com/', '')
    : 'Owner';

  const avatarInitial = activeRepoOnlyName.charAt(0).toUpperCase() || 'O';

  return (
    <header className="px-4 md:px-8 pt-4 pb-2 flex justify-between items-center z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative" ref={repoRef}>
          <button
            onClick={() => setRepoMenuOpen(!repoMenuOpen)}
            className="flex items-center gap-2 bg-white dark:bg-[#131B2E] border border-slate-200/90 dark:border-slate-700/80 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer"
          >
            <GithubSVG className="w-4 h-4 text-slate-800 dark:text-white shrink-0" />
            <span
              className={`max-w-[140px] sm:max-w-[220px] truncate font-mono ${
                activeRepo ? 'text-slate-800 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {shortRepoName}
            </span>
            {recentRepos.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 dark:bg-indigo-950/80 text-blue-600 dark:text-indigo-400">
                {recentRepos.length}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {repoMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                <span>Ingested Repositories</span>
                <span>{recentRepos.length} Active</span>
              </div>
              {recentRepos.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                  No repositories ingested yet. Ingest a GitHub repository below to activate it.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentRepos.map((r) => {
                    const label = r.replace('https://github.com/', '');
                    const isCurrent = r === activeRepo;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          onSelectRepo(r);
                          setRepoMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-50/70 dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="truncate font-mono">{label}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="p-2 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-purple-500 shadow-xs transition cursor-pointer"
        >
          <SunMoonToggleSVG theme={theme} />
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            disabled={clearingData}
            className="flex items-center gap-2 bg-white dark:bg-[#131B2E] border border-slate-200/90 dark:border-slate-700/80 pl-2 pr-3 py-1 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:border-blue-400 transition cursor-pointer disabled:opacity-50"
          >
            <div className="w-6 h-6 bg-blue-600 dark:bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
              {clearingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : avatarInitial}
            </div>
            <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate">
              {activeRepoOnlyName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {activeRepoOnlyName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {activeRepo ? shortRepoName : 'Workspace & Graph Administrator'}
                </p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onOpenSettings();
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Preferences & Theme
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onSignOutAndClear();
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-slate-400" /> Clear Graph & Reset
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onSignOutAndClear();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out (Wipe DB Data)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}