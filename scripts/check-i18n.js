#!/usr/bin/env node
/* Simple heuristic scanner for hardcoded Portuguese strings (accented words / common stopwords)
   Exits with code 1 if suspicious literals are found outside allowlist. */
import { readFileSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';

const ROOT = resolve(process.cwd(), 'src');
const ALLOWED_DIRS = new Set(['i18n', 'types', 'data']); // directories where literals are allowed
const TARGET_EXT = new Set(['.tsx', '.ts', '.js']);

const suspicious = [];
const ptPattern = /'([^']*[áéíóúãõçÁÉÍÓÚÃÕÇ]{1}[^']*)'|"([^"]*[áéíóúãõçÁÉÍÓÚÃÕÇ]{1}[^"]*)"/g;
const ignorePatterns = [
  /className=/, /aria-label=/, /data-testid=/
];

function walk(dir){
  for (const entry of readdirSync(dir, { withFileTypes: true })){
    if (entry.isDirectory()) {
      if (ALLOWED_DIRS.has(entry.name)) continue;
      walk(resolve(dir, entry.name));
    } else {
      const ext = extname(entry.name);
      if (!TARGET_EXT.has(ext)) continue;
      const fp = resolve(dir, entry.name);
      const content = readFileSync(fp,'utf8');
      if (content.includes('t(')) {
        // ok, still we scan
      }
      let m;
      while((m = ptPattern.exec(content))){
        const full = m[0];
        const val = m[1] || m[2] || '';
        if (val.length < 4) continue; // short tokens
        if (ignorePatterns.some(r=> r.test(full))) continue;
        // skip if looks like translation key (contains . or {)
        if (/^[a-z0-9_.{}-]+$/.test(val)) continue;
        // skip URLs
        if (/https?:\/\//.test(val)) continue;
        // if already wrapped in t('...') we allow
        const before = content.slice(Math.max(0, ptPattern.lastIndex - full.length - 5), ptPattern.lastIndex);
        if (/t\(\s*['"]/.test(before)) continue;
        suspicious.push({ file: fp, match: val });
      }
    }
  }
}

walk(ROOT);

if (suspicious.length){
  console.error('\n[check-i18n] Found potential untranslated strings:');
  for (const s of suspicious){
    console.error(` - ${s.file}: "${s.match}"`);
  }
  console.error('\nIf intentional, add file or directory to ALLOWED_DIRS or convert to translation key.');
  process.exit(1);
} else {
  console.log('[check-i18n] No hardcoded Portuguese strings detected.');
}