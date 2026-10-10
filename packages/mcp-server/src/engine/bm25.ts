import type { CorpusRecord } from '../types.js';

export function tokenizeCodeAndText(text: string): string[] {
  // Lowercase & split on whitespace and standard punctuation, while preserving code identifiers
  const cleaned = text.toLowerCase();
  // Match alphanumeric words, including underscores and hyphens (common in code & CVEs)
  const tokens: string[] = [];
  const rawTokens = cleaned.match(/[a-z0-9_.-]{2,}/g) || [];

  for (const token of rawTokens) {
    tokens.push(token);
    // Split camelCase or snake_case if present
    if (token.includes('_') || token.includes('-') || token.includes('.')) {
      const parts = token.split(/[_.-]/).filter((p) => p.length >= 2);
      tokens.push(...parts);
    }
  }

  return tokens;
}

export class BM25Engine {
  private k1: number;
  private b: number;
  private corpus: CorpusRecord[] = [];
  private docTokens: string[][] = [];
  private docLengths: number[] = [];
  private avgDocLength: number = 0;
  private docFrequencies: Map<string, number> = new Map();
  private numDocs: number = 0;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  public index(corpus: CorpusRecord[]): void {
    this.corpus = corpus;
    this.numDocs = corpus.length;
    this.docTokens = [];
    this.docLengths = [];
    this.docFrequencies.clear();

    let totalLength = 0;

    for (const doc of corpus) {
      const searchableText = `${doc.title} ${doc.summary} ${doc.content} ${
        doc.metadata?.bypassed_wafs?.join(' ') || ''
      } ${doc.metadata?.vuln_type || ''}`;

      const tokens = tokenizeCodeAndText(searchableText);
      this.docTokens.push(tokens);
      this.docLengths.push(tokens.length);
      totalLength += tokens.length;

      // Unique terms in doc for document frequency
      const uniqueTerms = new Set(tokens);
      for (const term of uniqueTerms) {
        this.docFrequencies.set(term, (this.docFrequencies.get(term) || 0) + 1);
      }
    }

    this.avgDocLength = this.numDocs > 0 ? totalLength / this.numDocs : 0;
  }

  public search(query: string, domainFilter?: string): Array<{ record: CorpusRecord; score: number }> {
    if (this.numDocs === 0) return [];

    const queryTokens = tokenizeCodeAndText(query);
    if (queryTokens.length === 0) return [];

    const scores: Array<{ record: CorpusRecord; score: number }> = [];

    for (let i = 0; i < this.numDocs; i++) {
      const doc = this.corpus[i];
      if (domainFilter && domainFilter !== 'all' && doc.domain !== domainFilter) {
        continue;
      }

      const docLength = this.docLengths[i];
      const tokens = this.docTokens[i];

      // Calculate term frequency in doc
      const tfMap = new Map<string, number>();
      for (const t of tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      }

      let docScore = 0;

      for (const qToken of queryTokens) {
        const tf = tfMap.get(qToken) || 0;
        if (tf === 0) continue;

        const df = this.docFrequencies.get(qToken) || 0;
        // Robertson-Spärck Jones IDF
        const idf = Math.log(1 + (this.numDocs - df + 0.5) / (df + 0.5));

        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + (this.b * docLength) / (this.avgDocLength || 1));

        docScore += idf * (numerator / denominator);
      }

      if (docScore > 0) {
        scores.push({ record: doc, score: docScore });
      }
    }

    return scores.sort((a, b) => b.score - a.score);
  }
}
