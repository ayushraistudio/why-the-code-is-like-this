import { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Download,
  Clock,
  Network,
  MessageSquare,
  Lightbulb,
  BarChart3,
  ShieldCheck,
  Info,
  Maximize2,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import GraphView, { NODE_COLOR_LEGEND } from './GraphView';

interface ResultsPanelProps {
  answer: any;
  aiProvider: string | null;
  rawEvidence: any[];
  graphElements: any[];
  theme: 'dark' | 'light';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasNewTimeline: boolean;
  onClearTimelineNotification: () => void;
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={idx}
          className="font-bold text-slate-900 dark:text-white bg-blue-50/80 dark:bg-indigo-950/60 px-1 py-0.5 rounded"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-xs bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-700 dark:text-indigo-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function StructuredDecisionView({ decisionText }: { decisionText?: string }) {
  if (!decisionText) {
    return (
      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed py-4">
        No decision analysis generated yet. Ingest a real GitHub repository in Step 1 and ask an architectural question in Step 2 to generate an evidence-grounded explanation.
      </div>
    );
  }

  const lines = decisionText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
          const cleanLine = line.replace(/^(-|\*|\d+\.)\s+/, '');
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 pl-2 py-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/40 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-indigo-400 mt-2 shrink-0" />
              <div className="flex-1">{renderFormattedText(cleanLine)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
}

function NodeColorLegendBadges() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {NODE_COLOR_LEGEND.map((item) => (
        <div key={item.type} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full shrink-0 border-2 shadow-2xs"
            style={{
              backgroundColor: item.bgColor,
              borderColor: item.borderColor,
            }}
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ResultsPanel({
  answer,
  aiProvider,
  rawEvidence,
  graphElements,
  theme,
  activeTab,
  setActiveTab,
  hasNewTimeline,
  onClearTimelineNotification,
}: ResultsPanelProps) {
  const [fullscreenGraph, setFullscreenGraph] = useState(false);

  const handleExport = () => {
    if (!answer) return;
    const blob = new Blob([JSON.stringify({ aiProvider, answer, rawEvidence }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphrag-decision-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const evidenceStrength =
    rawEvidence && rawEvidence.length >= 3
      ? 'Strong'
      : rawEvidence && rawEvidence.length >= 1
      ? 'Moderate'
      : 'None';

  const resolvedModelName =
    aiProvider || answer?.ai_provider || (answer ? 'No Model Available' : null);

  const isNoModel =
    !resolvedModelName ||
    resolvedModelName === 'None' ||
    resolvedModelName === 'No Model Available' ||
    resolvedModelName === 'Fallback Failed';

  const tabs = [
    { id: 'explanation', label: 'Explanation', icon: FileText },
    { id: 'timeline', label: 'Commit Timeline', icon: Clock, badge: hasNewTimeline },
    { id: 'graph', label: 'Entity Graph', icon: Network },
    { id: 'evidence', label: 'Supporting Evidence', icon: FileText },
    { id: 'limitations', label: 'Limitations', icon: Info },
  ];

  return (
    <div className="bg-white dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Evidence-Grounded Reasoning
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Traceable explanations backed by real commits, PRs, and code relationships.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {answer && (
            <>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Answer Generated</span>
              </span>

              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                  isNoModel
                    ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60'
                    : resolvedModelName?.toLowerCase().includes('groq')
                    ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/60'
                    : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60'
                }`}
              >
                {isNoModel ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Model: {isNoModel ? 'No Model Available' : resolvedModelName}</span>
              </span>
            </>
          )}

          <button
            onClick={handleExport}
            disabled={!answer}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Result
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-3 bg-slate-50/70 dark:bg-[#0D1322]/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'timeline') {
                  onClearTimelineNotification();
                }
              }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                isActive
                  ? 'bg-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 text-blue-600 dark:text-white border-blue-600 dark:border-transparent shadow-xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  New
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-6 flex-1 bg-white dark:bg-[#0B0F19]">
        {activeTab === 'explanation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50/60 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                    Decision / Reasoning
                  </h4>
                  {rawEvidence.length > 0 && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {rawEvidence.length} Commit Node(s) Analyzed
                    </span>
                  )}
                </div>

                <div className="max-h-[260px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <StructuredDecisionView decisionText={answer?.Decision} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
                <div className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Decision Status
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-amber-500 truncate block">
                      {answer?.Decision_Status || 'Awaiting Query'}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Confidence Signal
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-rose-500 truncate block">
                      {answer?.Confidence ? answer.Confidence.split(' ')[0] : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Evidence Strength
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 truncate block">
                      {evidenceStrength}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-50/60 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col min-h-[320px]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                  Entity & Decision Subgraph ({graphElements.filter((e) => !e.data?.source).length} Nodes)
                </h4>
                <button
                  onClick={() => setFullscreenGraph(true)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title="Expand Graph"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 rounded-xl bg-white dark:bg-[#0B0F19] border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
                <GraphView elements={graphElements} theme={theme} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Chronological Commit & Decision Timeline ({rawEvidence.length})
            </h4>
            {rawEvidence && rawEvidence.length > 0 ? (
              rawEvidence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-indigo-400">
                      Commit {item.sha?.substring(0, 8)}
                    </span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {item.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Author: <strong>{item.author}</strong> • File: <code>{item.file}</code>
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Historical'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">
                No chronological commits retrieved for this query yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="bg-slate-50/60 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col h-[500px]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <NodeColorLegendBadges />
              <button
                onClick={() => setFullscreenGraph(true)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                title="Expand Graph"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-[#0B0F19] border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
              <GraphView elements={graphElements} theme={theme} />
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Supporting Graph Citations
            </h4>
            {answer?.Evidence && answer.Evidence.length > 0 ? (
              answer.Evidence.map((ev: string, i: number) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300"
                >
                  {ev}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No citations available for the current query.</p>
            )}
          </div>
        )}

        {activeTab === 'limitations' && (
          <div className="p-5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
              Known Limitations & Evidence Gaps
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-200/90 leading-relaxed">
              {answer?.Limitations ||
                'Run a query against an ingested repository to evaluate evidence completeness and historical gaps.'}
            </p>
          </div>
        )}
      </div>

      {fullscreenGraph && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setFullscreenGraph(false)}
        >
          <div
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl h-[82vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <NodeColorLegendBadges />
              <button
                onClick={() => setFullscreenGraph(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
            <div className="flex-1">
              <GraphView elements={graphElements} theme={theme} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}