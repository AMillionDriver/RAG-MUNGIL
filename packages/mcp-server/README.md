# 🏺 RAG-MUNGIL MCP Server

> Model Context Protocol (MCP) server for **RAG-MUNGIL** — connecting Claude Desktop, Cursor IDE, Windsurf, and custom AI Agents directly to verified technical corpora without hallucination.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

---

## 🚀 Quick Setup (Zero-Clone / 1-Command)

No need to clone this repository or install Python dependencies. Simply run:

```bash
npx -y rag-mungil-mcp --install
```

This auto-detects and configures both **Claude Desktop** and **Cursor IDE** on your operating system (macOS, Windows, Linux).

---

## 🛠️ Manual Configuration

### 1. Cursor IDE (`.cursor/mcp.json` or `~/.cursor/mcp.json`)
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

### 2. Claude Desktop (`claude_desktop_config.json`)
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

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

---

## 🧰 Available Tools for AI Agents

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_knowledge_base` | `query`, `domain?`, `limit?`, `mode?` | Hybrid Search (BM25 keyword + dense semantic vector) across all datasets. |
| `get_domain_topics` | *(none)* | Returns overview of all curated domains, record counts, and canonical keywords. |
| `fetch_record_details` | `record_id` | Retrieves full markdown technical content, PoC snippets, and raw source code. |
| `get_code_pocs` | `topic`, `domain?` | Filters specifically for ready-to-run PoC test suites (`forge test`, Playwright/curl-cffi evasion). |

---

## 🧪 Testing with MCP Inspector

You can test this server interactively in your browser using the official Anthropic MCP Inspector:

```bash
npx @modelcontextprotocol/inspector npx rag-mungil-mcp
```

---

## 📊 Curated Domains

1. **`01_rag_scraping`**: TLS JA3/JA4 fingerprint evasion, `curl-cffi`, `camoufox` C++ anti-detect engine, Cloudflare Turnstile bypass, and stealth scraping PoCs.
2. **`02_web3_smart_contract`**: Foundry exploit reproduction tests (`forge-std`), reentrancy vulnerabilities, read-only reentrancy, flash loan attacks, and Code4rena audit findings.
