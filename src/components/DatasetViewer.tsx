import { useState } from 'react';
import { Search, Shield, Terminal, Copy, Check, ExternalLink, Star, Code2, Sparkles, Filter } from 'lucide-react';
import { RagRecord } from '../data/scrapingDataset';

interface DatasetViewerProps {
  dataset: RagRecord[];
}

export default function DatasetViewer({ dataset }: DatasetViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedWaf, setSelectedWaf] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rawViewId, setRawViewId] = useState<string | null>(null);

  const wafList = ['ALL', 'Cloudflare', 'Akamai', 'Datadome', 'Kasada', 'Turnstile'];

  const filteredRecords = dataset.filter((record) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      record.title.toLowerCase().includes(q) ||
      record.summary.toLowerCase().includes(q) ||
      record.content.toLowerCase().includes(q) ||
      record.metadata.repo_name?.toLowerCase().includes(q);

    const matchDomain =
      selectedDomain === 'ALL' || record.domain === selectedDomain;

    const matchWaf =
      selectedWaf === 'ALL' ||
      record.metadata.bypassed_wafs?.some(
        (w) => w.toLowerCase() === selectedWaf.toLowerCase()
      );

    const matchTier =
      selectedTier === 'ALL' || record.metadata.tier === selectedTier;

    return matchSearch && matchDomain && matchWaf && matchTier;
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="bg-[#121214] p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari teknik, bypass Cloudflare, JA4, Playwright, tls-client..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTier('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTier === 'ALL'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Semua ({dataset.length})
            </button>
            <button
              onClick={() => setSelectedTier('GOLD_CURATED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                selectedTier === 'GOLD_CURATED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-white/40 hover:text-amber-300/70'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Gold Curated
            </button>
          </div>
        </div>

        {/* Domain Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Domain:
          </span>
          <button
            onClick={() => setSelectedDomain('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
              selectedDomain === 'ALL'
                ? 'bg-white/15 text-white border border-white/20 font-semibold'
                : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/5'
            }`}
          >
            Semua Domain
          </button>
          <button
            onClick={() => setSelectedDomain('01_rag_scraping')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
              selectedDomain === '01_rag_scraping'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/5'
            }`}
          >
            🛡️ 01: Scraping & Anti-Bot
          </button>
          <button
            onClick={() => setSelectedDomain('02_web3_smart_contract')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
              selectedDomain === '02_web3_smart_contract'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/5'
            }`}
          >
            ⛓️ 02: Web3 & Smart Contract
          </button>
        </div>

        {/* WAF Tag Filters */}
        {selectedDomain !== '02_web3_smart_contract' && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold flex items-center gap-1 mr-1">
              <Shield className="w-3 h-3" /> Target WAF:
            </span>
            {wafList.map((waf) => (
              <button
                key={waf}
                onClick={() => setSelectedWaf(waf)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                  selectedWaf === waf
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/5'
                }`}
              >
                {waf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-[#121214] rounded-2xl border border-white/10 text-white/40 space-y-2">
            <p className="text-sm">Tidak ada teknik yang cocok dengan kata kunci tersebut.</p>
            <p className="text-xs">Coba cari "cloudflare", "tls", "camoufox", atau klik reset filter.</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-[#121214] rounded-2xl border border-white/10 p-5 space-y-4 transition-all hover:border-white/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {record.metadata.tier === 'GOLD_CURATED' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> GOLD TIER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                        DISCOVERED
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-white/40">
                      ID: {record.id}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                        record.domain === '02_web3_smart_contract'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {record.domain}
                    </span>

                    {record.metadata.stars !== undefined && record.metadata.stars > 0 && (
                      <span className="text-[11px] text-amber-400/90 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400/40" />
                        {record.metadata.stars}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {record.title}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {record.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRawViewId(rawViewId === record.id ? null : record.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs flex items-center gap-1 border border-white/10"
                    title="Lihat Raw JSONL"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>JSONL</span>
                  </button>

                  <a
                    href={record.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs flex items-center gap-1 border border-white/10"
                    title="Buka Repositori Asli"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Source</span>
                  </a>
                </div>
              </div>

              {/* Badges: Target WAF or Web3 Vuln/Protocol */}
              <div className="flex flex-wrap items-center gap-1.5">
                {record.metadata.bypassed_wafs && (
                  <>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mr-1">
                      Bypass Targets:
                    </span>
                    {record.metadata.bypassed_wafs.map((waf) => (
                      <span
                        key={waf}
                        className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/70 border border-white/10 text-[10px] font-mono"
                      >
                        {waf}
                      </span>
                    ))}
                  </>
                )}

                {record.metadata.vuln_type && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono">
                    Celah: {record.metadata.vuln_type}
                  </span>
                )}

                {record.metadata.protocol && (
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/60 border border-white/10 text-[10px] font-mono">
                    Protokol: {record.metadata.protocol}
                  </span>
                )}
              </div>

              {/* Code Snippet Box */}
              {record.metadata.code_snippets && record.metadata.code_snippets.length > 0 && (
                <div className="bg-[#09090b] rounded-xl border border-white/10 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-white/50 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                      <Terminal className="w-3.5 h-3.5" /> Implementasi Python:
                    </span>
                    <button
                      onClick={() => handleCopyCode(record.id, record.metadata.code_snippets![0])}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 transition-all"
                    >
                      {copiedId === record.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-white/80 overflow-x-auto p-1 leading-relaxed">
                    <code>{record.metadata.code_snippets[0]}</code>
                  </pre>
                </div>
              )}

              {/* Raw JSONL Accordion */}
              {rawViewId === record.id && (
                <div className="bg-[#050505] rounded-xl p-3 border border-dashed border-white/20 text-[11px] font-mono text-emerald-300/80 overflow-x-auto">
                  <pre>{JSON.stringify(record, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
