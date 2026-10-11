import { describe, it, expect } from 'vitest';
import { BM25Engine } from '../src/engine/bm25.js';
import { SemanticVectorEngine } from '../src/engine/vector.js';
import { HybridRetrievalEngine } from '../src/engine/fusion.js';
import type { CorpusRecord } from '../src/types.js';

const mockCorpus: CorpusRecord[] = [
  {
    id: 'test_1',
    domain: '01_rag_scraping',
    title: 'Curl-Cffi TLS JA4 Fingerprint Impersonation',
    summary: 'Emulates Chrome 124 TLS and HTTP/2 signatures to bypass Cloudflare Turnstile.',
    content: 'from curl_cffi import requests\nsession = requests.Session(impersonate="chrome124")',
    source_url: 'https://github.com/curl-cffi/curl-cffi',
    created_at: '2026-09-01T00:00:00Z',
    metadata: {
      bypassed_wafs: ['Cloudflare'],
      tier: 'GOLD_CURATED',
    },
  },
  {
    id: 'test_2',
    domain: '01_rag_scraping',
    title: 'Camoufox Firefox Stealth Engine Anti-Detect',
    summary: 'Camoufox modifies C++ Mozilla Firefox source code to prevent canvas and WebGL fingerprint leaks.',
    content: 'from camoufox.sync_api import Camoufox\nwith Camoufox() as browser:\n    browser.new_page()',
    source_url: 'https://github.com/daijro/camoufox',
    created_at: '2026-09-02T00:00:00Z',
    metadata: {
      bypassed_wafs: ['DataDome'],
    },
  },
  {
    id: 'test_3',
    domain: '02_web3_smart_contract',
    title: 'Foundry Exploit PoC Reentrancy Attack',
    summary: 'Classic and read-only reentrancy attack reproduction using Foundry forge test suite.',
    content: 'contract ReentrancyExploit is Test { function testDrain() public { ... } }',
    source_url: 'https://github.com/SunWeb3Sec/DeFiHackLabs',
    created_at: '2026-09-03T00:00:00Z',
    metadata: {
      vuln_type: 'Reentrancy',
    },
  },
  {
    id: 'test_4',
    domain: '07_binary_analysis_forensics',
    title: 'Frida Native Interceptor Hook & Memory Hexdump',
    summary: 'Hooks native C/C++ exports using Interceptor.attach and dumps buffer memory.',
    content: 'Interceptor.attach(targetFunc, { onEnter: function(args) { console.log(hexdump(args[0])); } });',
    source_url: 'https://github.com/frida/frida',
    created_at: '2026-10-10T00:00:00Z',
    metadata: {
      tool: 'Frida',
    },
  },
  {
    id: 'test_5',
    domain: '08_captcha_automation_solver',
    title: 'Faster-Whisper Audio CAPTCHA Accessibility Solver',
    summary: 'Speech-to-text audio challenge transcription using faster-whisper model.',
    content: 'from faster_whisper import WhisperModel\nmodel = WhisperModel("base", device="cpu")',
    source_url: 'https://github.com/SYSTRAN/faster-whisper',
    created_at: '2026-10-10T18:00:00Z',
    metadata: {
      tool: 'faster-whisper',
    },
  },
];

describe('Hybrid Retrieval Engine', () => {
  it('BM25 matches exact code terms accurately', () => {
    const bm25 = new BM25Engine();
    bm25.index(mockCorpus);

    const results = bm25.search('curl_cffi');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].record.id).toBe('test_1');
  });

  it('Semantic Vector matches conceptual terms', () => {
    const vec = new SemanticVectorEngine();
    vec.index(mockCorpus);

    const results = vec.search('stealth browser fingerprint');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].record.id).toBe('test_2');
  });

  it('Hybrid RRF fuses keyword and semantic results with high confidence', () => {
    const hybrid = new HybridRetrievalEngine();
    hybrid.index(mockCorpus);

    const results = hybrid.search('reentrancy vulnerability exploit test', {
      domain: '02_web3_smart_contract',
      mode: 'hybrid',
    });

    expect(results.length).toBe(1);
    expect(results[0].record.id).toBe('test_3');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('searches and filters Domain 07 binary analysis records correctly', () => {
    const hybrid = new HybridRetrievalEngine();
    hybrid.index(mockCorpus);

    const results = hybrid.search('frida interceptor hook', {
      domain: '07_binary_analysis_forensics',
      mode: 'hybrid',
    });

    expect(results.length).toBe(1);
    expect(results[0].record.id).toBe('test_4');
    expect(results[0].record.domain).toBe('07_binary_analysis_forensics');
  });

  it('searches and filters Domain 08 captcha solver records correctly', () => {
    const hybrid = new HybridRetrievalEngine();
    hybrid.index(mockCorpus);

    const results = hybrid.search('whisper audio captcha', {
      domain: '08_captcha_automation_solver',
      mode: 'hybrid',
    });

    expect(results.length).toBe(1);
    expect(results[0].record.id).toBe('test_5');
    expect(results[0].record.domain).toBe('08_captcha_automation_solver');
  });

  it('respects domain filter correctly', () => {
    const hybrid = new HybridRetrievalEngine();
    hybrid.index(mockCorpus);

    const scrapingResults = hybrid.search('exploit', { domain: '01_rag_scraping' });
    expect(scrapingResults.every((r) => r.record.domain === '01_rag_scraping')).toBe(true);
  });
});
