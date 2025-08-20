import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API key from logo.dev
const API_KEY = 'pk_RlxzoJ1YTPivN8xYILyQTw';

async function downloadClaudeLogo() {
  return new Promise((resolve, reject) => {
    const logoUrl = `https://img.logo.dev/claude.ai?token=${API_KEY}&format=png&size=200`;
    const filePath = join(__dirname, '..', 'public', 'logos', 'claude.png');
    
    console.log(`Downloading Claude logo from claude.ai domain: ${logoUrl}`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(logoUrl, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Successfully downloaded Claude logo from claude.ai`);
          resolve();
        });
      } else {
        console.log(`❌ Failed to download logo from claude.ai: ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      console.log(`❌ Error downloading from claude.ai:`, err.message);
      reject(err);
    });
  });
}

async function fixClaudeLogo() {
  console.log('🔄 Downloading Claude logo from claude.ai domain...\n');
  
  try {
    await downloadClaudeLogo();
    console.log('\n✅ Claude logo update completed!');
  } catch (error) {
    console.log(`❌ Failed to download Claude logo: ${error.message}`);
  }
}

fixClaudeLogo();
