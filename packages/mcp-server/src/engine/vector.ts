import type { CorpusRecord } from '../types.js';
import { tokenizeCodeAndText } from './bm25.js';

export class SemanticVectorEngine {
  private corpus: CorpusRecord[] = [];
  private vocabulary: Map<string, number> = new Map();
  private docVectors: Map<string, number[]> = new Map();
  private idf: Map<string, number> = new Map();

  public index(corpus: CorpusRecord[]): void {
    this.corpus = corpus;
    this.vocabulary.clear();
    this.docVectors.clear();
    this.idf.clear();

    const docFreq = new Map<string, number>();
    const docTokensList: Array<{ id: string; tokens: string[] }> = [];

    // Step 1: Build vocabulary and document frequency
    for (const doc of corpus) {
      const text = `${doc.title} ${doc.summary} ${doc.content}`;
      const tokens = tokenizeCodeAndText(text);
      docTokensList.push({ id: doc.id, tokens });

      const unique = new Set(tokens);
      for (const t of unique) {
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      }
    }

    // Top informative vocabulary terms (frequency between 1 and numDocs)
    let vocabIndex = 0;
    const N = corpus.length || 1;
    for (const [term, df] of docFreq.entries()) {
      // Keep terms with reasonable signal
      this.vocabulary.set(term, vocabIndex++);
      const idfValue = Math.log((N + 1) / (df + 1)) + 1;
      this.idf.set(term, idfValue);
    }

    // Step 2: Build TF-IDF dense/sparse vector for each document
    const vocabSize = this.vocabulary.size;
    for (const { id, tokens } of docTokensList) {
      const vector = new Array<number>(vocabSize).fill(0);
      const tf = new Map<string, number>();

      for (const t of tokens) {
        tf.set(t, (tf.get(t) || 0) + 1);
      }

      let normSq = 0;
      for (const [t, count] of tf.entries()) {
        const vIdx = this.vocabulary.get(t);
        if (vIdx !== undefined) {
          const tfVal = Math.log(count + 1);
          const idfVal = this.idf.get(t) || 1;
          const weight = tfVal * idfVal;
          vector[vIdx] = weight;
          normSq += weight * weight;
        }
      }

      // Normalize vector
      const norm = Math.sqrt(normSq);
      if (norm > 0) {
        for (let i = 0; i < vocabSize; i++) {
          vector[i] /= norm;
        }
      }

      this.docVectors.set(id, vector);
    }
  }

  public search(query: string, domainFilter?: string): Array<{ record: CorpusRecord; score: number }> {
    const queryTokens = tokenizeCodeAndText(query);
    if (queryTokens.length === 0 || this.vocabulary.size === 0) return [];

    const vocabSize = this.vocabulary.size;
    const queryVec = new Array<number>(vocabSize).fill(0);
    const tf = new Map<string, number>();

    for (const t of queryTokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }

    let qNormSq = 0;
    for (const [t, count] of tf.entries()) {
      const vIdx = this.vocabulary.get(t);
      if (vIdx !== undefined) {
        const tfVal = Math.log(count + 1);
        const idfVal = this.idf.get(t) || 1;
        const weight = tfVal * idfVal;
        queryVec[vIdx] = weight;
        qNormSq += weight * weight;
      }
    }

    const qNorm = Math.sqrt(qNormSq);
    if (qNorm === 0) return [];

    for (let i = 0; i < vocabSize; i++) {
      queryVec[i] /= qNorm;
    }

    const results: Array<{ record: CorpusRecord; score: number }> = [];

    for (const doc of this.corpus) {
      if (domainFilter && domainFilter !== 'all' && doc.domain !== domainFilter) {
        continue;
      }

      const docVec = this.docVectors.get(doc.id);
      if (!docVec) continue;

      // Cosine similarity between normalized vectors
      let dotProduct = 0;
      for (let i = 0; i < vocabSize; i++) {
        if (queryVec[i] !== 0 && docVec[i] !== 0) {
          dotProduct += queryVec[i] * docVec[i];
        }
      }

      if (dotProduct > 0.05) {
        results.push({ record: doc, score: dotProduct });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}
