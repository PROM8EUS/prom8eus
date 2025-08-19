#!/usr/bin/env ts-node

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

// Interfaces für die Datenstrukturen
interface JobTask {
  title: string;
  description: string;
  category: "Automatisierbar" | "Menschlich";
  tags: string[];
}

interface JobProfile {
  role: string;
  tasks: JobTask[];
  generatedAt: string;
}

interface TaskCatalog {
  metadata: {
    generatedAt: string;
    totalProfiles: number;
    totalTasks: number;
  };
  profiles: JobProfile[];
}

// Jobrollen definieren
const JOB_ROLES = [
  "Softwareentwickler",
  "Projektmanager", 
  "UX Designer",
  "Vertriebsmitarbeiter",
  "Marketing Manager",
  "Data Scientist",
  "HR Manager",
  "Kundenservice",
  "Buchhalter",
  "DevOps Engineer",
  "Produktmanager",
  "Grafik Designer",
  "Content Manager",
  "Business Analyst",
  "QA Tester",
  "Systemadministrator",
  "Recruiter",
  "Social Media Manager",
  "Controller",
  "Einkäufer"
];

// OpenAI Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Du bist ein präziser Task-Extraktor für Jobprofile. 

Analysiere das gegebene Jobprofil und erstelle eine strukturierte Liste typischer Aufgaben.

Für jede Aufgabe bestimme heuristisch:
- "Automatisierbar": Wenn die Aufgabe durch Software, APIs, Workflows oder Tools automatisiert werden kann
- "Menschlich": Wenn die Aufgabe menschliche Kreativität, Empathie, komplexe Entscheidungen oder physische Präsenz erfordert

Antworte nur mit einem validen JSON-Array im folgenden Format:
[
  {
    "title": "Kurze Aufgabenbezeichnung",
    "description": "Präzise Erklärung in einem Satz",
    "category": "Automatisierbar" oder "Menschlich", 
    "tags": ["tag1", "tag2", "tag3"]
  }
]

Generiere 8-12 realistische Aufgaben pro Rolle. Tags sollen relevant und prägnant sein (max. 5 Tags pro Aufgabe).`;

/**
 * Generiert Aufgaben für eine spezifische Jobrolle
 */
async function generateTasksForRole(role: string, retryCount = 0): Promise<JobTask[]> {
  const maxRetries = 3;
  
  try {
    console.log(`🔄 Generiere Aufgaben für: ${role} (Versuch ${retryCount + 1})`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5-2025-08-07",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generiere typische Aufgaben für: ${role}` }
      ],
      temperature: 0,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Keine Antwort von OpenAI erhalten");
    }

    // Versuche JSON zu parsen
    let tasks: JobTask[];
    try {
      // Manchmal wrapped GPT das Array in ein Objekt
      const parsed = JSON.parse(content);
      tasks = Array.isArray(parsed) ? parsed : parsed.tasks || parsed.aufgaben || Object.values(parsed)[0];
      
      if (!Array.isArray(tasks)) {
        throw new Error("Response ist kein Array");
      }
    } catch (parseError) {
      throw new Error(`JSON Parse Fehler: ${parseError}`);
    }

    // Validiere die Struktur
    const validTasks = tasks.filter(task => 
      task.title && 
      task.description && 
      task.category && 
      Array.isArray(task.tags) &&
      (task.category === "Automatisierbar" || task.category === "Menschlich")
    );

    if (validTasks.length === 0) {
      throw new Error("Keine validen Aufgaben gefunden");
    }

    console.log(`✅ ${validTasks.length} Aufgaben für ${role} generiert`);
    return validTasks;

  } catch (error) {
    console.error(`❌ Fehler bei ${role}:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} für ${role}`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
      return generateTasksForRole(role, retryCount + 1);
    }
    
    console.error(`❌ Alle Versuche fehlgeschlagen für ${role}`);
    return [];
  }
}

