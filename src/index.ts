#!/usr/bin/env node
import { LSPRefactorServer } from './server.js';

console.log('Starting LSP MCP server');

const server = new LSPRefactorServer();
server.run().catch(console.error);
