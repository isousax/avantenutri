// Simple script to scan for unused API keys (best-effort, dev aid only)
// Run with: node scripts/checkApiUsage.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'src');
const apiFile = path.resolve(root, 'config', 'api.ts');

const code = fs.readFileSync(apiFile, 'utf8');
const keyRegex = /export const API = {([\s\S]*?)} as const;/m;
const match = keyRegex.exec(code);
if (!match) {
  console.error('API object not found');
  process.exit(1);
}

const body = match[1];
const entryRegex = /(\w+):/g;
const keys = [];
let em;
while ((em = entryRegex.exec(body))) {
  const k = em[1];
  // crude heuristic: constants are ALL_CAPS; skip lowerCamel (likely functions)
  if (k[0] === k[0].toUpperCase()) keys.push(k);
}

// gather all TS/TSX source files
const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full); else if (/\.(tsx?|jsx?)$/.test(f)) files.push(full);
  }
}
walk(root);

// Allowlist for keys intentionally kept even if currently unused
const ALLOW_UNUSED = new Set([
  'API_AUTH_BASE',
  'ADMIN_CONSULTATION_BLOCK',
  'QUESTIONNAIRE'
]);

const usage = Object.fromEntries(keys.map(k => [k, 0]));
for (const file of files) {
  const c = fs.readFileSync(file, 'utf8');
  for (const k of keys) {
    const re = new RegExp(`API\\.${k}([^A-Za-z0-9_]|$)`, 'g');
    if (re.test(c)) usage[k]++;
  }
}

const rawUnused = Object.entries(usage).filter(([, count]) => count === 0).map(([k]) => k);
const ignored = rawUnused.filter(k => ALLOW_UNUSED.has(k));
const unused = rawUnused.filter(k => !ALLOW_UNUSED.has(k));

if (unused.length || ignored.length) {
  if (unused.length) {
    console.log('UNUSED API KEYS (investigate):');
    unused.forEach(k => console.log(' -', k));
  }
  if (ignored.length) {
    console.log('\n(Intentionally allowed unused keys):');
    ignored.forEach(k => console.log(' -', k));
  }
  if (unused.length) process.exitCode = 2; // only fail build for real (non-allowlisted) unused keys
  else process.exitCode = 0;
} else {
  console.log('All API constants are referenced somewhere.');
}
