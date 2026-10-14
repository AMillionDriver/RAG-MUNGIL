import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';

async function main() {
  const serverPath = path.resolve('./dist/cli.js');
  console.log('Connecting to MCP server at:', serverPath);

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('✅ Connected to MCP Server!');

  // 1. List tools
  const tools = await client.listTools();
  console.log('\n--- Available MCP Tools ---');
  tools.tools.forEach(t => console.log(`- ${t.name}: ${t.description.slice(0, 80)}...`));

  // 2. Query topics
  console.log('\n--- Calling get_domain_topics ---');
  const topicsRes = await client.callTool({
    name: 'get_domain_topics',
    arguments: {},
  });
  console.log(topicsRes.content[0].text);

  // 3. Search for captcha and anti-bot
  console.log('\n--- Searching for: "captcha whisper yolo" ---');
  const searchRes = await client.callTool({
    name: 'search_knowledge_base',
    arguments: { query: 'captcha whisper yolo', limit: 3 },
  });
  console.log(searchRes.content[0].text);

  // 4. Search for: "Cloudflare Turnstile bypass"
  console.log('\n--- Searching for: "Cloudflare Turnstile bypass" ---');
  const searchRes2 = await client.callTool({
    name: 'search_knowledge_base',
    arguments: { query: 'Cloudflare Turnstile bypass', limit: 3 },
  });
  console.log(searchRes2.content[0].text);

  await client.close();
  console.log('\n✅ Test Completed Successfully!');
}

main().catch(err => {
  console.error('❌ Error testing MCP:', err);
  process.exit(1);
});
