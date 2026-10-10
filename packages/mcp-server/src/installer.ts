import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

interface McpConfigFile {
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
  [key: string]: unknown;
}

export function getClaudeDesktopConfigPath(): string {
  const platform = process.platform;
  const home = os.homedir();

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (platform === 'win32') {
    const appdata = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appdata, 'Claude', 'claude_desktop_config.json');
  }
  return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
}

export function getCursorMcpConfigPath(): string {
  const home = os.homedir();
  return path.join(home, '.cursor', 'mcp.json');
}

export function injectMcpServerConfig(configFilePath: string): { success: boolean; message: string } {
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let config: McpConfigFile = {};
    if (fs.existsSync(configFilePath)) {
      try {
        const raw = fs.readFileSync(configFilePath, 'utf-8');
        config = JSON.parse(raw);
      } catch {
        config = {};
      }
    }

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers['rag-mungil'] = {
      command: 'npx',
      args: ['-y', 'rag-mungil-mcp'],
    };

    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
    return {
      success: true,
      message: `Configured in ${configFilePath}`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Failed to write to ${configFilePath}: ${errMsg}`,
    };
  }
}

export function runAutoInstall(): void {
  console.log('🏺 RAG-MUNGIL MCP Auto-Installer\n');

  const targets = [
    { name: 'Claude Desktop', path: getClaudeDesktopConfigPath() },
    { name: 'Cursor IDE', path: getCursorMcpConfigPath() },
  ];

  let successCount = 0;

  for (const t of targets) {
    console.log(`Setting up ${t.name}...`);
    const res = injectMcpServerConfig(t.path);
    if (res.success) {
      console.log(`✅ ${res.message}`);
      successCount++;
    } else {
      console.log(`⚠️ ${res.message}`);
    }
  }

  console.log('\n🎉 Installation complete!');
  console.log('Restart Claude Desktop or Cursor to start using RAG-MUNGIL tools.');
  console.log('\nExample prompts to ask your agent:');
  console.log('- "Cari teknik bypass TLS JA4 di curl-cffi"');
  console.log('- "Tampilkan Foundry test PoC untuk Reentrancy exploit"\n');
}
