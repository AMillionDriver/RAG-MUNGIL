import { getDomainsInfo } from '../loader/corpus-loader.js';

export async function listDomainResources() {
  const domains = await getDomainsInfo();
  return domains.map((d) => ({
    uri: `rag-mungil://domains/${d.id}`,
    name: `${d.name} Corpus Summary`,
    mimeType: 'application/json',
    description: d.description,
  }));
}

export async function readDomainResource(uri: string) {
  const match = uri.match(/^rag-mungil:\/\/domains\/(.+)$/);
  if (!match) {
    throw new Error(`Unsupported resource URI: ${uri}`);
  }

  const domainId = match[1];
  const domains = await getDomainsInfo();
  const domain = domains.find((d) => d.id === domainId);

  if (!domain) {
    throw new Error(`Domain "${domainId}" not found in RAG-MUNGIL`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(domain, null, 2),
      },
    ],
  };
}
