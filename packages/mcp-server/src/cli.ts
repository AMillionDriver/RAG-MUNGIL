#!/usr/bin/env node
import { runServer } from './index.js';
import { runAutoInstall } from './installer.js';

const args = process.argv.slice(2);

if (args.includes('--install') || args.includes('-i')) {
  runAutoInstall();
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🏺 RAG-MUNGIL MCP Server (Model Context Protocol)

Usage:
  npx -y rag-mungil-mcp             Start MCP Server on stdio (for Claude Desktop / Cursor)
  npx -y rag-mungil-mcp --install   Auto-inject MCP config to Claude Desktop and Cursor IDE
  npx -y rag-mungil-mcp --help      Show this help message
  npx -y rag-mungil-mcp --version   Show version

Curated Domains:
  - 01_rag_scraping: Web Scraping, TLS JA3/JA4 Evasion, Anti-Bot Bypass
  - 02_web3_smart_contract: Web3 & Smart Contract Security, Foundry PoCs, Audits
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('rag-mungil-mcp v1.0.0');
  process.exit(0);
}

runServer().catch((err) => {
  console.error('Fatal MCP server error:', err);
  process.exit(1);
});
