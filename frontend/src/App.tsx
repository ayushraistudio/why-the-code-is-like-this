import { useState, useEffect, useRef } from 'react';
import {
  ingestRepository,
  askQuestion,
  fetchIngestedRepositories,
  clearDatabase,
} from './services/api';
import Sidebar, { type NavSection } from './components/Sidebar';
import Header from './components/Header';
import ResultsPanel from './components/ResultsPanel';
import SettingsModal from './components/SettingsModal';
import { GithubSVG, HeroGraphicIllustration } from './components/BrandIcons';
import {
  Database,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Network,
  Clock,
  Link2,
  User,
  FolderGit2,
  Search,
  Target,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';

const ANALYZE_STAGE_MESSAGES = [
  'Connecting to backend & Neo4j AuraDB...',
  'Retrieving commit & PR evidence from graph...',
  'Building entity relationships & timeline...',
  'Synthesizing architectural reasoning with AI...',
];

function buildSubgraphFromEvidence(
  evidenceList: any[],
  relatedFiles: string[],
  activeRepo: string | null,
  keyword: string
) {
  const elements: any[] = [];
  const addedNodes = new Set<string>();
  const addedEdges = new Set<string>();

  const addNode = (id: string, label: string, type: string) => {
    if (!addedNodes.has(id)) {
      addedNodes.add(id);
      elements.push({ data: { id, label, type } });
    }
  };

  const addEdge = (source: string, target: string) => {
    const edgeKey = `${source}->${target}`;
    if (!addedEdges.has(edgeKey) && source !== target) {
      addedEdges.add(edgeKey);
      elements.push({ data: { id: edgeKey, source, target } });
    }
  };

  const repoShort = activeRepo
    ? activeRepo.replace('https://github.com/', '')
    : 'Active Repository';
  const repoNodeId = 'repo-root';
  addNode(repoNodeId, `Repo\n${repoShort}`, 'Repository');

  if (!evidenceList || evidenceList.length === 0) {
    const queryNodeId = 'query-node';
    addNode(queryNodeId, `Query\n${keyword || 'Unmatched'}`, 'Feature');
    addEdge(repoNodeId, queryNodeId);
    return elements;
  }

  evidenceList.forEach((ev) => {
    const sha = ev.sha || 'unknown';
    const shortSha = sha.substring(0, 7);
    const commitId = `commit-${shortSha}`;
    addNode(commitId, `Commit\n${shortSha}`, 'Commit');
    addEdge(repoNodeId, commitId);

    if (ev.author) {
      const authorId = `author-${ev.author}`;
      addNode(authorId, `Author\n${ev.author}`, 'Author');
      addEdge(authorId, commitId);
    }

    if (ev.file && ev.file !== 'Repository Root') {
      const shortFile = ev.file.split('/').pop() || ev.file;
      const fileId = `file-${ev.file}`;
      addNode(fileId, `File\n${shortFile}`, 'File');
      addEdge(commitId, fileId);
    }

    const prMatches = String(ev.message || '').match(/#(\d+)/g);
    if (prMatches) {
      prMatches.forEach((prTag) => {
        const prId = `pr-${prTag}`;
        addNode(prId, `PR\n${prTag}`, 'PR');
        addEdge(prId, commitId);
      });
    }
  });

  if (Array.isArray(relatedFiles)) {
    relatedFiles.forEach((f) => {
      if (f) {
        const shortFile = f.split('/').pop() || f;
        const fileId = `file-${f}`;
        addNode(fileId, `File\n${shortFile}`, 'File');
      }
    });
  }

  return elements;
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [repoUrl, setRepoUrl] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [repoNameInput, setRepoNameInput] = useState('');

  const [activeRepo, setActiveRepo] = useState<string | null>(null);
  const [recentRepos, setRecentRepos] = useState<string[]>([]);

  const [question, setQuestion] = useState('');
  const [keyword, setKeyword] = useState('');

  const [answer, setAnswer] = useState<any | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [rawEvidence, setRawEvidence] = useState<any[]>([]);
  const [graphElements, setGraphElements] = useState<any[]>([]);
  const [activeResultTab, setActiveResultTab] = useState('explanation');
  const [hasNewTimeline, setHasNewTimeline] = useState(false);

  const [ingestLoading, setIngestLoading] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [showStageProgress, setShowStageProgress] = useState(false);
  const [analyzeStageIdx, setAnalyzeStageIdx] = useState(0);
  const [stageCountdown, setStageCountdown] = useState(10);
  const [allStagesOver, setAllStagesOver] = useState(false);

  const [clearingData, setClearingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const ingestCardRef = useRef<HTMLDivElement>(null);
  const askCardRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  
  useEffect(() => {
    let mounted = true;
    fetchIngestedRepositories()
      .then((repos) => {
        if (mounted && repos.length > 0) {
          setRecentRepos(repos);
          setActiveRepo(repos[0]);
        }
      })
      .catch(() => {
        
      });
    return () => {
      mounted = false;
    };
  }, []);

  
  useEffect(() => {
    if (!askLoading) {
      setShowStageProgress(false);
      setAnalyzeStageIdx(0);
      setStageCountdown(10);
      setAllStagesOver(false);
      return;
    }

    
    const revealTimer = setTimeout(() => {
      setShowStageProgress(true);
    }, 350);

    const tickInterval = setInterval(() => {
      setStageCountdown((prevTime) => {
        if (prevTime > 1) {
          return prevTime - 1;
        }
        
        setAnalyzeStageIdx((prevStage) => {
          if (prevStage < ANALYZE_STAGE_MESSAGES.length - 1) {
            return prevStage + 1;
          }
          setAllStagesOver(true);
          return prevStage;
        });
        return 10;
      });
    }, 1000);

    return () => {
      clearTimeout(revealTimer);
      clearInterval(tickInterval);
    };
  }, [askLoading]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleSidebarNavigation = (nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'settings') {
      setSettingsOpen(true);
    } else if (nav === 'ingest') {
      ingestCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'ask') {
      askCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'history') {
      setActiveResultTab('timeline');
      setHasNewTimeline(false);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'graph') {
      setActiveResultTab('graph');
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  
  const handleUrlInputChange = (val: string) => {
    setRepoUrl(val);
    if (val.length > 0 && (ownerInput.length > 0 || repoNameInput.length > 0)) {
      setOwnerInput('');
      setRepoNameInput('');
    }
  };

  const handleOwnerInputChange = (val: string) => {
    setOwnerInput(val);
    if (val.length > 0 && repoUrl.length > 0) {
      setRepoUrl('');
    }
  };

  const handleRepoNameInputChange = (val: string) => {
    setRepoNameInput(val);
    if (val.length > 0 && repoUrl.length > 0) {
      setRepoUrl('');
    }
  };

  const resolveOwnerAndRepo = (): { owner: string; repo: string; fullUrl: string } | null => {
    if (ownerInput.trim() && repoNameInput.trim()) {
      const o = ownerInput.trim();
      const r = repoNameInput.trim().replace(/\.git$/, '');
      return { owner: o, repo: r, fullUrl: `https://github.com/${o}/${r}` };
    }
    if (repoUrl.trim()) {
      const cleaned = repoUrl.trim().replace(/\/+$/, '').replace(/\.git$/, '');
      const parts = cleaned
        .replace('https://github.com/', '')
        .replace('http://github.com/', '')
        .split('/');
      if (parts.length >= 2 && parts[parts.length - 2] && parts[parts.length - 1]) {
        const o = parts[parts.length - 2];
        const r = parts[parts.length - 1];
        return { owner: o, repo: r, fullUrl: `https://github.com/${o}/${r}` };
      }
    }
    return null;
  };

  const handleIngest = async () => {
    setStatusMessage(null);
    const parsed = resolveOwnerAndRepo();
    if (!parsed) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid GitHub Repository URL or fill in both Owner and Repository fields.',
      });
      return;
    }

    setIngestLoading(true);
    try {
      const res = await ingestRepository(parsed.owner, parsed.repo);
      const canonicalUrl = res.repository_url || parsed.fullUrl;

      setActiveRepo(canonicalUrl);
      setRecentRepos((prev) =>
        prev.includes(canonicalUrl) ? prev : [canonicalUrl, ...prev]
      );

      const commitsCount = res.data_summary?.commits_saved ?? 0;
      const prsCount = res.data_summary?.pull_requests_saved ?? 0;
      const filesCount = res.data_summary?.code_entities_extracted ?? 0;

      setStatusMessage({
        type: 'success',
        text: `Repository ${parsed.owner}/${parsed.repo} ingested into Neo4j! Saved ${commitsCount} commits, ${prsCount} PRs, and extracted ${filesCount} file entities.`,
      });
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        'Could not connect to the backend server. Please verify FastAPI and Neo4j AuraDB are running.';
      setStatusMessage({ type: 'error', text: String(detail) });
    } finally {
      setIngestLoading(false);
    }
  };

  const handleAsk = async () => {
    setStatusMessage(null);

    if (!activeRepo) {
      setStatusMessage({
        type: 'warning',
        text: 'Please ingest or select a GitHub repository first before analyzing a question.',
      });
      return;
    }

    if (!question.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter an architectural question to analyze.',
      });
      return;
    }

    setAskLoading(true);
    try {
      const res = await askQuestion(question.trim(), keyword.trim(), activeRepo);
      const evidenceList: any[] = res.raw_evidence || [];
      const structuredAns = res.answer || null;
      const providerUsed =
        res.ai_provider_used || structuredAns?.ai_provider || 'No Model Available';

      setAnswer(structuredAns);
      setAiProvider(providerUsed);
      setRawEvidence(evidenceList);
      setActiveResultTab('explanation');

      const builtElements = buildSubgraphFromEvidence(
        evidenceList,
        structuredAns?.Related_Code || [],
        activeRepo,
        res.keyword_used || keyword.trim()
      );
      setGraphElements(builtElements);

      if (evidenceList.length > 0) {
        setHasNewTimeline(true);
        const uniqueFiles = Array.from(
          new Set(evidenceList.map((e) => e.file).filter(Boolean))
        );
        setStatusMessage({
          type: 'success',
          text: `Analysis complete via ${providerUsed}! Found ${evidenceList.length} commit record(s) across ${uniqueFiles.length} file(s) in ${activeRepo.replace('https://github.com/', '')}.`,
        });
      } else {
        setHasNewTimeline(false);
        setStatusMessage({
          type: 'warning',
          text: `No matching file or commit history found in ${activeRepo.replace('https://github.com/', '')} for "${res.keyword_used || question.trim()}". Try a different file name or broader keyword.`,
        });
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (error: any) {
      const status = error?.response?.status;
      setAiProvider('No Model Available');
      if (status === 503 || status === 500) {
        setStatusMessage({
          type: 'error',
          text: 'Internal AI or database service error occurred. Please try again after some time.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Unable to complete GraphRAG analysis right now. Please check your connection and try again.',
        });
      }
    } finally {
      setAskLoading(false);
    }
  };

  const handleSignOutAndClear = async () => {
    setClearingData(true);
    setStatusMessage(null);
    try {
      await clearDatabase();
      setRepoUrl('');
      setOwnerInput('');
      setRepoNameInput('');
      setQuestion('');
      setKeyword('');
      setActiveRepo(null);
      setRecentRepos([]);
      setAnswer(null);
      setAiProvider(null);
      setRawEvidence([]);
      setGraphElements([]);
      setHasNewTimeline(false);
      setStatusMessage({
        type: 'success',
        text: 'Signed out and deleted all ingested repositories, commits, and files from the Neo4j database.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Could not clear the backend database. Please verify the backend server is running.',
      });
    } finally {
      setClearingData(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F6FC] dark:bg-[#070B14] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar
        activeNav={activeNav}
        hasNewTimeline={hasNewTimeline}
        mobileOpen={mobileOpen}
        onSelectNav={handleSidebarNavigation}
        setMobileOpen={setMobileOpen}
        aiProvider={aiProvider}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <Header
          activeRepo={activeRepo}
          recentRepos={recentRepos}
          onSelectRepo={(r) => {
            setActiveRepo(r);
            setStatusMessage({
              type: 'success',
              text: `Switched active repository context to ${r.replace('https://github.com/', '')}.`,
            });
          }}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onSignOutAndClear={handleSignOutAndClear}
          clearingData={clearingData}
        />

        <section className="px-4 md:px-8 pt-2 pb-5 grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
          <div className="xl:col-span-8">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1.5 text-slate-900 dark:text-white">
              Why The Code{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Is Like This
              </span>
            </h1>
            <p className="text-xs sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Evidence-Based Engineering Decision & Knowledge Graph Explorer
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mb-4">
              Ask architectural questions and get evidence-grounded answers from your codebase using Neo4j AuraDB + GraphRAG.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl">
              <div className="flex items-center gap-2.5 bg-white/90 dark:bg-[#111827]/90 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-2xs">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Understand decisions</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">See the why behind changes</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/90 dark:bg-[#111827]/90 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-2xs">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Explore relationships</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Files, commits, authors, PRs</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/90 dark:bg-[#111827]/90 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-2xs">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Trace history</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Follow how decisions evolved</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <HeroGraphicIllustration />
          </div>
        </section>

        {statusMessage && (
          <div
            className={`mx-4 md:mx-8 mb-5 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 shadow-xs ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200'
                : statusMessage.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : statusMessage.type === 'warning' ? (
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <section className="px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            ref={ingestCardRef}
            className="bg-white dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    1
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      Ingest GitHub Repository
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Load a public repository into the Neo4j knowledge graph
                    </p>
                  </div>
                </div>
                <GithubSVG className="w-6 h-6 text-slate-800 dark:text-white" />
              </div>

              <div className="relative mb-3">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full bg-slate-50/80 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-purple-500"
                  placeholder="Enter GitHub repository URL (e.g. https://github.com/fastapi/fastapi)"
                  value={repoUrl}
                  onChange={(e) => handleUrlInputChange(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 my-2.5">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                <span className="text-xs text-slate-400 font-medium">or</span>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full bg-slate-50/80 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Owner (e.g. fastapi)"
                    value={ownerInput}
                    onChange={(e) => handleOwnerInputChange(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <FolderGit2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full bg-slate-50/80 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Repository (e.g. fastapi)"
                    value={repoNameInput}
                    onChange={(e) => handleRepoNameInputChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleIngest}
              disabled={ingestLoading || askLoading}
              className="w-full bg-[#1E293B] hover:bg-[#0F172A] dark:bg-gradient-to-r dark:from-blue-500 dark:via-indigo-500 dark:to-purple-600 dark:hover:opacity-95 text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {ingestLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Commits & Building Neo4j Graph...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Ingest Repository into Graph</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div
            ref={askCardRef}
            className="bg-white dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    2
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      Ask Architectural Question
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeRepo
                        ? `Querying active repo: ${activeRepo.replace('https://github.com/', '')}`
                        : 'Ingest or select a repository to start asking questions'}
                    </p>
                  </div>
                </div>
                <MessageSquare className="w-6 h-6 text-slate-700 dark:text-purple-400" />
              </div>

              <div className="space-y-3 mb-4">
                <textarea
                  className="w-full bg-slate-50/80 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none h-[88px]"
                  placeholder="Ask a question about the code, architecture, or engineering decisions... (e.g. Why was WebSocket support added?)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />

                <div className="relative">
                  <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full bg-slate-50/80 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Target File / Keyword (optional)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <button
              onClick={handleAsk}
              disabled={askLoading || ingestLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-600 hover:opacity-95 text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2.5 shadow-md cursor-pointer"
            >
              {askLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  {!showStageProgress ? (
                    <span className="truncate">Analyzing with GraphRAG...</span>
                  ) : allStagesOver ? (
                    <span className="truncate animate-pulse">
                      Just a few seconds, results are almost here...
                    </span>
                  ) : (
                    <span className="truncate flex items-center gap-2">
                      <span>{ANALYZE_STAGE_MESSAGES[analyzeStageIdx]}</span>
                      <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-white/20 text-white shrink-0">
                        {stageCountdown}s
                      </span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Analyze with GraphRAG</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>
        </section>

        <section ref={resultsRef} className="px-4 md:px-8 pb-8 flex-1 flex flex-col">
          <ResultsPanel
            activeTab={activeResultTab}
            aiProvider={aiProvider}
            answer={answer}
            graphElements={graphElements}
            hasNewTimeline={hasNewTimeline}
            onClearTimelineNotification={() => setHasNewTimeline(false)}
            rawEvidence={rawEvidence}
            setActiveTab={setActiveResultTab}
            theme={theme}
          />
        </section>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;