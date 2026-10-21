import { X, Moon, Sun, Server, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function SettingsModal({ open, onClose, theme, toggleTheme }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Platform Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400"/>
              ) : (
                <Sun className="w-5 h-5 text-amber-500"/>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Appearance Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between Default Light and Neon Dark UI
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
              <Server className="w-4 h-4 text-blue-500"/> API Endpoint Configuration
            </div>
            <p className="font-mono text-[11px] text-slate-500">
              {import.meta.env.VITE_API_BASE_URL || '[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-purple-500"/> Dual-LLM Resilience Engine
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Primary: <strong className="text-slate-700 dark:text-slate-200">Google Gemini (gemini-3.8-flash)</strong>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Fallback: <strong className="text-slate-700 dark:text-slate-200">Groq (openai/gpt-oss-20b)</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"/>
            <span className="text-emerald-800 dark:text-emerald-300">
              Auto-Retry & Defunct IPv4 Connection Recovery is enabled for Neo4j AuraDB.
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}