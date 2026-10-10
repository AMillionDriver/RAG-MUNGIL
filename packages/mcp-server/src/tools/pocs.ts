import { z } from 'zod';
import { loadAllCorpusRecords } from '../loader/corpus-loader.js';
import { validateQuery } from '../security/guard.js';
import { sanitizeAgentOutput } from '../security/sanitizer.js';

export const pocsToolSchema = {
  name: 'get_code_pocs',
  description:
    'Extracts raw, ready-to-run Proof-of-Concept (PoC) code snippets and test suites (e.g., Solidity Foundry forge-test, Python Playwright/curl-cffi evasion scripts) matching a topic. Hardened against malicious injection payloads.',
  parameters: z.object({
    topic: z
      .string()
      .max(500, 'Topic length cannot exceed 500 characters.')
      .describe('Target keyword or vulnerability pattern (e.g. "reentrancy", "turnstile", "oracle")'),
    domain: z.enum(['all', '01_rag_scraping', '02_web3_smart_contract']).optional().default('all'),
  }),
};

export async function handlePocsTool(args: z.infer<typeof pocsToolSchema.parameters>) {
  // Security Layer 1: Bound topic input
  const safeTopic = validateQuery(args.topic, 500).toLowerCase();

  const records = await loadAllCorpusRecords();

  const matched = records.filter((r) => {
    if (args.domain !== 'all' && r.domain !== args.domain) return false;
    const hasCode = Boolean(r.metadata?.code_snippets?.length) || r.content.includes('```');
    if (!hasCode) return false;

    const fullText = `${r.title} ${r.summary} ${r.content} ${r.metadata?.vuln_type || ''}`.toLowerCase();
    return fullText.includes(safeTopic);
  });

  if (matched.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No code PoCs found for topic "${args.topic}" in domain "${args.domain}".`,
        },
      ],
    };
  }

  // Security Layer 4: Output Sanitization
  const results = matched.map((m) => ({
    id: m.id,
    title: sanitizeAgentOutput(m.title),
    source_url: m.source_url,
    snippets: (m.metadata?.code_snippets || []).map((s) => sanitizeAgentOutput(s)),
    markdown_content: sanitizeAgentOutput(m.content),
  }));

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            topic: args.topic,
            totalFound: results.length,
            pocs: results,
          },
          null,
          2
        ),
      },
    ],
  };
}
