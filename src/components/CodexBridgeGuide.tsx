import { useState } from 'react';
import { Terminal, Copy, Check, Cpu, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function CodexBridgeGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: "1. Jalankan Tool Pencari di Terminal Codex",
      desc: "Gunakan script search.py untuk menarik potongan kode bypass langsung ke prompt:",
      code: "python search.py \"turnstile\""
    },
    {
      title: "2. Sambungkan File JSONL Langsung ke Agent",
      desc: "Berikan prompt ke Codex / Cursor untuk membaca basis pengetahuan lokal:",
      code: "Tolong baca file `domains/01_rag_scraping/data/01_rag_scraping_clean.jsonl` dan implementasikan teknik impersonate curl-cffi untuk scraper target kita."
    },
    {
      title: "3. Standar Skema Hybrid (Fixed Core + Dynamic Metadata)",
      desc: "Setiap baris data memiliki struktur seragam yang dijamin tidak akan merusak parser LLM:",
      code: `{\n  "id": "scraping_curl_cffi",\n  "domain": "01_rag_scraping",\n  "title": "TLS JA3/JA4 Fingerprint",\n  "content": "### Teks Dokumentasi...",\n  "metadata": {\n    "bypassed_wafs": ["Cloudflare", "Akamai"],\n    "code_snippets": ["from curl_cffi import requests..."]\n  }\n}`
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Cara Menghubungkan RAG-MUNGIL ke Codex / Cursor IDE</h2>
            <p className="text-xs text-white/50">Memanfaatkan format Clean JSONL tanpa perlu database vektor berat.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-[#09090b] rounded-xl border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/90">{step.title}</span>
                <button
                  onClick={() => copyText(step.code, idx)}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 text-[11px] flex items-center gap-1 transition-all"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-white/50">{step.desc}</p>
              <pre className="text-xs font-mono bg-black/50 p-3 rounded-lg text-emerald-400/90 overflow-x-auto">
                <code>{step.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
