# 🏺 RAG-MUNGIL
> *"Autonomous Dataset Harvester for RAG-Ready Technical Corpora"*

**RAG-MUNGIL** adalah engine harvester dataset otonom yang secara berkala menjelajah internet, mengurasi repositori & diskusi teknis mendalam (*deep technical knowledge*), dan memvalidasi kelayakan konten menggunakan sistem *heuristic multi-factor judge*. 

Dataset yang dihasilkan disimpan dalam format **Clean JSONL** dengan skema *Fixed Core + Dynamic Metadata*, teroptimasi siap konsumsi untuk pipeline **Retrieval-Augmented Generation (RAG)**, LLM Fine-Tuning, atau panduan kontekstual AI Agent (Codex / Cursor / Claude).

---

## 📊 Status Dataset Saat Ini

| Domain ID | Topik & Cakupan | Total Records | Status Kurasi | File Path |
| :--- | :--- | :---: | :---: | :--- |
| `01_rag_scraping` | Web Scraping, TLS/JA4 Evasion, Anti-Bot Bypass | **31** | Gold Tier | `domains/01_rag_scraping/data/01_rag_scraping_clean.jsonl` |
| `02_web3_smart_contract` | Web3 & Smart Contract Security, Foundry PoCs, Audits | **4+** | Gold Tier | `domains/02_web3_smart_contract/data/02_web3_smart_contract_clean.jsonl` |

> *Catatan: Semua records melalui validasi deduplikasi SHA-256 dan fuzzy Jaccard similarity.*

### 🔗 Sinergi Operasional: Domain 1 + Domain 2
Domain 1 (*Anti-Bot & Web Scraping Evasion*) bukan sekadar topik acak, melainkan **toolkit operasional** langsung yang memungkinkan pemanenan Domain 2 (*Web3 & Smart Contract Security*) berjalan reliable:
1. **Bypass Proteksi Platform Audit**: Platform agregator seperti Solodit, Etherscan/BscScan explorer, dan contest platform sering membatasi API key dan menerapkan rate-limit/Cloudflare. Teknik dari Domain 1 (impersonation `curl-cffi`, `camoufox`, CDP stealth) digunakan untuk memanen konten ini tanpa terblokir.
2. **Evergreen Scoring Mode (`recency_sensitive: false`)**: Insiden historis kanonikal (seperti *TheDAO hack*, *Parity multisig*, *Euler Finance*) tidak dipenalti usang karena prinsip keamanan smart contract bersifat abadi (*evergreen*).
3. **Ingesti Source Code Asli (`fetch_source_code_files`)**: Menarik file implementasi kode nyata (`*.t.sol`, `*.sol`, `*.vy`) via GitHub Git Tree API untuk mendapatkan script PoC Foundry (`forge test`) lengkap, bukan hanya teks README.

---

## 📂 Arsitektur & Struktur Repositori

```text
RAG-MUNGIL/
├── .github/workflows/
│   └── harvest.yml             # 2-Stage CI Pipeline (Paralel Matrix Harvester -> Single Atomic Committer)
├── core/                       # Core Engines (Domain-Agnostic & Reusable)
│   ├── crawler_engine.py       # Orchestrator & Pluggable Source Adapters (Seeds, Search, HackerNews)
│   ├── explorer_engine.py      # Resilient Client, Tree API Source Fetcher, & Recursive Link Hopper
│   ├── judge_engine.py         # Heuristic Judge Bot (Recency, Code Verification, Anti-Spam Gate)
│   └── add_domain.py           # CLI Scaffolder untuk menambah domain baru secara instan
├── domains/                    # Domain Plugins (Deklaratif)
│   ├── 01_rag_scraping/        # DOMAIN 1: Anti-Bot & Web Scraping Evasion
│   │   ├── config.json         # Konfigurasi domain (keywords, weights, signatures, seeds, strategy)
│   │   ├── exploration_history.json # Persistent graph traversal memory (visited repos & items)
│   │   └── data/01_rag_scraping_clean.jsonl # DATASET GOLD FINAL (RAG-Ready JSONL)
│   └── 02_web3_smart_contract/ # DOMAIN 2: Web3 & Smart Contract Security (Code4rena, Sherlock, Foundry)
│       ├── config.json         # Konfigurasi domain (Foundry signatures, evergreen mode, source glob)
│       └── data/02_web3_smart_contract_clean.jsonl # DATASET GOLD FINAL (RAG-Ready JSONL)
├── storage_final/
│   ├── registry.json           # Manifest sinkronisasi & hash fingerprinting
│   └── search_cache.db         # Cache Inverted Index SQLite FTS5 untuk pencarian instan
├── DATA_CLEANER.py             # Normalisasi sentral, validasi skema, & deduplikasi konten
├── search.py                   # Tool CLI pencarian lokal berkecepatan tinggi (FTS5 BM25)
└── requirements.txt
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
   - **Mode Sensitif Waktu (`recency_sensitive: true`)**: Repositori yang di-update $\le 180$ hari lalu mendapat $+20$ poin. Repositori usang ($> 730$ hari tanpa update) dijatuhi penalti berat **$-40$ poin**.
   - **Mode Evergreen (`evergreen_bonus: true`)**: Untuk domain fondasional (seperti Exploit, Kriptografi, atau Matematika), materi klasik tidak dipenalti dan justru mendapat apresiasi fondasi.
5. **Word-Count & Code Tolerance**:
   - Ambang batas teks minimal (default: 120 kata). Jika teks di bawah kuota namun memuat kode implementasi nyata yang padat, sistem mengaktifkan `code_over_text_tolerance` agar riset ringkas berkualitas tidak terbuang.
6. **Anti-Spam & Anti-Noob Gatekeeper (Penalti $-70$ poin)**:
   - Mendeteksi promosi proxy komersial, kode kupon diskon, tautan afiliasi, serta *dummy parser pemula* (misal: `requests.get` tanpa header atau tutorial `quotes.toscrape.com`). Terdeteksi langsung dipotong **$-70$ poin**.
7. **Ambang Batas Kelulusan (`accept_threshold`)**:
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
    "pushed_at": "2026-04-10T12:00:00Z",
    "bypassed_wafs": [
      "Cloudflare",
      "Akamai",
      "Datadome",
      "Kasada",
      "Incapsula"
    ],
    "judge_score": 105,
    "judge_verdict": "ACCEPTED",
    "code_snippets_count": 5
  }
}
```

