import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { CorpusRecord, DomainInfo } from '../types.js';
import { verifyUrlAllowed } from '../security/integrity.js';
import { validateSafeIdentifier } from '../security/guard.js';

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/AMillionDriver/RAG-MUNGIL/main';

export const DOMAIN_DEFINITIONS: Record<
  string,
  { file: string; name: string; description: string; keywords: string[] }
> = {
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
  '03_ai_agent_security': {
    file: 'domains/03_ai_agent_security/data/03_ai_agent_security_clean.jsonl',
    name: 'AI Agent Security & LLM Guardrails',
    description: 'Prompt injection defense, tool shadowing mitigation, MCP security, adversarial jailbreak evasion, and agentic red-teaming.',
    keywords: ['prompt injection', 'jailbreak', 'mcp security', 'guardrails', 'red-team', 'owasp llm', 'agentic safety'],
  },
  '04_vulnerability_research': {
    file: 'domains/04_vulnerability_research/data/04_vulnerability_research_clean.jsonl',
    name: 'Software Security & Vulnerability Root Cause Analysis',
    description: 'Memory corruption, use-after-free, heap overflow, race conditions, C/C++ root cause analysis, and CVE triage.',
    keywords: ['memory corruption', 'use-after-free', 'heap overflow', 'cve', 'root cause', 'buffer overflow', 'sanitizer'],
  },
  '05_cloud_devsecops': {
    file: 'domains/05_cloud_devsecops/data/05_cloud_devsecops_clean.jsonl',
    name: 'Cloud Security Hardening & DevSecOps',
    description: 'Terraform misconfigurations, Kubernetes RBAC hardening, container escape defenses, AWS/GCP IAM security, and CI/CD pipelines.',
    keywords: ['kubernetes', 'terraform', 'rbac', 'iam', 'container escape', 'devsecops', 'cloud hardening', 'docker'],
  },
  '06_compiler_errors': {
    file: 'domains/06_compiler_errors/data/06_compiler_errors_clean.jsonl',
    name: 'Compiler Error Diagnostics',
    description: 'Compilation error resolution patterns, linker errors, type mismatch fixes, Rust borrow checker solutions, and GCC/Clang triage.',
    keywords: ['compiler error', 'linker error', 'rust borrow checker', 'gcc', 'clang', 'type mismatch', 'syntax error'],
  },
  '07_binary_analysis_forensics': {
    file: 'domains/07_binary_analysis_forensics/data/07_binary_analysis_forensics_clean.jsonl',
    name: 'Binary Analysis, Frida Instrumentation & Ghidra Forensics',
    description: 'Frida dynamic instrumentation hooks, Ghidra headless decompilation scripts, BinDiff N-day patch analysis, and binary reversing.',
    keywords: ['frida', 'interceptor', 'ghidra', 'flatprogramapi', 'bindiff', 'patch analysis', 'disassembly', 'reverse engineering'],
  },
  '08_captcha_automation_solver': {
    file: 'domains/08_captcha_automation_solver/data/08_captcha_automation_solver_clean.jsonl',
    name: 'CAPTCHA Automation, Computer Vision & Audio-AI Solvers',
    description: 'Speech-to-text audio challenge transcription via Faster-Whisper, YOLOv8 grid object detection, OpenCV slider puzzle matching, and ddddocr text preprocessing.',
    keywords: ['captcha', 'whisper', 'faster-whisper', 'yolov8', 'ddddocr', 'opencv', 'template matching', 'slider puzzle', 'recaptcha', 'hcaptcha'],
  },
  '09_captcha_architectures_evolution': {
    file: 'domains/09_captcha_architectures_evolution/data/09_captcha_architectures_evolution_clean.jsonl',
    name: 'CAPTCHA Architectures, Evolution (v1-v3) & Token Exchange Protocols',
    description: 'reCAPTCHA v2 vs v3 risk scoring comparison, Cloudflare Turnstile WASM Proof-of-Work, hCaptcha privacy dynamic scaling, and server-side siteverify token protocols.',
    keywords: ['recaptcha v2', 'recaptcha v3', 'turnstile', 'hcaptcha', 'siteverify', 'risk score', 'proof of work', 'wasm pow', 'step-up challenge'],
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
    // Validate domainId is a safe identifier
    validateSafeIdentifier(domainId, 'Domain ID');

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

    // 3. Remote fetch with strict URL verification
    if (!content) {
      try {
        const rawUrl = `${GITHUB_RAW_BASE}/${def.file}`;
        // Enforce SSRF & Domain Whitelist
        const verifiedUrl = verifyUrlAllowed(rawUrl);

        const res = await fetch(verifiedUrl.toString());
        if (res.ok) {
          content = await res.text();
          // Write to secure user cache
          try {
            fs.mkdirSync(cacheDir, { recursive: true, mode: 0o700 });
            fs.writeFileSync(domainCacheFile, content, { encoding: 'utf-8', mode: 0o600 });
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
