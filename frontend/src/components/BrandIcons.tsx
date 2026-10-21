export function BrandLogoSVG({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <path d="M14 24L32 13M14 24L32 35" stroke="url(#brandGrad)" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="14" cy="24" r="6" fill="#2563EB" />
      <circle cx="32" cy="13" r="6" fill="#3B82F6" />
      <circle cx="32" cy="35" r="6" fill="#9333EA" />
      <circle cx="14" cy="24" r="2.5" fill="white" />
      <circle cx="32" cy="13" r="2.5" fill="white" />
      <circle cx="32" cy="35" r="2.5" fill="white" />
    </svg>
  );
}

export function GithubSVG({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function Neo4jSVG({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#018BFF" fillOpacity="0.15" />
      <circle cx="12" cy="12" r="4.5" fill="#018BFF" />
      <circle cx="22" cy="10" r="3.2" fill="#10B981" />
      <circle cx="20" cy="22" r="4" fill="#3B82F6" />
      <circle cx="9" cy="21" r="2.8" fill="#06B6D4" />
      <path d="M12 12L22 10M12 12L20 22M12 12L9 21M22 10L20 22" stroke="#018BFF" strokeWidth="1.5" />
    </svg>
  );
}

export function GeminiSVG({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="geminiGrad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path
        d="M16 3C16 10.18 10.18 16 3 16C10.18 16 16 21.82 16 29C16 21.82 21.82 16 29 16C21.82 16 16 10.18 16 3Z"
        fill="url(#geminiGrad)"
      />
    </svg>
  );
}

export function GroqSVG({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="3" width="26" height="26" rx="8" fill="#F97316" fillOpacity="0.15" />
      <path
        d="M17.5 7L9.5 17.5H16L14.5 25L22.5 14.5H16L17.5 7Z"
        fill="#F97316"
        stroke="#FB923C"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GraphRagSVG({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="8" r="3.5" fill="#A855F7" />
      <circle cx="8" cy="22" r="3.5" fill="#EC4899" />
      <circle cx="24" cy="22" r="3.5" fill="#6366F1" />
      <path d="M16 8L8 22H24L16 8Z" stroke="#A855F7" strokeWidth="2" />
    </svg>
  );
}

export function SunMoonToggleSVG({ theme }: { theme: 'light' | 'dark' }) {
  return theme === 'light' ? (
    <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function HeroGraphicIllustration() {
  return (
    <div className="relative w-full h-44 hidden xl:flex items-center justify-end select-none pointer-events-none pr-2">
      <div className="absolute right-8 top-2 w-72 h-36 bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-purple-500/20 dark:from-indigo-500/25 dark:to-purple-600/30 blur-2xl rounded-full" />

      <div className="relative z-10 w-44 h-28 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-blue-200/80 dark:border-purple-500/40 shadow-xl p-3 -rotate-6 flex flex-col justify-between backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="text-center font-mono text-xl font-extrabold text-blue-600 dark:text-purple-400">
          &lt;/&gt;
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-1.5 w-1/2 bg-blue-200 dark:bg-purple-800 rounded" />
        </div>
      </div>

      <div className="relative z-20 -ml-4 space-y-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-purple-950/90 border border-slate-200 dark:border-purple-500/40 shadow-md text-xs font-semibold text-slate-700 dark:text-purple-200">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Understand decisions
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-blue-950/90 border border-slate-200 dark:border-blue-500/40 shadow-md text-xs font-semibold text-slate-700 dark:text-blue-200 ml-3">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Explore relationships
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-emerald-950/90 border border-slate-200 dark:border-emerald-500/40 shadow-md text-xs font-semibold text-slate-700 dark:text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Trace history
        </div>
      </div>
    </div>
  );
}