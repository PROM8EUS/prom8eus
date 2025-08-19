// scripts/quick-test.ts (node --loader ts-node/esm scripts/quick-test.ts)
import { runAnalysis } from "../src/lib/runAnalysis.js";

const de = `
AUFGABEN:
- Erstellung monatlicher KPI-Reports in Excel und Looker Studio
- Pflege des CRM und Bereinigung von CSV-Importen
- Terminabstimmung mit Partnern und Versand von Einladungen per E-Mail
- Durchführung von Kundenworkshops und Beratung zu Anforderungen

ANFORDERUNGEN:
- Erfahrung mit SQL und API-Integrationen
`;

const en = `
RESPONSIBILITIES:
* Build and maintain CI/CD pipelines for microservices
* Create dashboards and alerts for key metrics
* Coordinate stakeholder meetings and send follow-ups
* Lead discovery workshops with clients

QUALIFICATIONS:
- Experience with Terraform, Kubernetes, and REST APIs
`;

console.log("=== GERMAN TEST ===");
console.log("DE →", runAnalysis(de));

console.log("\n=== ENGLISH TEST ===");
console.log("EN →", runAnalysis(en));

console.log("\n=== DETAILED ANALYSIS ===");
const deResult = runAnalysis(de);
console.log(`German - Total Score: ${deResult.totalScore}%`);
console.log(`German - Tasks found: ${deResult.tasks.length}`);
console.log(`German - Ratio: ${deResult.ratio.automatisierbar}% automatable, ${deResult.ratio.mensch}% human`);
console.log(`German - Summary: ${deResult.summary}`);

const enResult = runAnalysis(en);
console.log(`English - Total Score: ${enResult.totalScore}%`);
console.log(`English - Tasks found: ${enResult.tasks.length}`);
console.log(`English - Ratio: ${enResult.ratio.automatisierbar}% automatable, ${enResult.ratio.mensch}% human`);
console.log(`English - Summary: ${enResult.summary}`);

console.log("\n=== TASK BREAKDOWN (German) ===");
deResult.tasks.forEach((task, i) => {
  console.log(`${i + 1}. [${task.label}] ${task.text.substring(0, 60)}... (Score: ${task.score}, Category: ${task.category})`);
});

console.log("\n=== TASK BREAKDOWN (English) ===");
enResult.tasks.forEach((task, i) => {
  console.log(`${i + 1}. [${task.label}] ${task.text.substring(0, 60)}... (Score: ${task.score}, Category: ${task.category})`);
});

console.log("\n=== RECOMMENDATIONS ===");
console.log("German recommendations:");
deResult.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
console.log("English recommendations:");
enResult.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));