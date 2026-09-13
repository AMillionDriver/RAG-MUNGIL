import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodexBridgeGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: 'Jalankan pencarian di terminal',
      desc: 'Tarik potongan teknik yang relevan langsung ke prompt lewat mesin FTS5 lokal:',
      code: 'python search.py "turnstile"',
    },
    {
      title: 'Sambungkan file JSONL ke agent',
      desc: 'Prompt yang bisa dipakai ke Codex / Cursor / Claude Code untuk membaca katalog lokal:',
      code: 'Baca file `domains/01_rag_scraping/data/01_rag_scraping_clean.jsonl` dan implementasikan teknik impersonate curl-cffi untuk scraper target kita.',
    },
    {
      title: 'Skema baris data (Fixed Core + Dynamic Metadata)',
      desc: 'Tiap spesimen punya struktur seragam ini, dijamin tidak berubah antar situs:',
      code: `{\n  "id": "scraping_curl_cffi",\n  "domain": "01_rag_scraping",\n  "title": "TLS JA3/JA4 Fingerprint",\n  "content": "### Teks dokumentasi...",\n  "metadata": {\n    "bypassed_wafs": ["Cloudflare", "Akamai"],\n    "code_snippets": ["from curl_cffi import requests..."]\n  }\n}`,
    },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-catalog-heading text-[16px] text-paper">Menyambungkan katalog ke agent coding</h2>
        <p className="text-[13px] text-paper-dim mt-1">
          Format JSONL datar cukup dibaca langsung — tidak perlu database vektor.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="border-l-2 border-verdigris pl-3 py-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-paper">{step.title}</span>
              <button
                onClick={() => copyText(step.code, idx)}
                className="flex items-center gap-1 text-[11px] text-paper-dim hover:text-paper transition-colors shrink-0"
              >
                {copiedIndex === idx ? (
                  <><Check className="w-3 h-3 text-verdigris" /> tersalin</>
                ) : (
                  <><Copy className="w-3 h-3" /> salin</>
                )}
              </button>
            </div>
            <p className="text-[12px] text-paper-dim mt-1 mb-2">{step.desc}</p>
            <pre className="text-[12px] font-mono bg-ink-950 border border-ink-600 p-3 rounded text-paper-dim overflow-x-auto">
              <code>{step.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
