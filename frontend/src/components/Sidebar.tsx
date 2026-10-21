import type { ComponentType } from 'react';
import { Home, Database, MessageSquare, Clock, Network, Settings, Lightbulb, X } from 'lucide-react';
import { BrandLogoSVG, Neo4jSVG, GeminiSVG, GroqSVG, GithubSVG, GraphRagSVG } from './BrandIcons';

export type NavSection = 'home' | 'ingest' | 'ask' | 'history' | 'graph' | 'settings';

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  hasNewTimeline?: boolean;
  aiProvider?: string | null;
}

const navItems: { id: NavSection; name: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'home', name: 'Home', icon: Home },
  { id: 'ingest', name: 'Ingest Repository', icon: Database },
  { id: 'ask', name: 'Ask Question', icon: MessageSquare },
  { id: 'history', name: 'History', icon: Clock },
  { id: 'graph', name: 'Graph Explorer', icon: Network },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export default function Sidebar({
  activeNav,
  onSelectNav,
  mobileOpen,
  setMobileOpen,
  hasNewTimeline = false,
  aiProvider = null,
}: SidebarProps) {
  const lowerProvider = (aiProvider || '').toLowerCase();
  const isGroqUsed = lowerProvider.includes('groq');
  const isBothFailed =
    lowerProvider.includes('no model') || lowerProvider.includes('failed');

  
  const isGeminiActive = !isGroqUsed && !isBothFailed;

  const sidebarContent = (
    <div className="flex flex-col w-64 bg-[#F8FAFC] dark:bg-[#0D1322] border-r border-slate-200/80 dark:border-slate-800/80 h-full select-none overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300/70 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/70 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectNav('home')}>
          <BrandLogoSVG className="w-8 h-8 shrink-0" />
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-slate-900 dark:text-white tracking-tight">
              Why The Code
              <br />
              Is Like This
            </h1>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="px-3 space-y-1 shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          const showBadge = item.id === 'history' && hasNewTimeline;
          const iconClass = isActive
            ? 'w-4 h-4 transition-transform duration-200 group-hover:scale-110 text-blue-600 dark:text-white'
            : 'w-4 h-4 transition-transform duration-200 group-hover:scale-110 text-slate-500 dark:text-slate-400';

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectNav(item.id);
                setMobileOpen(false);
              }}
              className={`group w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 text-blue-600 dark:text-white shadow-2xs border border-blue-200/60 dark:border-transparent'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={iconClass} />
                <span>{item.name}</span>
              </div>
              {showBadge && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3.5 mt-auto space-y-3 shrink-0">
        <div className="p-3.5 bg-white dark:bg-[#131B2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Active Integrations
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Neo4jSVG className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Neo4j AuraDB</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <GraphRagSVG className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">GraphRAG</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <GeminiSVG className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Google Gemini
                </p>
                {isGeminiActive ? (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Primary LLM • Active
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Primary LLM • Not Active
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <GroqSVG className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Groq (GPT-OSS-20B)
                </p>
                {isGroqUsed ? (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Auto-Fallback Ready • Active
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Auto-Fallback Ready
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <GithubSVG className="w-4 h-4 text-slate-800 dark:text-white shrink-0 ml-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">GitHub API</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Connected
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/60 to-white dark:from-[#1E1B4B] dark:via-[#1E1B4B]/80 dark:to-[#0F172A] border border-blue-100 dark:border-indigo-500/30 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              Evidence-First AI
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Turn commit history into traceable engineering answers.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block shrink-0 h-full">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}