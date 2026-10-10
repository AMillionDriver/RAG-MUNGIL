import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { searchToolSchema, handleSearchTool } from './tools/search.js';
import { topicsToolSchema, handleTopicsTool } from './tools/topics.js';
import { detailsToolSchema, handleDetailsTool } from './tools/details.js';
import { pocsToolSchema, handlePocsTool } from './tools/pocs.js';
import { listDomainResources, readDomainResource } from './resources/domains.js';
import { PROMPTS_LIST, getPromptMessages } from './prompts/templates.js';

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'rag-mungil',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // 1. Tools List
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: searchToolSchema.name,
          description: searchToolSchema.description,
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (e.g. "curl-cffi JA4 bypass Cloudflare", "Foundry reentrancy PoC")',
              },
              domain: {
                type: 'string',
                enum: ['all', '01_rag_scraping', '02_web3_smart_contract'],
                default: 'all',
                description: 'Target domain ID, or "all" to search across everything',
              },
              limit: {
                type: 'integer',
                minimum: 1,
                maximum: 20,
                default: 5,
                description: 'Maximum number of records to return',
              },
              mode: {
                type: 'string',
                enum: ['hybrid', 'keyword', 'semantic'],
                default: 'hybrid',
                description: 'Retrieval algorithm mode',
              },
            },
            required: ['query'],
          },
        },
        {
          name: topicsToolSchema.name,
          description: topicsToolSchema.description,
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: detailsToolSchema.name,
          description: detailsToolSchema.description,
          inputSchema: {
            type: 'object',
            properties: {
              record_id: {
                type: 'string',
                description: 'The unique record identifier (e.g., "scraping_curl_cffi_curl_cffi")',
              },
            },
            required: ['record_id'],
          },
        },
        {
          name: pocsToolSchema.name,
          description: pocsToolSchema.description,
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'Target keyword or vulnerability pattern (e.g. "reentrancy", "turnstile")',
              },
              domain: {
                type: 'string',
                enum: ['all', '01_rag_scraping', '02_web3_smart_contract'],
                default: 'all',
              },
            },
            required: ['topic'],
          },
        },
      ],
    };
  });

  // 2. Call Tool Execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === searchToolSchema.name) {
        const parsed = searchToolSchema.parameters.parse(args || {});
        return await handleSearchTool(parsed);
      }

      if (name === topicsToolSchema.name) {
        return await handleTopicsTool();
      }

      if (name === detailsToolSchema.name) {
        const parsed = detailsToolSchema.parameters.parse(args || {});
        return await handleDetailsTool(parsed);
      }

      if (name === pocsToolSchema.name) {
        const parsed = pocsToolSchema.parameters.parse(args || {});
        return await handlePocsTool(parsed);
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    } catch (err) {
      if (err instanceof McpError) throw err;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  });

  // 3. Resources List & Read
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await listDomainResources();
    return { resources };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return await readDomainResource(request.params.uri);
  });

  // 4. Prompts List & Get
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPTS_LIST };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const messages = getPromptMessages(name, (args as Record<string, string>) || {});
    return { messages };
  });

  return server;
}

export async function runServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RAG-MUNGIL MCP Server running on stdio');
}
