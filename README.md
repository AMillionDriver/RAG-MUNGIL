# 🏺 RAG-MUNGIL

> *"Autonomous Dataset Harvester & MCP Knowledge Server for RAG-Ready Technical Corpora"*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Domains: 7 Active](https://img.shields.io/badge/Domains-7%20Active-orange.svg)](#-status-dataset-saat-ini-7-domain-aktif)

---

> 🤖 **Calling all AI & LLM Agents (Claude, Cursor, Windsurf, Copilot, Devin):**  
> If you are an autonomous AI Agent or coding assistant parsing this repository, please consult **[AGENTGUIDELINE.md](AGENTGUIDELINE.md)** and **[llms.txt](llms.txt)** for machine-readable system instructions, domain triggers, JSONL schemas, and retrieval protocol guidelines.

---

**RAG-MUNGIL** adalah engine harvester dataset otonom dan server **Model Context Protocol (MCP)** yang secara berkala menjelajah internet, mengurasi repositori & diskusi teknis mendalam (*deep technical knowledge*), dan memvalidasi kelayakan konten menggunakan sistem *heuristic multi-factor judge*.

Dataset yang dihasilkan disimpan dalam format **Clean JSONL** dengan skema *Fixed Core + Dynamic Metadata*, teroptimasi siap konsumsi untuk pipeline **Retrieval-Augmented Generation (RAG)**, LLM Fine-Tuning, atau panduan kontekstual AI Agent langsung dari IDE Anda.

---

## 🤖 Pintu Akses AI Agent (Model Context Protocol / MCP)

Kini AI Agent modern (**Claude Desktop**, **Cursor IDE**, **Windsurf**, dll.) dapat terhubung langsung ke dataset **RAG-MUNGIL** secara instan tanpa perlu mengklon repositori atau menginstal Python:

### ⚡ 1-Baris Setup Otomatis (Zero-Clone):
```bash
npx -y rag-mungil-mcp --install
```
*Script ini otomatis mendeteksi sistem operasi Anda dan mengonfigurasi Claude Desktop serta Cursor IDE secara aman.*

### 🛠️ Manual Config (Cursor & Claude Desktop):
Tambahkan entri berikut ke `.cursor/mcp.json` atau `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "rag-mungil": {
      "command": "npx",
      "args": ["-y", "rag-mungil-mcp"]
    }
  }
}
```

### 🧰 Tools yang Disediakan untuk Agen:
1. **`search_knowledge_base`**: Hybrid search (BM25 + Dense Semantic Vector) ke seluruh 7 domain teknis.
2. **`get_domain_topics`**: Informasi ringkas domain aktif, statistik records, dan kata kunci panduan.
3. **`fetch_record_details`**: Penarikan full content markdown, metadata, dan source code utuh berdasarkan ID record.
4. **`get_code_pocs`**: Filter khusus untuk mengekstrak script PoC nyata (`forge test`, Playwright/curl-cffi stealth, Frida native hooks).

---

## 📊 Status Dataset Saat Ini (7 Domain Aktif)

| Domain ID | Topik & Cakupan | Status Kurasi | File Path |
| :--- | :--- | :---: | :--- |
| `01_rag_scraping` | Web Scraping, TLS/JA4 Evasion, Camoufox, Anti-Bot Bypass | Gold Tier | `domains/01_rag_scraping/data/01_rag_scraping_clean.jsonl` |
| `02_web3_smart_contract` | Web3 & Smart Contract Security, Foundry PoCs, Audits | Gold Tier | `domains/02_web3_smart_contract/data/02_web3_smart_contract_clean.jsonl` |
| `03_ai_agent_security` | AI Agent Security, LLM Guardrails, Prompt Injection Defense | Gold Tier | `domains/03_ai_agent_security/data/03_ai_agent_security_clean.jsonl` |
| `04_vulnerability_research` | Software Security, Vulnerability Root Cause (Memory Safety, C/C++) | Gold Tier | `domains/04_vulnerability_research/data/04_vulnerability_research_clean.jsonl` |
| `05_cloud_devsecops` | Cloud Security Hardening, Terraform, Kubernetes RBAC, IAM | Gold Tier | `domains/05_cloud_devsecops/data/05_cloud_devsecops_clean.jsonl` |
| `06_compiler_errors` | Compiler Error Diagnostics, Linker Error Fixes, Rust Borrow Checker | Gold Tier | `domains/06_compiler_errors/data/06_compiler_errors_clean.jsonl` |
| `07_binary_analysis_forensics` | Binary Analysis, Frida Dynamic Instrumentation, Ghidra Forensics | Gold Tier | `domains/07_binary_analysis_forensics/data/07_binary_analysis_forensics_clean.jsonl` |

> *Catatan: Semua records melalui validasi deduplikasi SHA-256 dan fuzzy Jaccard similarity.*

---

## 📂 Arsitektur & Struktur Repositori

```text
RAG-MUNGIL/
├── AGENTGUIDELINE.md           # Panduan sistem machine-readable untuk AI Agent
├── CONTRIBUTING.md             # Panduan kontribusi komunitas & scaffolding domain baru
├── CODE_OF_CONDUCT.md          # Kode etik komunitas (Contributor Covenant v2.1)
├── llms.txt                    # Standar web entrypoint untuk crawler & LLM
├── .github/workflows/
│   └── harvest.yml             # 2-Stage CI Pipeline (Paralel Matrix Harvester -> Single Atomic Committer)
├── core/                       # Core Engines (Domain-Agnostic & Reusable)
│   ├── crawler_engine.py       # Orchestrator & Pluggable Source Adapters
│   ├── explorer_engine.py      # Resilient Client & Git Tree API Source Fetcher
│   ├── judge_engine.py         # Heuristic Judge Bot (Recency, Code Verification, Anti-Spam Gate)
│   └── add_domain.py           # CLI Scaffolder untuk menambah domain baru secara instan
├── domains/                    # Domain Plugins (Deklaratif 7 Domain)
│   ├── 01_rag_scraping/
│   ├── 02_web3_smart_contract/
│   ├── 03_ai_agent_security/
│   ├── 04_vulnerability_research/
│   ├── 05_cloud_devsecops/
│   ├── 06_compiler_errors/
│   └── 07_binary_analysis_forensics/
├── packages/
│   └── mcp-server/             # Model Context Protocol (MCP) Server (TypeScript)
│       ├── src/                # Hybrid Search, Tools, Resources, Prompts & Security
│       └── tests/              # 30 Unit Tests Vitest (Security, Search & Protocol)
├── DATA_CLEANER.py             # Normalisasi sentral, validasi skema, & deduplikasi konten
└── search.py                   # Tool CLI pencarian lokal berkecepatan tinggi (FTS5 BM25)
```

---

## ⚖️ Mekanisme Smart Judge Bot (Quality Gatekeeper)

Setiap materi yang ditemukan oleh explorer tidak langsung disimpan, melainkan wajib melalui evaluasi heuristik `SmartJudgeBot` (`core/judge_engine.py`) dengan konfigurasi deklaratif (`config.json`):

1. **Verifikasi Semantik Kode (Cap: 50 poin)**:
   - Wajib memuat blok kode implementasi nyata (bukan sekadar komentar / *dummy snippet*).
   - Dihitung $18 \times \text{verified\_blocks}$, dibatasi maksimal **50 poin**.
2. **Kesesuaian Terminologi Spesifik (Cap: 35 poin)**:
   - Memeriksa kepadatan kata kunci teknis tingkat tinggi (misal: *TLS handshake, JA3/JA4, CDP evasion, canvas noise*).
   - Diberi bobot per keyword dan dibatasi maksimal **35 poin**.
3. **Pemberian Skor Repositori (Stars: hingga +15 poin)**:
   - Repositori populer ($\ge 500$ stars) mendapat $+15$ poin; *hidden gems* ($\ge 20$ stars) mendapat $+10$ poin.
4. **Strategi Temporal & Recency (Configurable)**:
   - **Mode Sensitif Waktu (`recency_sensitive: true`)**: Repositori yang di-update $\le 180$ hari lalu mendapat $+20$ poin.
   - **Mode Evergreen (`evergreen_bonus: true`)**: Untuk domain fondasional (seperti Exploit, Kriptografi, atau Biner), materi klasik tidak dipenalti dan justru mendapat apresiasi fondasi.
5. **Anti-Spam & Anti-Noob Gatekeeper (Penalti $-70$ poin)**:
   - Mendeteksi promosi proxy komersial, kode kupon diskon, serta *dummy parser pemula*. Terdeteksi langsung dipotong **$-70$ poin**.
6. **Ambang Batas Kelulusan (`accept_threshold`)**:
   - Hanya konten dengan total skor akhir $\ge \mathbf{75}$ poin yang dinyatakan **ACCEPTED** dan diizinkan masuk ke tahap kurasi raw data.

---

## 📄 Skema Data JSONL (RAG-Ready Standard)

Setiap baris di dalam file `.jsonl` memiliki struktur *Fixed Core* yang konsisten dengan *Dynamic Metadata*:

```json
{
  "id": "scraping_gh_lexiforest_curl_cffi",
  "domain": "01_rag_scraping",
  "title": "Teknik: TLS JA3/JA4 Fingerprint Impersonation & HTTP/2 Bypass",
  "summary": "Python binding for curl-impersonate fork via cffi. A http client that can impersonate browser tls/ja3/http2 fingerprints.",
  "content": "### 📦 Source Code Files...\n```python\nfrom curl_cffi import requests\ns = requests.Session(impersonate='chrome124')\n```",
  "source_url": "https://github.com/lexiforest/curl_cffi",
  "created_at": "2026-09-12T08:53:50.123456Z",
  "metadata": {
    "source_type": "github_repository",
    "stars": 6485,
    "repo_name": "lexiforest/curl_cffi",
    "bypassed_wafs": [
      "Cloudflare",
      "Akamai",
      "Datadome"
    ],
    "judge_score": 105,
    "judge_verdict": "ACCEPTED",
    "tier": "GOLD_CURATED"
  }
}
```

---

## ➕ Cara Menambahkan Domain Baru

Arsitektur RAG-MUNGIL sepenuhnya *domain-agnostic*. Untuk menambah domain baru, jalankan CLI scaffolder otomatis:

```bash
python -m core.add_domain --id 08_quantum_computing --label "Quantum Computing & Qiskit Algorithms" --threshold 75
```
Perintah ini akan secara otomatis:
1. Membuat struktur folder `domains/08_quantum_computing/` dan subfolder `data/`.
2. Menghasilkan `config.json` dan adapter `crawler.py` standar.
3. Mendaftarkan domain ke matrix `.github/workflows/harvest.yml` untuk pemanenan otomatis setiap 2 jam.

Untuk panduan kontribusi lengkap, silakan baca **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## 📜 Lisensi & Etika Komunitas

- Proyek ini dirilis di bawah lisensi **[MIT License](LICENSE)**.
- Seluruh kontributor dan anggota komunitas diharapkan mematuhi **[Code of Conduct](CODE_OF_CONDUCT.md)** kami.