/**
 * Generiert den kompletten Aufgabenkatalog
 */
async function generateCompleteCatalog(): Promise<TaskCatalog> {
  console.log(`🚀 Starte Generierung für ${JOB_ROLES.length} Jobrollen...\n`);
  
  const profiles: JobProfile[] = [];
  let totalTasks = 0;

  // Sequentiell verarbeiten, um Rate Limits zu vermeiden
  for (const role of JOB_ROLES) {
    try {
      const tasks = await generateTasksForRole(role);
      
      if (tasks.length > 0) {
        profiles.push({
          role,
          tasks,
          generatedAt: new Date().toISOString()
        });
        totalTasks += tasks.length;
        
        console.log(`📊 ${role}: ${tasks.length} Aufgaben\n`);
      }
      
      // Rate limiting: 1 Sekunde zwischen Anfragen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Kritischer Fehler bei ${role}:`, error);
    }
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalProfiles: profiles.length,
      totalTasks
    },
    profiles
  };
}

/**
 * Speichert den Katalog als JSON-Datei
 */
async function saveCatalog(catalog: TaskCatalog): Promise<string> {
  const outputPath = path.join(process.cwd(), 'katalog.json');
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');
    console.log(`💾 Katalog gespeichert: ${outputPath}`);
    return outputPath;
  } catch (error) {
    throw new Error(`Fehler beim Speichern: ${error}`);
  }
}

/**
 * Zeigt Statistiken des generierten Katalogs an
 */
function showStatistics(catalog: TaskCatalog): void {
  console.log("\n" + "=".repeat(50));
  console.log("📊 KATALOG STATISTIKEN");
  console.log("=".repeat(50));
  console.log(`📋 Profile generiert: ${catalog.metadata.totalProfiles}`);
  console.log(`📝 Gesamt-Aufgaben: ${catalog.metadata.totalTasks}`);
  console.log(`⚡ Generiert am: ${new Date(catalog.metadata.generatedAt).toLocaleString('de-DE')}`);
  
  // Kategorie-Verteilung
  const categoryStats = catalog.profiles.reduce((acc, profile) => {
    profile.tasks.forEach(task => {
      acc[task.category] = (acc[task.category] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`🤖 Automatisierbar: ${categoryStats["Automatisierbar"] || 0} (${Math.round((categoryStats["Automatisierbar"] || 0) / catalog.metadata.totalTasks * 100)}%)`);
  console.log(`👤 Menschlich: ${categoryStats["Menschlich"] || 0} (${Math.round((categoryStats["Menschlich"] || 0) / catalog.metadata.totalTasks * 100)}%)`);
  
  // Top Profile nach Aufgaben-Anzahl
  const topProfiles = catalog.profiles
    .sort((a, b) => b.tasks.length - a.tasks.length)
    .slice(0, 5);
    
  console.log("\n🏆 Top Profile nach Aufgaben:");
  topProfiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.role}: ${profile.tasks.length} Aufgaben`);
  });
  
  console.log("=".repeat(50));
}

/**
 * Hauptfunktion
 */
async function main(): void {
  try {
    // API Key prüfen
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable ist nicht gesetzt");
    }

    console.log("🤖 Job Task Catalog Generator");
    console.log("🔑 OpenAI API Key gefunden");
    
    // Katalog generieren
    const catalog = await generateCompleteCatalog();
    
    // Speichern
    const savedPath = await saveCatalog(catalog);
    
    // Statistiken anzeigen
    showStatistics(catalog);
    
    console.log(`\n✅ Erfolgreich abgeschlossen! Datei: ${savedPath}`);
    
  } catch (error) {
    console.error("\n❌ Kritischer Fehler:", error);
    process.exit(1);
  }
}

// Skript ausführen wenn direkt aufgerufen
if (require.main === module) {
  main().catch(console.error);
}

export { generateCompleteCatalog, type TaskCatalog, type JobTask, type JobProfile };