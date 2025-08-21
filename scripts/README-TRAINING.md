# 🧠 Automatisches Training-System für Stellenanzeigen-Analyse

## Übersicht

Dieses System implementiert eine vollständige **selbstlernende Pipeline** für die iterative Verbesserung der Stellenanzeigen-Analyse. Es generiert automatisch Testdaten, bewertet die Performance, identifiziert Schwachstellen und verbessert den Algorithmus eigenständig.

## 🎯 Features

- ✅ **Automatische Stellenanzeigen-Generierung** für 6 Branchen (Tech, Marketing, Finance, HR, Healthcare, Production)
- ✅ **Intelligente Bewertung** von Task-Extraktion und Branchenerkennung
- ✅ **Selbstlernende Verbesserungen** mit automatischen Code-Änderungen
- ✅ **Validierung und Rollback** bei Performance-Verschlechterung
- ✅ **Vollständige Pipeline** mit konfigurierbaren Parametern
- ✅ **Detaillierte Reports** und Performance-Tracking

## 🚀 Verwendung

### Schnell-Training (3 Iterationen)
```bash
npm run train:quick
```

### Standard-Training (5 Iterationen)
```bash
npm run train
```

### Intensiv-Training (10 Iterationen mit Speicherung)
```bash
npm run train:intensive
```

### Super-Intensiv-Training (20 Iterationen, 150 Tests)
```bash
npm run train:super
```

### Cleanup (Bereinigung alter Dateien)
```bash
npm run cleanup                    # Automatische Bereinigung
npm run cleanup:dry               # Trockenlauf (zeigt was gelöscht würde)
npm run cleanup 5 3 2            # Custom: 5 Training, 3 Intensive, 2 Backups
```

### Manuell konfiguriert
```bash
npm run train [iterationen] [ziel-score] [tests] [verbesserungen] [optionen]

# Beispiele:
npm run train 8 0.85 40 3           # 8 Iterationen, 85% Ziel, 40 Tests
npm run train 5 0.9 30 2 --save     # Mit Ergebnis-Speicherung
npm run train 3 0.8 20 1 --verbose  # Mit detailliertem Output
```

### Parameter
- **Iterationen**: Max. Anzahl Trainings-Zyklen (Standard: 5)
- **Ziel-Score**: Angestrebte Genauigkeit 0-1 (Standard: 0.85 = 85%)
- **Tests**: Tests pro Iteration (Standard: 30)
- **Verbesserungen**: Max. Verbesserungen pro Iteration (Standard: 3)

### Optionen
- `--save` / `-s`: Speichere detaillierte Ergebnisse
- `--verbose` / `-v`: Ausführlicher Output
- `--help` / `-h`: Hilfe anzeigen

## 📊 System-Architektur

### 1. JobGenerator
```typescript
// Generiert realistische Stellenanzeigen
const job = generator.generateJob('tech');
// → UX/UI Designer mit 6 echten Aufgaben + Benefits + Qualifikationen
```

### 2. TrainingSystem
```typescript
// Führt Training-Zyklen durch
const report = await trainingSystem.runTrainingCycle(30);
// → Analysiert 30 generierte Stellenanzeigen und bewertet Ergebnisse
```

### 3. AlgorithmImprover
```typescript
// Analysiert Schwachstellen und schlägt Verbesserungen vor
const suggestions = improver.analyzeAndImprove(report);
// → ["Erweitere Qualification Patterns", "Verbessere Tech-Keywords", ...]
```

### 4. TrainingPipeline
```typescript
// Vollständige selbstlernende Pipeline
const results = await pipeline.run();
// → Iteriert bis Ziel erreicht oder Max-Iterationen
```

## 🔍 Bewertungs-Metriken

### Task Accuracy (Aufgaben-Genauigkeit)
- **100%**: Alle echten Aufgaben erkannt, keine False Positives
- **80%**: 8/10 Aufgaben erkannt, wenige False Positives
- **60%**: Moderate Genauigkeit mit Verbesserungsbedarf
- **<50%**: Starke Schwächen in Task-Extraktion

### Industry Accuracy (Branchen-Genauigkeit)
- **100%**: Branche korrekt erkannt
- **0%**: Branche falsch erkannt

### Overall Score (Gesamt-Score)
```
Overall = (Task Accuracy × 0.7) + (Industry Accuracy × 0.3) - False Positive Penalty
```

## 🛠️ Automatische Verbesserungen

Das System kann folgende Verbesserungen **automatisch** anwenden:

### 1. Task Extraction
- **Qualification Patterns erweitern** bei häufigen False Positives
- **Task-Verben hinzufügen** bei übersehenen Aufgaben
- **Minimale Task-Länge anpassen** für kurze Aufgaben

### 2. Industry Detection
- **Branchen-Keywords erweitern** bei Fehlklassifikationen
- **Reihenfolge optimieren** für bessere Prioritäten
- **Spezifische Patterns hinzufügen** für problematische Branchen