---

## 🔍 Cara Penggunaan di IDE / Agent Workflow

### 1. Pencarian CLI Cepat (FTS5 BM25 Engine)
Repositori menyediakan skrip `search.py` yang menggunakan SQLite FTS5 *inverted index* untuk pencarian teks instan:

```bash
# Cari teknik penanganan Cloudflare / Turnstile
python search.py "cloudflare"

# Cari teknik TLS JA4 Fingerprinting
python search.py "ja4"

# Cari modul berbasis Camoufox
python search.py "camoufox"
```

### 2. Integrasi dengan Coding Assistant (Cursor / Claude / Copilot)
Arahkan AI coding assistant ke file dataset:
> *"Tolong baca file `domains/01_rag_scraping/data/01_rag_scraping_clean.jsonl` dan implementasikan HTTP client menggunakan curl-cffi dengan peniruan browser Chrome terbaru agar request ini tidak terblokir Cloudflare Challenge."*

---

## 🔄 Otomatisasi 2-Stage CI Pipeline (GitHub Actions)

Workflow harvester berjalan otomatis setiap 2 jam (`.github/workflows/harvest.yml`) dengan pola **Fan-Out (Matrix) $\to$ Fan-In (Single Aggregator)**:

1. **Stage 1 (`harvest-matrix`)**:
   - Setiap domain berjalan secara terisolasi pada worker matrix paralel.
   - Menggunakan token terisolasi (hanya dikirim ke `github.com`, bebas kebocoran ke pihak ketiga).
   - Tidak melakukan operasi Git Push untuk mengeliminasi potensi *concurrency race condition*.
   - Mengunggah raw JSON dan `exploration_history.json` sebagai artefak sementara.
2. **Stage 2 (`aggregate-and-commit`)**:
   - Berjalan setelah seluruh worker matrix selesai.
   - Mengunduh dan menyusun ulang seluruh artefak per domain berdasarkan ID domain.
   - Menjalankan `DATA_CLEANER.py` untuk sanitasi, validasi schema, dan deduplikasi terpusat.
   - Melakukan **Single Atomic Commit & Push** ke branch utama dengan pertahanan *3x retry loop + rebase*.

---

## ➕ Cara Menambahkan Domain Baru

Arsitektur sistem saat ini sepenuhnya *domain-agnostic*. Anda dapat menambah domain baru secara otomatis maupun manual:

### Cara Otomatis (Direkomendasikan)
Gunakan tool CLI scaffolder yang otomatis membuat konfigurasi standar dan mendaftarkannya ke matrix GitHub Actions:
```bash
python -m core.add_domain --id 02_smart_contract_exploits --label "Smart Contract Exploits" --threshold 75
```

### Cara Manual
1. Buat folder baru di bawah `domains/<domain_id>/` (contoh: `domains/02_smart_contract_exploits/`).
2. Sediakan `config.json` yang mendeklarasikan:
   - `domain_id`, `domain_label`, dan `accept_threshold`.
   - `scoring_strategy` (`recency_sensitive`, `evergreen_bonus`).
   - `ingestion_targets` (pola glob file kode sumber: misal `["*.t.sol", "*.sol"]`).
   - `enabled_sources` (`github_seeds`, `github_search`, `hackernews`).
   - `technical_keywords`, `actionable_code_signatures`, dan `spam_patterns`.
3. Daftarkan `domain_id` baru tersebut ke dalam matriks `.github/workflows/harvest.yml`:
   ```yaml
   strategy:
     matrix:
       domain:
         - 01_rag_scraping
         - 02_smart_contract_exploits
   ```
Engine harvester akan otomatis mengeksekusi proses kurasi untuk domain baru tersebut secara paralel dan teratur!
