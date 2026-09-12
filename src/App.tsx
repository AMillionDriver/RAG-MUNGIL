import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Database,
  Terminal,
  Github,
  ShieldAlert,
  Cpu,
  RefreshCw,
  ExternalLink,
  BookOpen,
  FolderGit2,
  CheckCircle2
} from 'lucide-react';
import { INITIAL_DATASET, RagRecord } from './data/scrapingDataset';
import DatasetViewer from './components/DatasetViewer';
import CodexBridgeGuide from './components/CodexBridgeGuide';
import GitHubWorkflowStatus from './components/GitHubWorkflowStatus';

type ActiveTab = 'dataset' | 'codex' | 'workflow';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dataset');
  const [dataset] = useState<RagRecord[]>(INITIAL_DATASET);

  const goldCount = dataset.filter((d) => d.metadata.tier === 'GOLD_CURATED').length;
  const wafCount = new Set(dataset.flatMap((d) => d.metadata.bypassed_wafs || [])).size;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#F4F4F5] flex flex-col justify-between p-4 sm:p-8 font-sans relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Background glow ambiance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Top Navigation Header */}
      <header className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/10 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            🏺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                RAG-MUNGIL
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold">
                GOLD TIER
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Autonomous Knowledge Harvester & Scraping RAG Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/AMillionDriver/RAG-MUNGIL"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/80 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="font-mono">AMillionDriver/RAG-MUNGIL</span>
            <ExternalLink className="w-3 h-3 text-white/40" />
          </a>
        </div>
      </header>

      {/* Hero Stats */}
      <main className="w-full max-w-6xl mx-auto my-6 sm:my-8 z-10 relative space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono">
              <span>TOTAL DATA</span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{dataset.length} Entries</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Clean JSONL Format</div>
          </div>

          <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono">
              <span>GOLD CURATED</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{goldCount} Teknik</div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">TLS, Camoufox, Stealth</div>
          </div>

          <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono">
              <span>ACTIVE DOMAINS</span>
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">2 Domains</div>
            <div className="text-[10px] text-purple-300/80 mt-0.5">Scraping + Web3 Security</div>
          </div>

          <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-white/40 text-[11px] font-mono">
              <span>AUTONOMOUS</span>
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">2 Jam Sekali</div>
            <div className="text-[10px] text-blue-300/80 mt-0.5">Cloud GitHub Actions</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-start border-b border-white/10 pb-px">
          <div className="inline-flex gap-1">
            <button
              onClick={() => setActiveTab('dataset')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'dataset'
                  ? 'border-emerald-400 text-white bg-white/[0.04]'
                  : 'border-transparent text-white/40 hover:text-white/80'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Dataset Explorer (JSONL)</span>
            </button>

            <button
              onClick={() => setActiveTab('codex')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'codex'
                  ? 'border-purple-400 text-white bg-white/[0.04]'
                  : 'border-transparent text-white/40 hover:text-white/80'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Codex & MCP Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'workflow'
                  ? 'border-blue-400 text-white bg-white/[0.04]'
                  : 'border-transparent text-white/40 hover:text-white/80'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>GitHub Actions & Sync</span>
            </button>
          </div>
        </div>

        {/* Tab Views */}
        <AnimatePresence mode="wait">
          {activeTab === 'dataset' && (
            <motion.div
              key="tab-dataset"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DatasetViewer dataset={dataset} />
            </motion.div>
          )}

          {activeTab === 'codex' && (
            <motion.div
              key="tab-codex"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CodexBridgeGuide />
            </motion.div>
          )}

          {activeTab === 'workflow' && (
            <motion.div
              key="tab-workflow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GitHubWorkflowStatus />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono uppercase text-white/40 z-10 relative">
        <div className="flex items-center gap-2">
          <span>🏺 RAG-MUNGIL • Autonomous Harvester</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400/80">
          <CheckCircle2 className="w-3 h-3" />
          <span>Cloud Actions & Clean JSONL Ready</span>
        </div>
      </footer>
    </div>
  );
}
