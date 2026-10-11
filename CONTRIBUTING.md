# 🤝 Contributing to RAG-MUNGIL

First off, thank you for considering contributing to **RAG-MUNGIL**! Whether you are a human developer or an autonomous AI Agent, your contributions help expand open, verifiable, ground-truth technical corpora for the global engineering community.

---

## 🚀 How to Add a New Domain (Automated 1-Command Scaffolder)

We provide an automated CLI scaffolder so you never have to manually write boilerplate configuration or edit GitHub Actions workflows.

### 1. Run the Domain Scaffolder
From the repository root:
```bash
python -m core.add_domain --id 08_quantum_computing --label "Quantum Computing & Qiskit Algorithms"
```

### 2. What this Command Automatically Does:
1. Creates directory `domains/08_quantum_computing/` and subfolder `data/`.
2. Generates a standard declarative `config.json` with target keywords, weights, and scoring strategy.
3. Generates the standard backward-compatible adapter `crawler.py`.
4. Automatically registers the new domain into `.github/workflows/harvest.yml` matrix so scheduled harvesting starts immediately!

---

## 📊 Dataset Quality Standards (Gold-Tier Criteria)

To maintain the high-signal integrity of RAG-MUNGIL, all records must meet these strict invariants:

1. **Acceptance Threshold**: Records must achieve a heuristic judge score of **>= 75** (evaluated by `core/judge_engine.py`).
2. **Code-over-Text Tolerance**: We prioritize actionable, runnable code snippets (`forge test`, Playwright scripts, Frida hooks, Terraform blocks) over generic prose.
3. **Canonical Markdown**: Content must be well-structured markdown with proper language tags on code fences (e.g. ` ```python `, ` ```solidity `).
4. **Attribution**: Every record must have a verifiable `source_url`.
5. **Deduplication**: Never commit duplicate records. Run `python DATA_CLEANER.py` before submitting a Pull Request.

---

## 🛠️ MCP Server Development & Testing

If you are modifying the Model Context Protocol server in `packages/mcp-server/`:

### 1. Install Dependencies
```bash
cd packages/mcp-server
npm install
```

### 2. Run Quality Checks & Test Suite
All PRs modifying TypeScript code must pass the full test suite with zero errors:
```bash
npm run check
```
*(Runs TypeScript strict typechecking `tsc --noEmit` and all 30+ Vitest unit & security tests).*

### 3. Build Production Bundle
```bash
npm run build
```

---

## 📝 Commit Guidelines (Conventional Commits)

Please use conventional commit messages:
- `feat(domain)`: Adding a new domain or technique
- `feat(mcp)`: Adding a new MCP tool or capability
- `fix(crawler)`: Fixing crawler parsing or edge cases
- `docs(readme)`: Updating documentation or guidelines
- `chore(deps)`: Dependency updates or maintenance

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🇮🇩 Ringkasan Bahasa Indonesia

Untuk berkontribusi:
1. **Tambah Domain Baru**: Jalankan `python -m core.add_domain --id <id> --label <label>` (otomatis membuat folder, config, dan mendaftarkan CI).
2. **Kualitas Data**: Semua dataset harus melalui kurasi Gold-Tier dan dinormalisasi menggunakan `python DATA_CLEANER.py`.
3. **Uji Coba MCP**: Jalankan `npm run check` di folder `packages/mcp-server` untuk memastikan seluruh 30 unit test lolos.
