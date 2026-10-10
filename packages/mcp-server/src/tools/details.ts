import { z } from 'zod';
import { loadAllCorpusRecords } from '../loader/corpus-loader.js';
import { validateSafeIdentifier } from '../security/guard.js';
import { sanitizeAgentOutput } from '../security/sanitizer.js';

export const detailsToolSchema = {
  name: 'fetch_record_details',
  description:
    'Retrieves the full technical content, complete code snippets, and metadata of a specific record in RAG-MUNGIL by its unique record ID. Enforces strict path traversal and prompt injection safeguards.',
  parameters: z.object({
    record_id: z.string().describe('The unique record identifier (e.g., "scraping_curl_cffi_curl_cffi", "web3_defihacklabs_reentrancy_poc")'),
  }),
};

export async function handleDetailsTool(args: z.infer<typeof detailsToolSchema.parameters>) {
  // Security Layer 1: Path Traversal defense
  const safeId = validateSafeIdentifier(args.record_id, 'Record ID');

  const records = await loadAllCorpusRecords();
  const found = records.find((r) => r.id === safeId);

  if (!found) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Record with ID "${safeId}" was not found. Try searching first using search_knowledge_base.`,
        },
      ],
    };
  }

  // Security Layer 4: Sanitize content against prompt injection
  const safePayload = {
    id: found.id,
    domain: found.domain,
    title: sanitizeAgentOutput(found.title),
    summary: sanitizeAgentOutput(found.summary),
    source_url: found.source_url,
    created_at: found.created_at,
    metadata: found.metadata,
    content: sanitizeAgentOutput(found.content),
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(safePayload, null, 2),
      },
    ],
  };
}
