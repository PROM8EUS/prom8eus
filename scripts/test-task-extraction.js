// Test script for task extraction
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

// Test BULLET pattern
const BULLET = /^\s*(?:[-–—*•●▪▫◦‣⁃]|[0-9]+\.|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+(.+)$/i;

// Test qualification detection
function isQualification(text) {
  const taskVerbs = [
    'entwicklung', 'koordination', 'analyse', 'betreuung', 'organisation', 'zusammenarbeit', 'erstellung',
    'planung', 'kontrolle', 'verwaltung', 'führung', 'leitung', 'optimierung', 'implementierung',
    'development', 'coordination', 'analysis', 'support', 'organization', 'collaboration', 'creation',
    'planning', 'control', 'management', 'leadership', 'optimization', 'implementation'
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

console.log('Testing BULLET pattern and qualification detection:');
const lines = testText.split('\n');
lines.forEach((line, index) => {
  const match = line.match(BULLET);
  if (match) {
    const taskText = match[1];
    const isQual = isQualification(taskText);
    console.log(`Line ${index + 1}: "${line}" -> MATCH: "${taskText}" -> ${isQual ? 'QUALIFICATION' : 'TASK'}`);
  } else {
    console.log(`Line ${index + 1}: "${line}" -> NO MATCH`);
  }
});

// Test section detection
const SECTION_START = /aufgaben|responsibilities|duties|role/i;
const SECTION_END = /anforderungen|requirements|qualifikationen|qualifications/i;

console.log('\nTesting section detection:');
let inTaskSection = false;
lines.forEach((line, index) => {
  if (SECTION_START.test(line)) {
    console.log(`Line ${index + 1}: "${line}" -> TASK SECTION START`);
    inTaskSection = true;
  } else if (SECTION_END.test(line)) {
    console.log(`Line ${index + 1}: "${line}" -> TASK SECTION END`);
    inTaskSection = false;
  } else if (inTaskSection) {
    console.log(`Line ${index + 1}: "${line}" -> IN TASK SECTION`);
  }
});
