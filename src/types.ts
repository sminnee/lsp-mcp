import { ChildProcess } from 'child_process';

export interface LSPClient {
  process: ChildProcess;
  requestId: number;
  pendingRequests: Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>;
}

export interface LSPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: any;
}

export interface LSPNotification {
  jsonrpc: '2.0';
  method: string;
  params: any;
}

export interface LSPPosition {
  line: number;
  character: number;
}

export interface LSPRange {
  start: LSPPosition;
  end: LSPPosition;
}

export interface LSPLocation {
  uri: string;
  range: LSPRange;
}

export interface LSPTextEdit {
  range: LSPRange;
  newText: string;
}

export interface LSPWorkspaceEdit {
  changes?: { [uri: string]: LSPTextEdit[] };
  documentChanges?: any[];
}

export interface RenameFileArgs {
  oldPath: string;
  newPath: string;
  language?: string;
}

export interface MoveFunctionArgs {
  sourceFile: string;
  targetFile: string;
  functionName: string;
  line: number;
  character?: number;
  language?: string;
}

export interface ExtractFunctionArgs {
  file: string;
  startLine: number;
  startCharacter?: number;
  endLine: number;
  endCharacter?: number;
  functionName: string;
  language?: string;
}

export interface FindReferencesArgs {
  file: string;
  line: number;
  character?: number;
  language?: string;
}

export interface RenameSymbolArgs {
  file: string;
  line: number;
  character?: number;
  newName: string;
  language?: string;
}
