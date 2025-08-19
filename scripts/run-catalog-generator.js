#!/usr/bin/env node

/**
 * Wrapper-Skript für die Ausführung des TypeScript Catalog Generators
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starte Job Task Catalog Generator...\n');

// Prüfe ob OPENAI_API_KEY gesetzt ist
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Fehler: OPENAI_API_KEY environment variable ist nicht gesetzt');
  console.log('💡 Setze die Variable mit:');
  console.log('   export OPENAI_API_KEY="your-api-key-here"');
  process.exit(1);
}

// TypeScript Skript ausführen
const scriptPath = path.join(__dirname, 'generate-job-task-catalog.ts');
const tsNode = spawn('npx', ['ts-node', scriptPath], {
  stdio: 'inherit',
  env: process.env
});

tsNode.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Catalog Generator erfolgreich abgeschlossen!');
  } else {
    console.error(`\n❌ Catalog Generator beendet mit Code: ${code}`);
    process.exit(code);
  }
});

tsNode.on('error', (error) => {
  console.error('❌ Fehler beim Starten:', error.message);
  console.log('💡 Installiere ts-node mit: npm install -g ts-node');
  process.exit(1);
});