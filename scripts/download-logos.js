import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = 'pk_RlxzoJ1YTPivN8xYILyQTw';
const LOGOS_DIR = path.join(__dirname, '../public/logos');

// AI Tools mit ihren Domains für Logo-Suche
const AI_TOOLS = [
  { name: 'chatgpt', domain: 'openai.com' },
  { name: 'claude', domain: 'anthropic.com' },
  { name: 'github-copilot', domain: 'github.com' },
  { name: 'code-whisperer', domain: 'aws.amazon.com' },
  { name: 'tabnine', domain: 'tabnine.com' },
  { name: 'notion-ai', domain: 'notion.so' },
  { name: 'obsidian-ai', domain: 'obsidian.md' },
  { name: 'microsoft-copilot', domain: 'microsoft.com' },
  { name: 'excel-ai', domain: 'microsoft.com' },
  { name: 'power-bi-ai', domain: 'powerbi.microsoft.com' },
  { name: 'google-sheets-ai', domain: 'sheets.google.com' },
  { name: 'airtable-ai', domain: 'airtable.com' },
  { name: 'jasper', domain: 'jasper.ai' },
  { name: 'copy-ai', domain: 'copy.ai' },
  { name: 'writesonic', domain: 'writesonic.com' },
  { name: 'canva-ai', domain: 'canva.com' },
  { name: 'perplexity', domain: 'perplexity.ai' },
  { name: 'grammarly', domain: 'grammarly.com' },
  { name: 'grok', domain: 'grok.x.ai' },
  { name: 'gemini', domain: 'gemini.google.com' }
];

// Stelle sicher, dass das Logos-Verzeichnis existiert
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

function downloadLogo(domain, filename) {
  return new Promise((resolve, reject) => {
    const url = `https://logo.clearbit.com/${domain}`;
    const filepath = path.join(LOGOS_DIR, `${filename}.png`);
    
    console.log(`Downloading logo for ${domain}...`);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Downloaded: ${filename}.png`);
          resolve(filepath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Lösche die Datei bei Fehler
          reject(err);
        });
      } else {
        reject(new Error(`Failed to download logo for ${domain}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllLogos() {
  console.log('🚀 Starting logo download...\n');
  
  const results = [];
  
  for (const tool of AI_TOOLS) {
    try {
      await downloadLogo(tool.domain, tool.name);
      results.push({ tool: tool.name, status: 'success' });
    } catch (error) {
      console.error(`❌ Failed to download logo for ${tool.name}:`, error.message);
      results.push({ tool: tool.name, status: 'failed', error: error.message });
    }
    
    // Kleine Pause zwischen Downloads
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Download Summary:');
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed downloads:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.tool}: ${r.error}`);
    });
  }
  
  console.log(`\n📁 Logos saved to: ${LOGOS_DIR}`);
}

// Führe das Script aus
downloadAllLogos().catch(console.error);
