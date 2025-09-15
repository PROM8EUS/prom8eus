/*
 Prefetch logos from logo.dev and save to public/logos.
 Usage: npx tsx scripts/fetch-logos.ts
*/

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const LOGO_DEV_API_KEY = process.env.VITE_LOGO_DEV_API_KEY || process.env.LOGO_DEV_API_KEY;
if (!LOGO_DEV_API_KEY) {
  console.error('Missing VITE_LOGO_DEV_API_KEY. Set it in environment before running.');
  process.exit(1);
}

const logoDir = path.resolve('public/logos');
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

const mapping: Record<string, string> = {
  'excel-ai': 'microsoft.com',
  'power-bi-ai': 'powerbi.com',
  'microsoft-copilot': 'microsoft.com',
  'google-sheets-ai': 'sheets.google.com',
  'chatgpt': 'chat.openai.com',
  'claude': 'claude.ai',
  'grok': 'x.com',
  'github-copilot': 'github.com',
  'code-whisperer': 'aws.amazon.com',
  'tabnine': 'tabnine.com',
  'canva-ai': 'canva.com',
  'copy-ai': 'copy.ai',
  'writesonic': 'writesonic.com',
  'jasper': 'jasper.ai',
  'grammarly': 'grammarly.com',
  'notion-ai': 'notion.so',
  'obsidian-ai': 'obsidian.md',
  'airtable-ai': 'airtable.com',
  'perplexity': 'perplexity.ai',
  'gemini': 'gemini.google.com',
  'n8n': 'n8n.io'
};

async function download(id: string, domain: string) {
  const dest = path.join(logoDir, `${id}.png`);
  if (fs.existsSync(dest)) {
    console.log(`skip ${id} (exists)`);
    return;
  }
  const url = `https://img.logo.dev/${domain}?token=${LOGO_DEV_API_KEY}&size=128&format=png`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`failed ${id}: ${res.status}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`saved ${id}`);
}

async function main() {
  for (const [id, domain] of Object.entries(mapping)) {
    await download(id, domain);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


