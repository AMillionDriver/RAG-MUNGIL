import { z } from 'zod';
import { loadAllCorpusRecords } from '../loader/corpus-loader.js';

export const detailsToolSchema = {
  name: 'fetch_record_details',
  description:
    'Retrieves the full technical content, complete code snippets, and metadata of a specific record in RAG-MUNGIL by its unique record ID.',
  parameters: z.object({
    record_id: z.string().describe('The unique record identifier (e.g., "scraping_curl_cffi_curl_cffi", "web3_defihacklabs_reentrancy_poc")'),
  }),
};

export async function handleDetailsTool(args: z.infer<typeof detailsToolSchema.parameters>) {
  const records = await loadAllCorpusRecords();
  const found = records.find((r) => r.id === args.record_id);

  if (!found) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Record with ID "${args.record_id}" was not found. Try searching first using search_knowledge_base.`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            id: found.id,
            domain: found.domain,
            title: found.title,
            summary: found.summary,
            source_url: found.source_url,
            created_at: found.created_at,
            metadata: found.metadata,
            content: found.content,
          },
          null,
          2
        ),
      },
    ],
  };
}
