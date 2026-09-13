import { useEffect, useState } from 'react';
import { Github, ExternalLink, Cpu, FolderGit2, LibraryBig, ShieldCheck, Lock } from 'lucide-react';
import { loadRagDataset, timeAgo, type RagRecord, type DomainStatus } from './lib/ragData';
import DatasetViewer from './components/DatasetViewer';
import CodexBridgeGuide from './components/CodexBridgeGuide';
import GitHubWorkflowStatus from './components/GitHubWorkflowStatus';
import TurnstileGateway from './components/TurnstileGateway';

const TURNSTILE_KEYS = {
  invisible: (import.meta.env.VITE_TURNSTILE_INVISIBLE_SITE_KEY as string) || '0x4AAAAAADu5H6mpeAoSKieA',
  interactive: (import.meta.env.VITE_TURNSTILE_INTERACTIVE_SITE_KEY as string) || '0x4AAAAAADu46RXWxLxLRnbN',
};

type ActiveTab = 'catalog' | 'codex' | 'workflow';
type LoadState = 'loading' | 'ready' | 'error';

export default function App() {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return !!sessionStorage.getItem('cf_turnstile_token');
  });
  const [verifiedMode, setVerifiedMode] = useState<'invisible' | 'interactive'>(() => {
    return (sessionStorage.getItem('cf_turnstile_mode') as any) || 'invisible';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [records, setRecords] = useState<RagRecord[]>([]);
  const [domains, setDomains] = useState<DomainStatus[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadState('loading');
      try {
        const dataset = await loadRagDataset();
        if (cancelled) return;
        setRecords(dataset.records);
        setDomains(dataset.domains);
        setFetchedAt(dataset.fetchedAt);
        setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : 'Kesalahan tidak dikenal.');
        setLoadState('error');
      }
    }

    run();
    return () => { cancelled = true; };
  }, [isVerified]);

  if (!isVerified) {
    return (
      <TurnstileGateway
        keys={TURNSTILE_KEYS}
        onVerified={(_token, mode) => {
          setIsVerified(true);
          setVerifiedMode(mode);
        }}
      />
    );
  }

  const visibleRecords =
    selectedDomain === 'ALL' ? records : records.filter((r) => r.domain === selectedDomain);

  return (
    <div className="min-h-screen bg-ink-900 text-paper font-sans flex flex-col">
      {/* Header — tipis, dilengkapi Ray ID & Status Turnstile */}
      <header className="border-b border-ink-600 px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">🏺</span>
          <div>
            <h1 className="font-catalog-heading text-[15px] leading-none text-paper">RAG-MUNGIL</h1>
            <p className="text-[11px] text-paper-dim leading-tight mt-0.5">Katalog spesimen hasil galian otomatis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge status Turnstile — cuma info yang beneran nyata, Ray ID palsu dihapus */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono bg-ink-950 border border-ink-700 px-2.5 py-1 rounded text-paper-dim">
            <span className="flex items-center gap-1 text-verdigris">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Turnstile {verifiedMode === 'invisible' ? 'Auto' : 'Checklist'}</span>
            </span>
            <button
              onClick={() => {
                sessionStorage.removeItem('cf_turnstile_token');
                setIsVerified(false);
              }}
              title="Kunci ulang sesi gateway"
              className="ml-1 text-paper-dim hover:text-oxide transition-colors"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>

          <a
            href="https://github.com/AMillionDriver/RAG-MUNGIL"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[12px] text-paper-dim hover:text-paper transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Repositori</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Nav tab sederhana, garis bawah bukan pill rounded */}
      <nav className="border-b border-ink-600 px-5 flex items-center gap-6 text-[13px]">
        {([
          ['catalog', 'Katalog', LibraryBig],
          ['workflow', 'Log Situs', FolderGit2],
          ['codex', 'Sambungkan Agent', Cpu],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 py-2.5 border-b-2 transition-colors ${
              activeTab === key
                ? 'border-verdigris text-paper'
                : 'border-transparent text-paper-dim hover:text-paper'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar indeks situs — hanya relevan buat tab Katalog */}
        {activeTab === 'catalog' && (
          <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-ink-600 px-5 py-4">
            <p className="text-[11px] text-paper-dim mb-2">Situs galian</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedDomain('ALL')}
                  className={`w-full text-left px-2 py-1.5 rounded text-[13px] transition-colors ${
                    selectedDomain === 'ALL' ? 'bg-ink-800 text-paper' : 'text-paper-dim hover:text-paper'
                  }`}
                >
                  Semua situs
                  <span className="float-right font-mono text-[11px] text-paper-dim">{records.length}</span>
                </button>
              </li>
              {domains.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedDomain(d.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-[13px] transition-colors ${
                      selectedDomain === d.id ? 'bg-ink-800 text-paper' : 'text-paper-dim hover:text-paper'
                    }`}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                      style={{ backgroundColor: d.id === '02_web3_smart_contract' ? 'var(--color-oxide)' : 'var(--color-verdigris)' }}
                    />
                    {d.label}
                    <span className="float-right font-mono text-[11px] text-paper-dim">{d.totalRecords}</span>
                  </button>
                  <p className="pl-4 text-[10px] text-paper-dim/70 font-mono">disurvei {timeAgo(d.lastUpdated)}</p>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <main className="flex-1 px-5 py-5 min-w-0">
          {activeTab === 'catalog' && (
            <>
              {loadState === 'loading' && (
                <div className="text-[13px] text-paper-dim py-16 text-center">
                  Menarik katalog terbaru dari repositori...
                </div>
              )}

              {loadState === 'error' && (
                <div className="border border-oxide-dim/50 bg-oxide-dim/10 rounded px-4 py-3 text-[13px] text-paper">
                  <p className="font-medium">Katalog tidak bisa dimuat.</p>
                  <p className="text-paper-dim mt-1">{errorMessage} — repositori mungkin sedang di-rebase oleh bot harvest. Muat ulang beberapa saat lagi.</p>
                </div>
              )}

              {loadState === 'ready' && (
                <>
                  <p className="text-[11px] text-paper-dim mb-3 font-mono">
                    {visibleRecords.length} spesimen tercatat · katalog ditarik {fetchedAt ? timeAgo(fetchedAt) : ''}
                  </p>
                  <DatasetViewer dataset={visibleRecords} />
                </>
              )}
            </>
          )}

          {activeTab === 'codex' && <CodexBridgeGuide />}
          {activeTab === 'workflow' && <GitHubWorkflowStatus />}
        </main>
      </div>

      <footer className="border-t border-ink-600 px-5 py-3 text-[11px] text-paper-dim/70 font-mono">
        🏺 RAG-MUNGIL — disurvei otomatis tiap 2 jam lewat GitHub Actions
      </footer>
    </div>
  );
}
