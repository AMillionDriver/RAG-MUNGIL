import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { injectMcpServerConfig } from '../src/installer.js';

describe('Auto-Installer Module', () => {
  let tempDir: string;
  let testConfigFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-mungil-test-'));
    testConfigFile = path.join(tempDir, 'test_mcp_config.json');
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('creates new config file with rag-mungil server when file does not exist', () => {
    const res = injectMcpServerConfig(testConfigFile);
    expect(res.success).toBe(true);

    const content = JSON.parse(fs.readFileSync(testConfigFile, 'utf-8'));
    expect(content.mcpServers).toBeDefined();
    expect(content.mcpServers['rag-mungil']).toBeDefined();
    expect(content.mcpServers['rag-mungil'].command).toBe('npx');
    expect(content.mcpServers['rag-mungil'].args).toEqual(['-y', 'rag-mungil-mcp']);
  });

  it('safely merges rag-mungil into existing config without overwriting other servers', () => {
    const existing = {
      mcpServers: {
        github: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
      },
    };
    fs.writeFileSync(testConfigFile, JSON.stringify(existing, null, 2), 'utf-8');

    const res = injectMcpServerConfig(testConfigFile);
    expect(res.success).toBe(true);

    const updated = JSON.parse(fs.readFileSync(testConfigFile, 'utf-8'));
    expect(updated.mcpServers.github).toBeDefined();
    expect(updated.mcpServers['rag-mungil']).toBeDefined();
  });
});
