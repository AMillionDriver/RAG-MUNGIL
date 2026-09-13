import { useState } from 'react';
import { Search, Copy, Check, ExternalLink, Star, Code2 } from 'lucide-react';
import { type RagRecord } from '../lib/ragData';

interface DatasetViewerProps {
  dataset: RagRecord[];
}

export default function DatasetViewer({ dataset }: DatasetViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWaf, setSelectedWaf] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rawViewId, setRawViewId] = useState<string | null>(null);

  const wafList = Array.from(
    new Set(dataset.flatMap((d) => d.metadata.bypassed_wafs || []))
  );

  const filteredRecords = dataset.filter((record) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      record.title.toLowerCase().includes(q) ||
      record.summary.toLowerCase().includes(q) ||
      record.content.toLowerCase().includes(q) ||
      record.metadata.repo_name?.toLowerCase().includes(q);

    const matchWaf =
      selectedWaf === 'ALL' ||
      record.metadata.bypassed_wafs?.some((w) => w.toLowerCase() === selectedWaf.toLowerCase());

    return matchSearch && matchWaf;
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Kotak pencarian — ledger control, bukan card SaaS */}
      <div className="border-b border-ink-600 pb-3 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-paper-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari di dalam katalog — nama repo, target bypass, jenis kerentanan..."
            className="w-full bg-transparent border-b border-ink-600 pl-6 pr-2 py-1.5 text-[13px] text-paper placeholder-paper-dim/60 focus:outline-none focus:border-verdigris transition-colors"
          />
        </div>

        {wafList.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className="text-paper-dim">Target:</span>
            <button
              onClick={() => setSelectedWaf('ALL')}
              className={selectedWaf === 'ALL' ? 'text-paper underline underline-offset-2' : 'text-paper-dim hover:text-paper'}
            >
              semua
            </button>
            {wafList.map((waf) => (
              <button
                key={waf}
                onClick={() => setSelectedWaf(waf)}
                className={selectedWaf === waf ? 'text-paper underline underline-offset-2' : 'text-paper-dim hover:text-paper'}
              >
                {waf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Daftar spesimen */}
      {filteredRecords.length === 0 ? (
        <div className="py-10 text-[13px] text-paper-dim">
          <p>Tidak ada spesimen yang cocok dengan pencarian itu.</p>
          <p className="mt-1">Coba istilah lain, atau bersihkan filter target di atas.</p>
        </div>
      ) : (
        <div className="divide-y divide-ink-600">
          {filteredRecords.map((record) => {
            const isWeb3 = record.domain === '02_web3_smart_contract';
            const accentColor = isWeb3 ? 'var(--color-oxide)' : 'var(--color-verdigris)';

            return (
              <article key={record.id} className="py-4 pl-3 border-l-2" style={{ borderColor: accentColor }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-paper-dim font-mono mb-1">
                      <span>{record.id}</span>
                      {record.metadata.tier === 'GOLD_CURATED' && (
                        <span style={{ color: accentColor }}>· gold-tier</span>
                      )}
                      {record.metadata.stars !== undefined && record.metadata.stars > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="w-3 h-3" /> {record.metadata.stars.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-catalog-heading text-[15px] text-paper">{record.title}</h3>
                    <p className="text-[13px] text-paper-dim mt-1 leading-relaxed">{record.summary}</p>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-paper-dim">
                      {record.metadata.bypassed_wafs?.map((w) => <span key={w}>#{w}</span>)}
                      {record.metadata.vuln_type && <span>#{record.metadata.vuln_type}</span>}
                      {record.metadata.protocol && <span>#{record.metadata.protocol}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[12px]">
                    <button
                      onClick={() => setRawViewId(rawViewId === record.id ? null : record.id)}
                      className="flex items-center gap-1 text-paper-dim hover:text-paper transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" /> JSONL
                    </button>
                    <a
                      href={record.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-paper-dim hover:text-paper transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Sumber
                    </a>
                  </div>
                </div>

                {record.metadata.code_snippets && record.metadata.code_snippets.length > 0 && (
                  <div className="mt-3 bg-ink-950 border border-ink-600 rounded p-3">
                    <div className="flex items-center justify-between text-[11px] text-paper-dim mb-2 font-mono">
                      <span>implementasi</span>
                      <button
                        onClick={() => handleCopyCode(record.id, record.metadata.code_snippets![0])}
                        className="flex items-center gap-1 hover:text-paper transition-colors"
                      >
                        {copiedId === record.id ? (
                          <><Check className="w-3 h-3" style={{ color: accentColor }} /> tersalin</>
                        ) : (
                          <><Copy className="w-3 h-3" /> salin</>
                        )}
                      </button>
                    </div>
                    <pre className="text-[12px] font-mono text-paper-dim overflow-x-auto leading-relaxed">
                      <code>{record.metadata.code_snippets[0]}</code>
                    </pre>
                  </div>
                )}

                {rawViewId === record.id && (
                  <pre className="mt-3 bg-ink-950 border border-dashed border-ink-600 rounded p-3 text-[11px] font-mono text-paper-dim overflow-x-auto">
                    {JSON.stringify(record, null, 2)}
                  </pre>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
