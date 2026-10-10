export interface CorpusRecord {
  id: string;
  domain: string;
  title: string;
  summary: string;
  content: string;
  source_url: string;
  created_at: string;
  metadata?: {
    stars?: number;
    repo_name?: string;
    bypassed_wafs?: string[];
    tier?: string;
    code_snippets?: string[];
    vuln_type?: string;
    protocol?: string;
    content_tier?: string;
    [key: string]: unknown;
  };
}

export interface SearchResult {
  record: CorpusRecord;
  score: number;
  matchType: 'hybrid' | 'keyword' | 'semantic';
  bm25Score?: number;
  vectorScore?: number;
}

export interface DomainInfo {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  sampleKeywords: string[];
}
