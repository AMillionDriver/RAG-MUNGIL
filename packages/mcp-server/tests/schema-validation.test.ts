import { describe, it, expect } from 'vitest';
import { searchToolSchema } from '../src/tools/search.js';
import { detailsToolSchema } from '../src/tools/details.js';
import { pocsToolSchema } from '../src/tools/pocs.js';

describe('Zod Schema Validation for Tools', () => {
  it('searchToolSchema validates correct arguments and applies defaults', () => {
    const valid = searchToolSchema.parameters.parse({ query: 'reentrancy' });
    expect(valid.query).toBe('reentrancy');
    expect(valid.domain).toBe('all');
    expect(valid.limit).toBe(5);
    expect(valid.mode).toBe('hybrid');
  });

  it('searchToolSchema throws error when query is missing', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchToolSchema.parameters.parse({} as any);
    }).toThrow();
  });

  it('detailsToolSchema validates record_id requirement', () => {
    const valid = detailsToolSchema.parameters.parse({ record_id: 'rec_123' });
    expect(valid.record_id).toBe('rec_123');

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detailsToolSchema.parameters.parse({} as any);
    }).toThrow();
  });

  it('pocsToolSchema validates topic and domain correctly', () => {
    const valid = pocsToolSchema.parameters.parse({
      topic: 'turnstile',
      domain: '01_rag_scraping',
    });
    expect(valid.topic).toBe('turnstile');
    expect(valid.domain).toBe('01_rag_scraping');
  });
});