### 3. Qualification Filtering
- **Benefits-Patterns erweitern** um False Positives zu reduzieren
- **Skill-Recognition verbessern** für bessere Filterung

## 📈 Beispiel-Output

```
🚀 Starting Training Pipeline
============================
Max Iterations: 5
Target Score: 85%
Tests per Iteration: 30

🔄 Iteration 1/5
================================
📊 Running training cycle...
Current Score: 72%
Task Accuracy: 68%
Industry Accuracy: 84%

🔧 Analyzing and applying improvements...
Found 8 improvement suggestions:
  1. [HIGH] Erweitere Qualification Patterns für häufige False Positives (Expected: +15%)
  2. [HIGH] Verbessere tech Detection - oft fälschlicherweise als hr erkannt (Expected: +12%)
  3. [MEDIUM] Erweitere Task-Verben für übersehene Aufgaben (Expected: +8%)

✅ Applied 3/3 improvements

🧪 Validating improvements...
Validation Score: 79% (+7%)

🔄 Iteration 2/5
================================
📊 Running training cycle...
Current Score: 81%
Task Accuracy: 79%
Industry Accuracy: 86%

🎯 Target score 85% reached!

🏁 Training Pipeline Complete
=============================
Iterations: 3
Initial Score: 72%
Final Score: 87%
Total Improvement: +15%
Total Improvements Applied: 7
Total Time: 45s
🎯 TARGET REACHED! ✅
```

## 🎯 Verwendungs-Strategien

### 1. Täglich (Quick Training)
```bash
npm run train:quick
```
- 3 Iterationen, schnelle Verbesserungen
- Perfekt für tägliche Optimierung

### 2. Wöchentlich (Standard Training)
```bash
npm run train --save
```
- 5 Iterationen mit Ergebnis-Speicherung
- Systematische Verbesserung

### 3. Monatlich (Intensive Training)
```bash
npm run train:intensive
```
- 10 Iterationen, 50 Tests pro Iteration
- Umfassende Optimierung aller Bereiche

### 4. Nach neuen Features
```bash
npm run train 8 0.9 40 5 --save --verbose
```
- Intensive Validierung nach Code-Änderungen
- Detaillierte Logs für Debugging

## 🔄 Kontinuierlicher Verbesserung-Zyklus

1. **Generiere** diverse Stellenanzeigen
2. **Analysiere** mit aktuellem Algorithmus
3. **Bewerte** Genauigkeit und identifiziere Probleme
4. **Verbessere** Code automatisch basierend auf Daten
5. **Validiere** Verbesserungen mit neuen Tests
6. **Wiederhole** bis Ziel erreicht

## 📂 Gespeicherte Ergebnisse

Bei `--save` Option werden gespeichert:
- `training-results/iteration-001-[timestamp].json` - Detaillierte Iterations-Daten
- `training-results/performance-report-[timestamp].md` - Markdown Performance-Report
- `intensive-training-results/intensive-iteration-001-[timestamp].json` - Intensive Training-Daten
- `intensive-training-results/intensive-report-[timestamp].md` - Intensive Performance-Report

## 🧹 Automatische Bereinigung

Das System bereinigt automatisch nach jedem Training:

### Cleanup-Verhalten:
- **Training Results:** Behält die letzten 10 Dateien
- **Intensive Results:** Behält die letzten 5 Dateien  
- **Backup Files:** Behält die letzten 3 Backups pro Datei
- **Reports:** Behält die letzten 5 Report-Dateien

### Manuelle Bereinigung:
```bash
npm run cleanup:dry               # Zeigt was bereinigt würde
npm run cleanup                  # Führt Bereinigung durch
npm run cleanup 5 3 2 --verbose  # Custom mit detailliertem Output
```

## 🚨 Sicherheit & Rollback

- **Automatische Backups** vor jeder Code-Änderung
- **Performance-Validation** nach Verbesserungen
- **Automatischer Rollback** bei Score-Verschlechterung
- **Inkrementelle Verbesserungen** (max 3 pro Iteration)

## 💡 Erweiterte Nutzung

### Custom Job Templates
```typescript
// In scripts/auto-training-system.ts
JOB_TEMPLATES.myIndustry = {
  roles: ['My Role'],
  taskPatterns: ['My task pattern'],
  // ...
};
```

### Custom Evaluation Metrics
```typescript
// In scripts/algorithm-improver.ts
evaluate(job, analysis) {
  // Custom evaluation logic
}
```

### Integration in CI/CD
```yaml
# .github/workflows/training.yml
- name: Run Training Pipeline
  run: npm run train:quick
  
- name: Check Performance Regression
  run: npm run train 1 0.8 10 0  # Nur Test, keine Verbesserungen
```

---

**Dieses System macht die Stellenanzeigen-Analyse selbstlernend und kontinuierlich besser! 🚀**
