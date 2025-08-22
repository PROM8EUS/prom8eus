# Agent API Integration

## Übersicht

PROM8EUS integriert jetzt echte Agent-APIs, um verfügbare AI-Agenten automatisch zu laden und anzuzeigen. Die Integration erfolgt über mehrere APIs und wird in der TaskPanel-Komponente verwendet.

## Integrierte APIs

### 1. LangChain Hub API
- **Endpoint**: `https://api.smith.langchain.com/repos`
- **Filter**: Agenten mit Tags "agent", "assistant", "automation"
- **Daten**: Name, Beschreibung, Tags, Downloads, Likes, Owner
- **Status**: ✅ Live Integration

### 2. Hugging Face Agents API
- **Endpoint**: `https://huggingface.co/api/models`
- **Filter**: Modelle mit "agent" in Tags
- **Daten**: Name, Beschreibung, Downloads, Likes, Author
- **Status**: ✅ Live Integration

### 3. OpenAI GPTs
- **Status**: ⚠️ Keine öffentliche API verfügbar
- **Lösung**: Manuell kuratierte Liste der wichtigsten GPTs
- **Daten**: GPT-4, GPT-3.5 Turbo mit Pricing-Informationen

### 4. Anthropic Claude
- **Status**: ⚠️ Keine öffentliche API verfügbar
- **Lösung**: Manuell kuratierte Liste der Claude-Modelle
- **Daten**: Claude 3 Opus, Claude 3 Sonnet mit Pricing

## Implementierung

### Dateien
- `src/lib/agentAPIs.ts` - Hauptlogik für API-Integration
- `src/components/TaskPanel.tsx` - UI-Integration

### Hauptfunktionen

```typescript
// Alle Agenten laden
const agents = await fetchAllAgents();

// Nach Capabilities filtern
const filtered = filterAgentsByCapabilities(agents, ['data-analysis']);

// Nach Suchbegriff suchen
const searchResults = searchAgents(agents, 'reporting');
```

### Datenstruktur

```typescript
interface AgentAPI {
  id: string;
  name: string;
  description: string;
  provider: 'langchain' | 'huggingface' | 'openai' | 'anthropic';
  capabilities: string[];
  pricing?: {
    type: 'free' | 'per-token' | 'subscription';
    cost?: number;
    unit?: string;
  };
  source: string;
  tags: string[];
  lastUpdated: string;
  usage: number;
  rating?: number;
}
```

## Features

### ✅ Implementiert
- **Live API-Integration**: Echte Daten von LangChain Hub und Hugging Face
- **Automatisches Laden**: Agenten werden beim Komponenten-Mount geladen
- **Filtering**: Nach Capabilities und Suchbegriffen
- **Sortierung**: Nach Usage/Rating
- **Error Handling**: Graceful Fallbacks bei API-Fehlern
- **Loading States**: Benutzerfreundliche Ladeanzeigen
- **Suchfunktion**: Echtzeit-Suche in der UI

### 🔄 Geplant
- **Caching**: Agenten-Daten für bessere Performance
- **Pagination**: Für große Agenten-Listen
- **Favoriten**: Benutzer können Agenten favorisieren
- **Bewertungen**: Community-Bewertungen für Agenten
- **Integration Tests**: Automatisierte API-Tests

## Verwendung in der UI

### TaskPanel Integration
```typescript
// Agenten werden automatisch geladen
const [availableAgents, setAvailableAgents] = useState<AgentAPI[]>([]);

// Gefiltert nach Task-Capabilities
const filteredAgents = useMemo(() => {
  const taskCapabilities = ['data-analysis', 'automation', 'api-integration'];
  return filterAgentsByCapabilities(availableAgents, taskCapabilities);
}, [availableAgents]);
```

### UI-Komponenten
- **Suchfeld**: Echtzeit-Suche nach Agenten
- **Agent-Cards**: Anzeige von Name, Provider, Capabilities, Rating
- **Config-Button**: Öffnet Agent-Konfigurations-Modal
- **Abonnieren-Button**: Direkte Integration

## API-Limits & Performance

### LangChain Hub
- **Rate Limit**: Keine bekannten Limits
- **Response Time**: ~500ms
- **Data Freshness**: Real-time

### Hugging Face
- **Rate Limit**: 100 requests/hour (unauthenticated)
- **Response Time**: ~800ms
- **Data Freshness**: Real-time

### Fallback-Strategie
1. Versuche alle APIs parallel
2. Verwende erfolgreiche Responses
3. Fallback zu kuratierten Listen bei Fehlern
4. Zeige Loading-States während API-Calls

## Monitoring & Debugging

### Console Logs
```typescript
// Erfolgreiche API-Calls
console.log('Loaded agents:', agents.length);

// API-Fehler
console.error('Error fetching agents:', error);
```

### Performance Metrics
- **Load Time**: Zeit bis alle Agenten geladen sind
- **Success Rate**: Prozentsatz erfolgreicher API-Calls
- **Data Quality**: Anzahl Agenten mit vollständigen Daten

## Nächste Schritte

1. **Caching implementieren**: Redis oder localStorage für bessere Performance
2. **Mehr APIs integrieren**: AutoGen, CrewAI, etc.
3. **Agent-Tests**: Sandbox-Testing für Agenten
4. **Community-Features**: Bewertungen und Reviews
5. **Monetization**: Premium-Agenten und Subscriptions

## Troubleshooting

### Häufige Probleme

**API-Fehler 429 (Rate Limit)**
```typescript
// Lösung: Implementiere Retry-Logic
const fetchWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

**Leere Agenten-Liste**
- Prüfe API-Endpoints
- Überprüfe Network-Requests
- Fallback zu kuratierten Listen

**Langsame Ladezeiten**
- Implementiere Caching
- Verwende Pagination
- Optimiere API-Calls
