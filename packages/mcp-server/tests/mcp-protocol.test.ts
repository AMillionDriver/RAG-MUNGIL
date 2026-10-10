import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

describe('MCP Server Protocol Compliance', () => {
  const server = createMcpServer();

  it('declares all 4 required tools in ListTools handler', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listHandler = (server as any)._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
    expect(listHandler).toBeDefined();

    const response = await listHandler({ method: 'tools/list' });
    expect(response.tools).toBeDefined();
    expect(response.tools.length).toBe(4);

    const toolNames = response.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain('search_knowledge_base');
    expect(toolNames).toContain('get_domain_topics');
    expect(toolNames).toContain('fetch_record_details');
    expect(toolNames).toContain('get_code_pocs');
  });

  it('declares list of available resources', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resHandler = (server as any)._requestHandlers.get(ListResourcesRequestSchema.shape.method.value);
    expect(resHandler).toBeDefined();

    const response = await resHandler({ method: 'resources/list' });
    expect(response.resources).toBeDefined();
    expect(response.resources.length).toBeGreaterThan(0);
    expect(response.resources[0].uri).toMatch(/^rag-mungil:\/\/domains\//);
  });

  it('declares prompt templates for auditing and scraping', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promptHandler = (server as any)._requestHandlers.get(ListPromptsRequestSchema.shape.method.value);
    expect(promptHandler).toBeDefined();

    const response = await promptHandler({ method: 'prompts/list' });
    expect(response.prompts).toBeDefined();
    const promptNames = response.prompts.map((p: { name: string }) => p.name);
    expect(promptNames).toContain('audit-smart-contract');
    expect(promptNames).toContain('scrape-protected-target');
  });

  it('handles get_domain_topics tool execution successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callHandler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    expect(callHandler).toBeDefined();

    const response = await callHandler({
      method: 'tools/call',
      params: {
        name: 'get_domain_topics',
        arguments: {},
      },
    });

    expect(response.content).toBeDefined();
    expect(response.content[0].type).toBe('text');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.repository).toBe('AMillionDriver/RAG-MUNGIL');
    expect(parsed.domains.length).toBeGreaterThanOrEqual(2);
  });
});
