import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function executeMcpTool(toolName, args = {}) {
  const serverPath = path.join(__dirname, 'dist', 'cli.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverPath] });
  const client = new Client({ name: 'antigravity-caller', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  } finally {
    await client.close();
  }
}

// CLI usage if run directly: node run_query.js <toolName> '<jsonArgs>'
if (process.argv[1] && process.argv[1].endsWith('run_query.js')) {
  const tool = process.argv[2] || 'get_domain_topics';
  let params = {};
  if (process.argv[3]) {
    try {
      params = JSON.parse(process.argv[3]);
    } catch {
      params = { query: process.argv[3] };
    }
  }

  executeMcpTool(tool, params)
    .then((res) => {
      console.log(res.content[0].text);
    })
    .catch((err) => {
      console.error('Error executing tool:', err);
      process.exit(1);
    });
}
