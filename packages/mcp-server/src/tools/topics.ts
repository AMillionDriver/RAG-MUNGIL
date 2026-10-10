import { z } from 'zod';
import { getDomainsInfo } from '../loader/corpus-loader.js';

export const topicsToolSchema = {
  name: 'get_domain_topics',
  description:
    'Returns all available domain categories in RAG-MUNGIL, their descriptions, active record counts, and canonical technical keywords.',
  parameters: z.object({}),
};

export async function handleTopicsTool() {
  const domains = await getDomainsInfo();

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            repository: 'AMillionDriver/RAG-MUNGIL',
            tagline: 'Autonomous Dataset Harvester for RAG-Ready Technical Corpora',
            domains: domains.map((d) => ({
              id: d.id,
              name: d.name,
              description: d.description,
              recordCount: d.recordCount,
              sampleKeywords: d.sampleKeywords,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
}
