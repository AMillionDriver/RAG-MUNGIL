import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { CorpusRecord, DomainInfo } from '../types.js';

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/AMillionDriver/RAG-MUNGIL/main';

const DOMAIN_DEFINITIONS: Record<string, { file: string; name: string; description: string; keywords: string[] }> = {
  '01_rag_scraping': {
    file: 'domains/01_rag_scraping/data/01_rag_scraping_clean.jsonl',
    name: 'Web Scraping & Anti-Bot Evasion',
    description: 'TLS JA3/JA4 fingerprint evasion, curl-cffi, camoufox C++ engine, Cloudflare Turnstile bypass, and stealth scraping PoCs.',
    keywords: ['curl-cffi', 'camoufox', 'JA3', 'JA4', 'Cloudflare', 'Turnstile', 'Akamai', 'stealth', 'fingerprint'],
  },
  '02_web3_smart_contract': {
    file: 'domains/02_web3_smart_contract/data/02_web3_smart_contract_clean.jsonl',
    name: 'Web3 & Smart Contract Security',
    description: 'Foundry exploit reproduction tests, reentrancy vulnerabilities, read-only reentrancy, flash loans, and Code4rena audit findings.',
    keywords: ['foundry', 'forge test', 'reentrancy', 'flash loan', 'read-only reentrancy', 'curve', 'audit', 'solidity'],
  },
};

let cachedRecords: CorpusRecord[] | null = null;

export async function loadAllCorpusRecords(): Promise<CorpusRecord[]> {
  if (cachedRecords && cachedRecords.length > 0) {
    return cachedRecords;
  }

  const records: CorpusRecord[] = [];
  const cacheDir = path.join(os.homedir(), '.cache', 'rag-mungil');

  for (const [domainId, def] of Object.entries(DOMAIN_DEFINITIONS)) {
    let content: string | null = null;

    // 1. Check local repo relative paths
    const localCandidates = [
      path.resolve(process.cwd(), def.file),
      path.resolve(process.cwd(), '..', '..', def.file),
      path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..', '..', def.file),
    ];

    for (const candidate of localCandidates) {
      if (fs.existsSync(candidate)) {
        try {
          content = fs.readFileSync(candidate, 'utf-8');
          break;
        } catch {
          // continue
        }
      }
    }

    // 2. Check local user cache directory
    const domainCacheFile = path.join(cacheDir, `${domainId}.jsonl`);
    if (!content && fs.existsSync(domainCacheFile)) {
      try {
        const stats = fs.statSync(domainCacheFile);
        // Valid for 24 hours
        if (Date.now() - stats.mtimeMs < 24 * 60 * 60 * 1000) {
          content = fs.readFileSync(domainCacheFile, 'utf-8');
        }
      } catch {
        // continue
      }
    }

    // 3. Remote fetch from GitHub Raw
    if (!content) {
      try {
        const url = `${GITHUB_RAW_BASE}/${def.file}`;
        const res = await fetch(url);
        if (res.ok) {
          content = await res.text();
          // Write to cache
          try {
            fs.mkdirSync(cacheDir, { recursive: true });
            fs.writeFileSync(domainCacheFile, content, 'utf-8');
          } catch {
            // cache write failure is non-fatal
          }
        }
      } catch (err) {
        console.error(`Warning: Failed to fetch remote domain ${domainId}:`, err);
      }
    }

    // Parse JSONL lines
    if (content) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as CorpusRecord;
          if (parsed.id && parsed.content) {
            records.push(parsed);
          }
        } catch {
          // ignore corrupted lines
        }
      }
    }
  }

  cachedRecords = records;
  return records;
}

export async function getDomainsInfo(): Promise<DomainInfo[]> {
  const allRecords = await loadAllCorpusRecords();
  return Object.entries(DOMAIN_DEFINITIONS).map(([id, def]) => {
    const count = allRecords.filter((r) => r.domain === id).length;
    return {
      id,
      name: def.name,
      description: def.description,
      recordCount: count,
      sampleKeywords: def.keywords,
    };
  });
}

export function clearCorpusCache(): void {
  cachedRecords = null;
}
