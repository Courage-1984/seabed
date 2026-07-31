#!/usr/bin/env node
/**
 * Lightweight PostToolUse governance warning for code quality (exit 0 always — warn only).
 * Checks if the agent left console.log or debugger statements in JS code.
 */
import { readFileSync } from 'node:fs';

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function extractPathAndContent(payload) {
  const pathKeys = ['file_path', 'filePath', 'path', 'target_file', 'targetFile'];
  const contentKeys = ['content', 'new_string', 'newString', 'file_content', 'fileContent'];
  let filePath = '';
  let content = '';
  for (const k of pathKeys) {
    if (payload[k]) filePath = String(payload[k]);
  }
  for (const k of contentKeys) {
    if (payload[k]) content = String(payload[k]);
  }
  if (!content && payload.tool_input) {
    const ti = payload.tool_input;
    for (const k of pathKeys) if (ti[k]) filePath = String(ti[k]);
    for (const k of contentKeys) if (ti[k]) content = String(ti[k]);
  }
  return { filePath: filePath.replace(/\\/g, '/'), content };
}

const raw = readStdin();
let payload = {};
if (raw.trim()) {
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { content: raw };
  }
}

const { filePath, content } = extractPathAndContent(payload);
const warnings = [];

if (filePath.endsWith('.js') && content) {
  if (/console\.log\s*\(/.test(content)) {
    warnings.push(`[code-quality-hook] WARN: Found console.log() in JS file edit. Remove debug logs before shipping.`);
  }
  if (/debugger\s*;/.test(content) || /\bdebugger\b/.test(content)) {
    warnings.push(`[code-quality-hook] WARN: Found 'debugger' statement in JS file edit. Remove before shipping.`);
  }
}

for (const w of warnings) {
  console.error(w);
}

process.exit(0);
