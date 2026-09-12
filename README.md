# 🏺 RAG-MUNGIL
> *"Namanya mungil, tapi isinya gold."*

Mesin Autonomous Harvester untuk mengumpulkan data teknik tingkat tinggi (Web Scraping, Anti-Bot Bypass, Exploit Security, Matematika, dan Web Design) dalam format clean **JSONL**.

## 📁 Struktur Data
Semua data final yang bersih dan siap dihubungkan ke AI Agent / Codex disimpan di:
`domains/<kategori>/data/<kategori>_clean.jsonl`

## ⚙️ Cara Kerja
- **GitHub Actions** berjalan otomatis tiap 2 jam.
- Menjalankan crawler -> membersihkan noise lewat `DATA_CLEANER.py` -> auto commit data baru.