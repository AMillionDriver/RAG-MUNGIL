import { z } from 'zod';
import { loadAllCorpusRecords } from '../loader/corpus-loader.js';

export const pocsToolSchema = {
  name: 'get_code_pocs',
  description:
    'Extracts raw, ready-to-run Proof-of-Concept (PoC) code snippets and test suites (e.g., Solidity Foundry forge-test, Python Playwright/curl-cffi evasion scripts) matching a topic.',
  parameters: z.object({
    topic: z.string().describe('Target keyword or vulnerability pattern (e.g. "reentrancy", "turnstile", "oracle")'),
    domain: z.enum(['all', '01_rag_scraping', '02_web3_smart_contract']).optional().default('all'),
  }),
};

export async function handlePocsTool(args: z.infer<typeof pocsToolSchema.parameters>) {
  const records = await loadAllCorpusRecords();
  const lowerTopic = args.topic.toLowerCase();

  const matched = records.filter((r) => {
    if (args.domain !== 'all' && r.domain !== args.domain) return false;
    const hasCode = Boolean(r.metadata?.code_snippets?.length) || r.content.includes('```');
    if (!hasCode) return false;

    const fullText = `${r.title} ${r.summary} ${r.content} ${r.metadata?.vuln_type || ''}`.toLowerCase();
    return fullText.includes(lowerTopic);
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

  const results = matched.map((m) => ({
    id: m.id,
    title: m.title,
    source_url: m.source_url,
    snippets: m.metadata?.code_snippets || [],
    markdown_content: m.content,
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
