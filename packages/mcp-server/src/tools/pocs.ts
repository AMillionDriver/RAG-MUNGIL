import { z } from 'zod';
import { loadAllCorpusRecords } from '../loader/corpus-loader.js';
import { validateQuery, validateSafeIdentifier } from '../security/guard.js';
import { sanitizeAgentOutput } from '../security/sanitizer.js';

export const pocsToolSchema = {
  name: 'get_code_pocs',
  description:
    'Extracts raw, ready-to-run Proof-of-Concept (PoC) code snippets and test suites (e.g., Solidity Foundry forge-test, Python Playwright/curl-cffi evasion scripts, Frida native hooks, Ghidra headless scripts) matching a topic. Hardened against malicious injection payloads.',
  parameters: z.object({
    topic: z
      .string()
      .max(500, 'Topic length cannot exceed 500 characters.')
      .describe('Target keyword or vulnerability pattern (e.g. "reentrancy", "turnstile", "frida", "interceptor")'),
    domain: z.string().optional().default('all').describe('Target domain ID, or "all" to search across everything'),
  }),
};

export async function handlePocsTool(args: z.infer<typeof pocsToolSchema.parameters>) {
  // Security Layer 1: Bound topic input
  const safeTopic = validateQuery(args.topic, 500).toLowerCase();
  const safeDomain = args.domain && args.domain !== 'all' ? validateSafeIdentifier(args.domain, 'Domain') : 'all';

  const records = await loadAllCorpusRecords();

  const matched = records.filter((r) => {
    if (safeDomain !== 'all' && r.domain !== safeDomain) return false;
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
          text: `No code PoCs found for topic "${args.topic}" in domain "${safeDomain}".`,
        },
      ],
    };
  }

  // Security Layer 4: Output Sanitization
  const results = matched.map((m) => ({
    id: m.id,
    domain: m.domain,
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
            domain: safeDomain,
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
