export const PROMPTS_LIST = [
  {
    name: 'audit-smart-contract',
    description: 'Guide for analyzing Solidity smart contracts against known exploits and Foundry reproduction patterns.',
    arguments: [
      {
        name: 'codeOrFocus',
        description: 'Code snippet or vulnerability focus (e.g., reentrancy, oracle manipulation)',
        required: false,
      },
    ],
  },
  {
    name: 'scrape-protected-target',
    description: 'Strategy for evading bot detection, TLS fingerprinting, and WAF challenges using RAG-MUNGIL techniques.',
    arguments: [
      {
        name: 'targetWaf',
        description: 'Protected target or WAF name (e.g. Cloudflare Turnstile, Akamai)',
        required: false,
      },
    ],
  },
];

export function getPromptMessages(name: string, args: Record<string, string> = {}) {
  if (name === 'audit-smart-contract') {
    const focus = args.codeOrFocus || 'Reentrancy / Oracle Vulnerabilities';
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `You are an elite Smart Contract Security Researcher. Use RAG-MUNGIL's verified Gold-Tier corpora to audit the following target: "${focus}". First call the search_knowledge_base tool with domain "02_web3_smart_contract" to find canonical exploit PoCs, and structure your response with: 1. Vulnerability Analysis, 2. Root Cause, 3. Foundry PoC Test Case (forge test), 4. Recommended Fix.`,
        },
      },
    ];
  }

  if (name === 'scrape-protected-target') {
    const waf = args.targetWaf || 'Cloudflare Turnstile';
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `You are an expert Web Scraping & Anti-Bot Evasion Engineer. Use RAG-MUNGIL's domain "01_rag_scraping" to formulate a robust stealth data collection pipeline against ${waf}. Query search_knowledge_base for curl-cffi or camoufox implementations, and provide a complete working Python script with correct TLS fingerprint impersonation.`,
        },
      },
    ];
  }

  throw new Error(`Prompt template "${name}" not found.`);
}
