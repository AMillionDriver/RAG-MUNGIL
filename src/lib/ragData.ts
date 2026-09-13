/**
 * Live data layer untuk RAG-MUNGIL Explorer.
 *
 * Alih-alih membekukan snapshot dataset ke dalam source code (lihat catatan
 * di src/data/scrapingDataset.ts), modul ini menarik data langsung dari
 * cabang `main` repo GitHub setiap kali halaman dibuka. raw.githubusercontent.com
 * mengirim header `Access-Control-Allow-Origin: *`, jadi fetch client-side ini
 * jalan tanpa perlu server perantara.
 *
 * Konsekuensinya: begitu bot auto-harvest commit data baru, refresh halaman
 * ini langsung menampilkannya — tidak perlu rebuild/redeploy Vercel.
 */

export interface RagRecord {
  id: string;
  domain: string;
  title: string;
  summary: string;
  content: string;
  source_url: string;
  created_at: string;
  metadata: {
    stars?: number;
    repo_name?: string;
    bypassed_wafs?: string[];
    vuln_type?: string;
    protocol?: string;
    tier?: 'GOLD_CURATED' | 'DISCOVERED';
    code_snippets?: string[];
    [key: string]: any;
  };
}

export interface DomainStatus {
  id: string;
  label: string;
  totalRecords: number;
  lastUpdated: string | null;
}

export interface RagDataset {
  records: RagRecord[];
  domains: DomainStatus[];
  fetchedAt: string;
}

const RAW_BASE = 'https://raw.githubusercontent.com/AMillionDriver/RAG-MUNGIL/main';

// Judul situs per domain. Kalau domain baru ditambahkan di repo tapi belum
// didaftarkan di sini, humanizeDomainId() dipakai sebagai fallback otomatis.
const DOMAIN_LABELS: Record<string, string> = {
  '01_rag_scraping': 'Scraping & Anti-Bot Evasion',
  '02_web3_smart_contract': 'Web3 & Smart Contract Security',
  '03_ai_agent_security': 'AI Agent Security & Guardrails',
  '04_vulnerability_research': 'Software Security & RCA',
  '05_cloud_devsecops': 'Cloud Security & DevSecOps',
};

function humanizeDomainId(id: string): string {
  return id.replace(/^\d+_/, '').replace(/_/g, ' ');
}

function parseJsonl(text: string): RagRecord[] {
  const records: RagRecord[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed) as RagRecord);
    } catch {
      // Baris korup/parsial dilewati saja, tidak menggagalkan seluruh load.
    }
  }
  return records;
}

async function fetchRegistry(): Promise<Record<string, { last_updated: string; total_records: number }>> {
  const res = await fetch(`${RAW_BASE}/storage_final/registry.json`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Gagal membaca registry.json (HTTP ${res.status})`);
  }
  const data = await res.json();
  const { hashes, ...domainEntries } = data;
  return domainEntries;
}

async function fetchDomainRecords(domainId: string): Promise<RagRecord[]> {
  const url = `${RAW_BASE}/domains/${domainId}/data/${domainId}_clean.jsonl`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    // Domain terdaftar di registry tapi file datanya belum ada (situs baru,
    // belum ada siklus harvest yang lolos) — bukan error fatal, kosongkan saja.
    return [];
  }
  const text = await res.text();
  return parseJsonl(text);
}

export async function loadRagDataset(): Promise<RagDataset> {
  const registry = await fetchRegistry();
  const domainIds = Object.keys(registry);

  const perDomainRecords = await Promise.all(
    domainIds.map((id) => fetchDomainRecords(id))
  );

  const domains: DomainStatus[] = domainIds.map((id, idx) => ({
    id,
    label: DOMAIN_LABELS[id] ?? humanizeDomainId(id),
    totalRecords: perDomainRecords[idx].length,
    lastUpdated: registry[id]?.last_updated ?? null,
  }));

  return {
    records: perDomainRecords.flat(),
    domains,
    fetchedAt: new Date().toISOString(),
  };
}

/** Format "47 menit lalu" dari string ISO — dipakai di log status situs. */
export function timeAgo(isoString: string | null): string {
  if (!isoString) return 'belum pernah disurvei';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'barusan';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}
