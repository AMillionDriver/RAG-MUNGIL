import { z } from 'zod';
import { HybridRetrievalEngine } from '../engine/fusion.js';
import { loadAllCorpusRecords } from '../loader/corpus-loader.js';

export const searchToolSchema = {
  name: 'search_knowledge_base',
  description:
    'Search curated technical corpora in RAG-MUNGIL across Web Scraping/Anti-bot Evasion and Web3/Smart Contract Security. Uses hybrid BM25 lexical keyword matching and vector semantic retrieval.',
  parameters: z.object({
    query: z.string().describe('The search query (e.g., "curl-cffi JA4 bypass Cloudflare", "Foundry reentrancy PoC")'),
    domain: z
      .enum(['all', '01_rag_scraping', '02_web3_smart_contract'])
      .optional()
      .default('all')
      .describe('Target domain ID, or "all" to search across everything'),
    limit: z.number().int().min(1).max(20).optional().default(5).describe('Maximum number of records to return'),
    mode: z.enum(['hybrid', 'keyword', 'semantic']).optional().default('hybrid').describe('Retrieval algorithm mode'),
  }),
};

let engineInstance: HybridRetrievalEngine | null = null;

async function getEngine(): Promise<HybridRetrievalEngine> {
  if (!engineInstance) {
    const records = await loadAllCorpusRecords();
    engineInstance = new HybridRetrievalEngine();
    engineInstance.index(records);
  }
  return engineInstance;
}

export async function handleSearchTool(args: z.infer<typeof searchToolSchema.parameters>) {
  const engine = await getEngine();
  const results = engine.search(args.query, {
    domain: args.domain,
    limit: args.limit,
    mode: args.mode,
  });

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No records found in RAG-MUNGIL for query "${args.query}" (domain: ${args.domain}).`,
        },
      ],
    };
  }

  const formatted = results.map((r, index) => {
    return {
      rank: index + 1,
      id: r.record.id,
      domain: r.record.domain,
      title: r.record.title,
      summary: r.record.summary,
      score: r.score,
      source_url: r.record.source_url,
      bypassed_wafs: r.record.metadata?.bypassed_wafs,
      vuln_type: r.record.metadata?.vuln_type,
      has_code_snippets: Boolean(r.record.metadata?.code_snippets?.length),
    };
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            query: args.query,
            totalMatches: results.length,
            mode: args.mode,
            results: formatted,
            note: 'To fetch complete source code PoCs, call fetch_record_details with the record id.',
          },
          null,
          2
        ),
      },
    ],
  };
}
