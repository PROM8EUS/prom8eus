// Debug script to simulate the exact extraction logic from the app
const testText = `Marketing Manager

AUFGABEN:
• Entwicklung und Umsetzung von Marketingstrategien
• Koordination von Werbekampagnen
• Analyse von Markttrends und Kundenverhalten
• Budgetplanung und -kontrolle
• Betreuung von Social Media Kanälen
• Organisation von Events und Messen
• Zusammenarbeit mit externen Agenturen
• Erstellung von Präsentationen und Reports

ANFORDERUNGEN:
• Abgeschlossenes Studium im Bereich Marketing oder BWL
• 3-5 Jahre Berufserfahrung im Marketing
• Kreativität und analytisches Denken
• Sehr gute Kommunikationsfähigkeiten
• Sicherer Umgang mit MS Office und Marketing-Tools`;

console.log('=== DEBUGGING TASK EXTRACTION ===');
console.log('Input text length:', testText.length);

// Simulate the exact logic from extractTasksAdvanced
function debugExtraction(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  console.log('Lines after split:', lines.length);
  
  // 1. Find relevant section
  let startIdx = -1;
  const SECTION_START = /aufgaben|responsibilities|duties|role/i;
  
  for (let i = 0; i < lines.length; i++) {
    if (SECTION_START.test(lines[i])) { 
      startIdx = i; 
      console.log(`Found section start at line ${i}: "${lines[i]}"`);
      break; 
    }
  }
  
  if (startIdx === -1) {
    console.log('❌ No section start found!');
    return [];
  }
  
  // 2. Scope to task section
  let scoped = lines.slice(startIdx + 1);
  console.log('Scoped lines:', scoped.length);
  
  // 3. Find section end
  const SECTION_END = /anforderungen|requirements|qualifikationen|qualifications/i;
  const stopAt = scoped.findIndex(l => SECTION_END.test(l));
  if (stopAt >= 0) {
    scoped = scoped.slice(0, stopAt);
    console.log(`Found section end at line ${stopAt}, scoped to ${scoped.length} lines`);
  }
  
  // 4. Extract bullets
  const BULLET = /^\s*(?:[-–—*•●▪▫◦‣⁃]|[0-9]+\.|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+(.+)$/i;
  const bullets = [];
  
  console.log('\n=== PROCESSING LINES ===');
  for (const l of scoped) {
    console.log(`Processing: "${l}"`);
    
    const m = l.match(BULLET);
    if (m && m[1] && m[1].length >= 10) {
      const cleanText = m[1].trim();
      console.log(`  -> Bullet match: "${cleanText}"`);
      
      // Check if it's a qualification
      const isQual = isQualification(cleanText);
      console.log(`  -> Is qualification: ${isQual}`);
      
      if (!isQual) {
        bullets.push(cleanText);
        console.log(`  -> ✅ Added as task`);
      } else {
        console.log(`  -> ❌ Filtered out as qualification`);
      }
    } else {
      console.log(`  -> No bullet match`);
    }
  }
  
  console.log(`\n=== RESULT ===`);
  console.log(`Found ${bullets.length} tasks:`, bullets);
  return bullets;
}

function isQualification(text) {
  const taskVerbs = [
    'entwicklung', 'koordination', 'analyse', 'betreuung', 'organisation', 'zusammenarbeit', 'erstellung',
    'planung', 'kontrolle', 'verwaltung', 'führung', 'leitung', 'optimierung', 'implementierung',
    'budgetplanung', 'budget', 'budgeting', 'finanzplanung'
  ];
  
  const lowerText = text.toLowerCase();
  if (taskVerbs.some(verb => lowerText.startsWith(verb))) {
    return false; // Das ist eine Aufgabe, keine Qualifikation
  }
  
  const qualificationPatterns = [
    /\b(ausbildung|studium|abschluss|degree|education|background|certified|certification)\b/i,
    /\b(erfahrung|experience|jahre|years|berufserfahrung|work experience)\b/i,
    /\b(kenntnisse|knowledge|skills|fähigkeiten|fertigkeiten|competence|proficiency|vertraut|familiar)\b/i,
    /\b(abgeschlossenes studium|berufserfahrung|kommunikationsfähigkeiten|ms office)\b/i
  ];
  
  return qualificationPatterns.some(pattern => pattern.test(text));
}

const result = debugExtraction(testText);
console.log(`\n🎯 FINAL RESULT: ${result.length} tasks extracted`);
