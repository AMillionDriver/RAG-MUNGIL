import type { CorpusRecord, SearchResult } from '../types.js';
import { BM25Engine } from './bm25.js';
import { SemanticVectorEngine } from './vector.js';

export class HybridRetrievalEngine {
  private bm25 = new BM25Engine();
  private vector = new SemanticVectorEngine();
  private isIndexed = false;

  public index(corpus: CorpusRecord[]): void {
    this.bm25.index(corpus);
    this.vector.index(corpus);
    this.isIndexed = true;
  }

  public search(
    query: string,
    options: {
      domain?: string;
      limit?: number;
      mode?: 'hybrid' | 'keyword' | 'semantic';
    } = {}
  ): SearchResult[] {
    if (!this.isIndexed) return [];

    const mode = options.mode || 'hybrid';
    const limit = Math.min(Math.max(options.limit || 5, 1), 20);
    const domain = options.domain;

    if (mode === 'keyword') {
      const bm25Results = this.bm25.search(query, domain);
      return bm25Results.slice(0, limit).map((r) => ({
        record: r.record,
        score: Number(r.score.toFixed(4)),
        matchType: 'keyword',
        bm25Score: Number(r.score.toFixed(4)),
      }));
    }

    if (mode === 'semantic') {
      const vecResults = this.vector.search(query, domain);
      return vecResults.slice(0, limit).map((r) => ({
        record: r.record,
        score: Number(r.score.toFixed(4)),
        matchType: 'semantic',
        vectorScore: Number(r.score.toFixed(4)),
      }));
    }

    // Hybrid Mode: Reciprocal Rank Fusion (RRF)
    const bm25Results = this.bm25.search(query, domain);
    const vecResults = this.vector.search(query, domain);

    const rrfK = 60; // Standard RRF constant
    const scoreMap = new Map<
      string,
      {
        record: CorpusRecord;
        rrfScore: number;
        bm25Score?: number;
        vectorScore?: number;
      }
    >();

    // Rank BM25
    bm25Results.forEach((res, rank) => {
      const existing = scoreMap.get(res.record.id) || {
        record: res.record,
        rrfScore: 0,
        bm25Score: res.score,
      };
      existing.rrfScore += 1 / (rrfK + rank + 1);
      existing.bm25Score = res.score;
      scoreMap.set(res.record.id, existing);
    });

    // Rank Vector
    vecResults.forEach((res, rank) => {
      const existing = scoreMap.get(res.record.id) || {
        record: res.record,
        rrfScore: 0,
        vectorScore: res.score,
      };
      existing.rrfScore += 1 / (rrfK + rank + 1);
      existing.vectorScore = res.score;
      scoreMap.set(res.record.id, existing);
    });

    const combined = Array.from(scoreMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, limit);

    return combined.map((item) => ({
      record: item.record,
      score: Number(item.rrfScore.toFixed(5)),
      matchType: 'hybrid',
      bm25Score: item.bm25Score ? Number(item.bm25Score.toFixed(3)) : undefined,
      vectorScore: item.vectorScore ? Number(item.vectorScore.toFixed(3)) : undefined,
    }));
  }
}
