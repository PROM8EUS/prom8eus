# Prom8eus - Aufgabenautomatisierung mit KI

Eine intelligente Plattform zur Analyse von Stellenanzeigen und Bewertung des Automatisierungspotenzials mit branchenspezifischen AI-Tools.

## 🚀 Neue Features - Branchenspezifische Optimierung

### Branchenerkennung & Optimierung
- **Automatische Branchenerkennung** für 8 Hauptbranchen
- **Branchenspezifische Aufgaben-Erkennung** mit angepassten Patterns
- **Moderne AI-Tools** für jede Branche
- **Deutsch & Englisch** Unterstützung

### Unterstützte Branchen
1. **Technologie & IT** - Software-Entwicklung, DevOps, Systemadministration
2. **Gesundheitswesen** - Patientenpflege, Dokumentation, Verwaltung
3. **Finanzwesen** - Buchhaltung, Finanzanalyse, Compliance
4. **Marketing & Sales** - Content-Erstellung, Kampagnen-Management
5. **HR & Personal** - Recruiting, Mitarbeiterbetreuung, Verwaltung
6. **Produktion & Logistik** - Produktionsplanung, Qualitätskontrolle
7. **Bildung & Forschung** - Unterrichtsvorbereitung, Forschung
8. **Recht & Compliance** - Rechtsberatung, Vertragsprüfung

### Branchenspezifische AI-Tools
Jede Branche verfügt über spezialisierte AI-Tools:

- **Tech:** GitHub Copilot, Claude, CodeWhisperer
- **Healthcare:** Notion AI, Claude, Microsoft Copilot
- **Finance:** Excel AI, Power BI AI, Claude
- **Marketing:** Jasper, Copy.ai, Canva AI
- **HR:** Notion AI, Airtable AI, ChatGPT
- **Production:** Excel AI, Power BI AI, Airtable AI
- **Education:** Notion AI, Obsidian AI, ChatGPT
- **Legal:** Notion AI, Claude, Perplexity

## 🎯 Hauptfunktionen

### Intelligente Aufgaben-Erkennung
- **Erweiterte Pattern-Erkennung** für verschiedene Aufgabentypen
- **Branchenspezifische Keywords** und Verben
- **Mehrsprachige Unterstützung** (Deutsch/Englisch)
- **Automatische Qualifikationsfilterung**

### Automatisierungsanalyse
- **Detaillierte Bewertung** jeder Aufgabe
- **Branchenspezifische Scoring** basierend auf AI-Tools
- **Empfohlene AI-Tools** für jede Aufgabe
- **Automatisierungspotenzial** in Prozent

### Moderne AI-Integration
- **Über 100 AI-Tools** im Katalog
- **Branchenspezifische Empfehlungen**
- **Konkrete Implementierungsschritte**
- **Kontinuierliche Updates** neuer Tools

## 📊 Automatisierungspotenzial nach Branche

| Branche | Automatisierungspotenzial | Hauptfokus |
|---------|---------------------------|------------|
| **Finanzwesen** | 70-90% | Repetitive Finanzaufgaben |
| **Technologie & IT** | 60-80% | Entwicklungsaufgaben |
| **Produktion & Logistik** | 60-80% | Planungs- und Kontrollaufgaben |
| **Marketing & Sales** | 50-70% | Content-Erstellung |
| **HR & Personal** | 40-60% | Administrative Aufgaben |
| **Recht & Compliance** | 40-60% | Recherche und Dokumentation |
| **Bildung & Forschung** | 30-50% | Administrative Aufgaben |
| **Gesundheitswesen** | 30-50% | Dokumentation und Verwaltung |

## 🛠️ Technische Verbesserungen

### Erweiterte Aufgaben-Erkennung
```typescript
// Neue branchenspezifische Erkennung
const detectedIndustry = detectIndustry(text);
const tasks = extractTasksAdvanced(text);
```

### Branchenspezifische AI-Tools
```typescript
// Automatische Tool-Empfehlungen
const aiTools = AI_TOOLS_BY_INDUSTRY[industry];
const recommendations = generateRecommendations(tasks, score);
```

### Moderne Automatisierungstrends
- **Schrittweise Implementierung** mit kontinuierlicher Evaluation
- **Kombination von AI-Tools** mit menschlicher Expertise
- **Fokus auf repetitive, strukturierte Aufgaben**
- **Branchenspezifische Optimierung** für beste Ergebnisse

## 📈 Verwendung

1. **Stellenanzeige eingeben** (Deutsch oder Englisch)
2. **Automatische Branchenerkennung** erfolgt
3. **Aufgaben werden extrahiert** mit branchenspezifischen Patterns
4. **Automatisierungspotenzial wird bewertet** basierend auf AI-Tools
5. **Branchenspezifische Empfehlungen** werden generiert
6. **Konkrete AI-Tools** werden empfohlen

## 🔧 Installation & Setup

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build
```

## 📚 Dokumentation

- **LLM_CATALOG.md** - Vollständiger Katalog aller AI-Tools nach Branchen
- **Branchenspezifische Patterns** in `src/lib/extractTasks.ts`
- **AI-Tool-Empfehlungen** in `src/lib/runAnalysis.ts`

## 🌟 Vorteile der Optimierung

### Für Unternehmen
- **Präzisere Aufgaben-Erkennung** in der eigenen Branche
- **Relevante AI-Tool-Empfehlungen** für spezifische Aufgaben
- **Realistische Automatisierungspotenziale** basierend auf aktuellen Tools
- **Konkrete Implementierungsschritte** für jede Branche

### Für Entwickler
- **Erweiterbare Architektur** für neue Branchen
- **Modulare AI-Tool-Integration** 
- **Mehrsprachige Unterstützung** von Grund auf
- **Kontinuierliche Verbesserung** durch Feedback-Loops

## 🤝 Beitragen

Wir freuen uns über Beiträge zur weiteren Optimierung:
- Neue Branchen hinzufügen
- AI-Tools für bestehende Branchen erweitern
- Pattern-Erkennung verbessern
- Mehrsprachige Unterstützung erweitern

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details.

## Environment Variables

This project uses environment variables for configuration. Copy `.env.example` to `.env` and fill in your actual values:

```bash
cp .env.example .env
```

### Required Environment Variables

- **Supabase Configuration**: Database and authentication settings
- **Logo.dev API Key**: For AI tool logo fallbacks (get your keys from [logo.dev](https://logo.dev))

### Logo.dev API Setup

1. Sign up at [logo.dev](https://logo.dev)
2. Get your API keys from the dashboard
3. Add them to your `.env` file:
   ```bash
   VITE_LOGO_DEV_API_KEY=your_public_key_here
   ```

### Logo Fallback System

The app uses a three-tier logo fallback system with intelligent 404 detection:
1. **Primary**: Wikimedia Commons (high-quality SVGs)
2. **Fallback**: logo.dev API (with your API key)
3. **Text Fallback**: First letter of the tool name

**Smart Fallback Logic**:
- Automatically detects 404 responses from primary URLs
- Pre-validates fallback URLs before attempting to load them
- Gracefully handles network errors and HTTP status codes
- Provides detailed logging for debugging

**Logo.dev API Integration**:
- Uses the correct `img.logo.dev` endpoint format
- Includes proper token authentication and size parameters
- **Important**: Requires attribution link to logo.dev on your site

**Note**: Never commit your `.env` file to version control. It's already added to `.gitignore`.

## Getting Started
