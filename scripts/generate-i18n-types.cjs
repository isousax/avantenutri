/* Plain JS script to generate translation key union type from i18n/index.tsx */
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { resolve } = require('path');

const src = readFileSync(resolve(__dirname,'..','src','i18n','index.tsx'),'utf8');
const keyRegex = /'([^']+)'\s*:/g;
const keys = new Set();
let m;
while((m = keyRegex.exec(src))){
  const k = m[1];
  if(k.includes('\n')) continue;
  keys.add(k);
}
const sorted = Array.from(keys).sort();
const out = `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\nexport type TranslationKey =\n${sorted.map(k=>`  | '${k}'`).join('\n')};\n`;
const outDir = resolve(__dirname,'..','src','types');
mkdirSync(outDir,{recursive:true});
const outFile = resolve(outDir,'i18n.d.ts');
writeFileSync(outFile,out,'utf8');
console.log(`[i18n] Generated ${sorted.length} keys to ${outFile}`);
