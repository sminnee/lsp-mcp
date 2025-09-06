import { spawn } from 'child_process';
import { LSPClient, LSPRequest, LSPNotification } from '../types.js';

export class LSPClientManager {
  private lspClients: Map<string, LSPClient> = new Map();

  async getOrCreateLSPClient(language: string, workspaceRoot: string, serverType?: string): Promise<LSPClient> {
    const clientKey = `${language}-${serverType || 'default'}-${workspaceRoot}`;

    if (this.lspClients.has(clientKey)) {
      return this.lspClients.get(clientKey)!;
    }

    const client = await this.createLSPClient(language, workspaceRoot, serverType);
    this.lspClients.set(clientKey, client);
    return client;
  }

  private async createLSPClient(language: string, workspaceRoot: string, serverType?: string): Promise<LSPClient> {
    let command: string;
    let args: string[] = [];
    let installCmd: string;
    let serverName: string;

    // Configure LSP server based on language and server type
    switch (language) {
      case 'typescript':
      case 'javascript':
        command = 'typescript-language-server';
        args = ['--stdio'];
        installCmd = 'npm install -g typescript-language-server typescript';
        serverName = 'TypeScript Language Server';
        break;
      case 'python':
        if (serverType === 'lint') {
          command = 'ruff';
          args = ['server', '--stdio'];
          installCmd = 'pip install ruff';
          serverName = 'Ruff Server';
        } else {
          // Default to pyright for type checking
          command = 'pyright-langserver';
          args = ['--stdio'];
          installCmd = 'npm install -g pyright';
          serverName = 'Pyright Language Server';
        }
        break;
      case 'rust':
        command = 'rust-analyzer';
        args = [];
        installCmd = 'rustup component add rust-analyzer';
        serverName = 'Rust Analyzer';
        break;
      case 'go':
        command = 'gopls';
        args = [];
        installCmd = 'go install golang.org/x/tools/gopls@latest';
        serverName = 'Go Language Server (gopls)';
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: workspaceRoot,
    });

    // Handle process spawn errors with Promise wrapper
    await new Promise<void>((resolve, reject) => {
      process.on('error', (error: unknown) => {
        if ((error as { code?: string }).code === 'ENOENT') {
          reject(
            new Error(
              `${serverName} not found.\n\nTo install: ${installCmd}\n\nPlease install the required language server and try again.`
            )
          );
        } else {
          reject(error);
        }
      });

      // Give the process a moment to potentially emit an error
      setTimeout(() => resolve(), 100);
    });

    const client: LSPClient = {
      process,
      requestId: 1,
      pendingRequests: new Map(),
    };

    // Initialize LSP client
    await this.sendLSPRequest(client, 'initialize', {
      processId: process.pid,
      rootUri: `file://${workspaceRoot}`,
      capabilities: {
        textDocument: {
          rename: { dynamicRegistration: false },
          references: { dynamicRegistration: false },
          codeAction: { dynamicRegistration: false },
        },
        workspace: {
          workspaceEdit: { documentChanges: true },
        },
      },
    });

    await this.sendLSPNotification(client, 'initialized', {});

    return client;
  }

  async sendLSPRequest(client: LSPClient, method: string, params: unknown): Promise<unknown> {
    const id = client.requestId++;
    const message: LSPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const messageStr = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(messageStr)}\r\n\r\n`;

    return new Promise((resolve, reject) => {
      client.pendingRequests.set(id, { resolve, reject });

      if (client.process.stdin) {
        client.process.stdin.write(header + messageStr);
      }

      // Set up response handler if not already done
      if (client.process.stdout && !client.process.stdout.listeners('data').length) {
        let buffer = '';
        client.process.stdout.on('data', (data: Buffer) => {
          buffer += data.toString();

          while (true) {
            const headerEnd = buffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) break;

            const headerStr = buffer.substring(0, headerEnd);
            const contentLengthMatch = headerStr.match(/Content-Length: (\d+)/);

            if (!contentLengthMatch) break;

            const contentLength = parseInt(contentLengthMatch[1]);
            const messageStart = headerEnd + 4;

            if (buffer.length < messageStart + contentLength) break;

            const messageStr = buffer.substring(messageStart, messageStart + contentLength);
            buffer = buffer.substring(messageStart + contentLength);

            try {
              const response = JSON.parse(messageStr);
              if (response.id && client.pendingRequests.has(response.id)) {
                const { resolve, reject } = client.pendingRequests.get(response.id)!;
                client.pendingRequests.delete(response.id);

                if (response.error) {
                  reject(new Error(response.error.message));
                } else {
                  resolve(response.result);
                }
              }
            } catch (e) {
              console.error('Failed to parse LSP response:', e);
            }
          }
        });
      }
    });
  }

  async sendLSPNotification(client: LSPClient, method: string, params: unknown): Promise<void> {
    const message: LSPNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    const messageStr = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(messageStr)}\r\n\r\n`;

    if (client.process.stdin) {
      client.process.stdin.write(header + messageStr);
    }
  }

  async cleanup(): Promise<void> {
    // Terminate all LSP client processes
    const clients = Array.from(this.lspClients.values());
    for (const client of clients) {
      try {
        // Send shutdown request first
        await this.sendLSPRequest(client, 'shutdown', {});
        await this.sendLSPNotification(client, 'exit', {});

        // Give the process a moment to exit gracefully
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force kill if still running
        if (!client.process.killed) {
          client.process.kill('SIGTERM');
        }
      } catch (_error) {
        // Force kill on any error
        try {
          client.process.kill('SIGKILL');
        } catch (_killError) {
          // Process might already be dead, ignore
        }
      }
    }

    this.lspClients.clear();
  }
}
