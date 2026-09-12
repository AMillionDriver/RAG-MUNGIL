# 🏺 RAG-MUNGIL
> *"Namanya mungil, tapi isinya gold."*

Autonomous Knowledge Harvester & RAG Engine yang secara terus-menerus mengumpulkan teknik tingkat tinggi (*Web Scraping, Anti-Bot Bypass, TLS Fingerprinting, Cloudflare/Akamai/Datadome Evasion*) dalam format **Clean JSONL** dengan skema *Fixed Core + Dynamic Metadata*.

---

## 📂 Struktur Repositori

```text
RAG-MUNGIL/
├── .github/workflows/
│   └── harvest.yml             # Workflow GitHub Actions (Jalan tiap 2 jam otomatis)
├── domains/
│   └── 01_rag_scraping/        # DOMAIN 1: Web Scraping & Stealth Engineering
│       ├── crawler.py          # Master Orchestrator
│       ├── explorer.py         # Autonomous Explorer (Dynamic Query + Link Hopper)
│       ├── judge.py            # Smart Bot Judge (Heuristic Multi-Factor Quality Gate)
│       └── data/
│           └── 01_rag_scraping_clean.jsonl   # DATASET GOLD FINAL (Siap pakai untuk Codex/LLM)
├── storage_final/
│   └── registry.json           # Manifest metadata & total record
├── DATA_CLEANER.py             # Sanitasi terpusat (Deduplikasi SHA-256 & filter noise)
├── search.py                   # Tool CLI pencarian instan untuk IDE Codex / Cursor
└── requirements.txt
```

---

## 🤖 Mekanisme Autonomous Explorer & Smart Judge Bot

1. **Dynamic Query Generator**: Bot mengombinasikan target WAF (*Turnstile, Akamai, DataDome, Kasada, JA4*) dengan tooling (*Camoufox, curl-cffi, Nodriver, CDP*) secara dinamis di setiap siklus.
2. **Recursive Link Hopper**: Membaca referensi outbound di dalam dokumentasi repositori yang lolos untuk menemukan repositori tersembunyi lainnya secara rekursif.
3. **Smart Bot Judge Gatekeeper**:
   - **Skor Kode (+35 poin)**: Wajib memiliki blok kode implementasi nyata.
   - **Skor Teknikal (+40 poin)**: Mendeteksi terminologi tingkat tinggi (TLS handshake, JA3/JA4, canvas noise, CDP evasion).
   - **Penalti Spam (-60 poin)**: Otomatis menendang promosi proxy komersial, affiliate link, dan tutorial Hello-World pemula tanpa anti-bot.
   - **Ambang Batas**: Hanya materi dengan skor $\ge 60$ yang diizinkan masuk ke dataset.

---

## ⚡ Cara Pakai di IDE (Codex / Cursor / Claude)

Cukup arahkan instruksi Agent di IDE Anda ke dataset atau gunakan tool pencari:

```bash
# Cari teknik bypass Cloudflare atau TLS
python search.py "cloudflare"
python search.py "ja4"
python search.py "camoufox"
```

Contoh instruksi ke AI Agent Codex:
> *"Tolong baca `domains/01_rag_scraping/data/01_rag_scraping_clean.jsonl` dan gunakan kode implementasi curl-cffi atau camoufox untuk membuat bot scraper yang lolos Cloudflare Turnstile."*

---

## ⚙️ Mekanisme Otomatisasi Cloud
- **Jadwal**: Workflow GitHub Actions berjalan otomatis tiap 2 jam (`0 */2 * * *`).
- **Safety**: Dilengkapi `git pull --rebase` untuk mencegah konflik push saat Anda membuka repo dari HP.
- **Deduplikasi**: Menggunakan SHA-256 fingerprinting di `DATA_CLEANER.py` agar tidak ada data dobel.
