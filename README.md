# Prom8eus - Dual-Type Solution Platform

Eine intelligente Plattform zur Analyse von Stellenanzeigen und Bewertung des Automatisierungspotenzials mit **Workflows** und **AI Agents**. Das System unterstützt ein einheitliches **SolutionIndex**-Modell für beide Lösungstypen mit typspezifischen Feldern und gemeinsamen Kernfunktionen.

## 🚀 Dual-Type Solution Model

### Unified Solution Architecture
- **Workflows**: n8n Community Templates, Official n8n.io Templates, AI-Enhanced Templates
- **AI Agents**: CrewAI Examples, HuggingFace Spaces, GitHub Agent Repositories
- **Unified Interface**: Einheitliche Anzeige und Bewertung beider Lösungstypen
- **Type-Specific Features**: Spezifische Metadaten und Bewertungskriterien pro Typ

### Advanced Features
- **LLM-Powered Enrichment**: Automatische Datenverbesserung mit GPT-4o-mini
- **Health Monitoring**: Comprehensive Health-Checks für alle Quellen
- **Admin Workflows**: Vollständige Admin-Validierung und Feedback-Systeme
- **Scoring Systems**: Workflow-Scores (0-100) und Agent-Tiers (Generalist/Specialist/Experimental)

## 📊 Solution Sources & Data

### Workflow Sources
- **GitHub Community** (~2,056 workflows) - n8n Community Workflows
- **Awesome n8n Templates** (~150 workflows) - Curated Community Templates  
- **n8n.io Official** (~5,496 workflows) - Official n8n Template Gallery
- **AI-Enhanced** (~150 workflows) - AI-Augmented Free Templates

### AI Agent Sources
- **CrewAI Examples** (~50 agents) - CrewAI Framework Examples
- **HuggingFace Spaces** (~200 agents) - AI Agent Spaces
- **GitHub Agents** (~100 agents) - GitHub AI Agent Repositories

### Business Domains (20 Predefined)
1. **Healthcare & Medicine** - Patient care, documentation, administration
2. **Nursing & Care** - Patient support, care coordination
3. **Life Sciences & Biotech** - Research, development, analysis
4. **Finance & Accounting** - Financial analysis, compliance, reporting
5. **Marketing & Advertising** - Campaign management, content creation
6. **Sales & CRM** - Customer relationship management, lead generation
7. **Human Resources & Recruiting** - Talent acquisition, employee management
8. **Education & Training** - Learning management, skill development
9. **Legal & Compliance** - Legal research, contract analysis
10. **IT & Software Development** - Software engineering, DevOps
11. **DevOps & Cloud** - Infrastructure management, deployment
12. **Design & Creative** - Graphic design, content creation
13. **E-commerce & Retail** - Online sales, inventory management
14. **Manufacturing & Supply Chain** - Production planning, logistics
15. **Real Estate & Property** - Property management, transactions
16. **Travel & Hospitality** - Booking management, customer service
17. **Media & Entertainment** - Content production, distribution
18. **Non-profit & Social Impact** - Social programs, fundraising
19. **Government & Public Sector** - Public services, policy implementation
20. **Research & Development** - Innovation, product development

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

## 🎯 Core Features

### Dual-Type Solution Management
- **Unified SolutionIndex Model** für Workflows und AI Agents
- **Type-Specific Metadata** mit gemeinsamen Kernfeldern
- **Intelligent Type Detection** und automatische Klassifikation
- **Cross-Type Search** und Filtering

### LLM-Powered Enrichment Pipeline
- **Summary Enhancement** mit GPT-4o-mini für bessere Klarheit
- **Categories Enrichment** mit standardisierten Tags
- **Capabilities Normalization** für AI Agents
- **Domain Classification** mit Confidence-Scores
- **Content-Hash Caching** für Kostenoptimierung

### Advanced Scoring Systems
- **Workflow Scoring** (0-100) basierend auf Kategorie, Integrationen, Komplexität
- **Agent Tier Classification** (Generalist/Specialist/Experimental)
- **Context-Aware Recommendations** basierend auf User-Query und Business-Domain
- **Explainable Scores** mit detaillierten Breakdowns

### Health Monitoring & Updates
- **Comprehensive Health Checks** für alle Quellen mit HEAD/GET Requests
- **Data Size Validation** mit konfigurierbaren Thresholds
- **Incremental Update Scheduling** mit Health-Based Logic
- **Automatic Recovery** mit Exponential Backoff

## 🔧 Admin Workflows & Management

### Enhanced Source Management
- **Per-Type Source Display** mit separaten Workflow- und Agent-Quellen
- **Real-Time Health Monitoring** mit Status-Indikatoren
- **Cache Analytics** mit detaillierten Performance-Metriken
- **Manual Refresh Controls** mit Status-Tracking
- **Error Reporting** mit Recovery-Status

### Validation & Quality Control
- **Admin Validation Queue** für LLM-extrahierte Setup-Steps
- **Domain Override Management** für manuelle Domain-Klassifikation
- **Batch Validation Operations** für Bulk-Approval
- **Audit Trail** für alle Admin-Aktionen
- **Quality Metrics** basierend auf User-Feedback

### User Feedback System
- **Pilot Feedback Capture** für detaillierte User-Feedback
- **Analytics Dashboard** mit aggregierten Feedback-Statistiken
- **Session Tracking** für Feedback-Kontinuität
- **Quality Assessment** basierend auf Feedback-Daten
- **Continuous Improvement** durch Feedback-Loops

### Implementation Request Funnel
- **User Request Form** für Implementation-Anfragen
- **Email Integration** mit automatischen Benachrichtigungen
- **Request Tracking** mit Status-Updates
- **Admin Management Interface** für Request-Verwaltung
- **Lead Generation** für Business-Development

## 🛠️ Technical Architecture

### Unified SolutionIndex Model
```typescript
interface SolutionIndex {
  // Common core fields (mandatory)
  id: string;
  source: string;
  title: string;
  summary: string;
  link: string;
  type: 'workflow' | 'agent';
  
  // Workflow-specific fields
  category?: string;
  integrations?: string[];
  complexity?: 'Low' | 'Medium' | 'High';
  
  // Agent-specific fields
  model?: string;
  provider?: string;
  capabilities?: string[];
  
  // Common optional fields
  domains?: string[];
  domain_confidences?: number[];
  license?: string;
}
```

### LLM Enrichment Pipeline
```typescript
// Automatic enrichment with caching
const enrichmentResult = await EnrichmentService.enrichSummary(solution);
const categoriesResult = await EnrichmentService.enrichCategories(solution);
const domainsResult = await EnrichmentService.enrichDomains(solution);
```

### Health Monitoring System
```typescript
// Comprehensive health checks
const healthResult = await AgentSourceHealthService.performHealthCheck(source);
const updateResult = await IncrementalUpdateScheduler.processPendingUpdates();
```

### Advanced Scoring Systems
```typescript
// Workflow scoring (0-100)
const workflowScore = calculateWorkflowScore(workflow, context);

// Agent tier classification
const agentTier = calculateAgentTier(agent, context);
```

## 📈 Usage & Workflows

### For Users
1. **Enter Job Description** (German or English)
2. **Automatic Industry Detection** identifies relevant business domain
3. **Tasks are Extracted** using industry-specific patterns
4. **Solutions are Recommended** from both Workflows and AI Agents
5. **Scoring & Tiering** provides detailed quality assessment
6. **Implementation Steps** are generated with LLM assistance

### For Administrators
1. **Enhanced Source Management** - Monitor and manage all data sources
2. **Health Monitoring** - Track source health and performance
3. **Validation Queue** - Review and approve LLM-generated content
4. **Feedback Management** - Analyze user feedback and quality metrics
5. **Request Funnel** - Manage implementation requests and leads

### For Developers
1. **Unified API** - Single interface for both Workflows and AI Agents
2. **Type Guards** - Safe type checking for solution-specific operations
3. **Enrichment Pipeline** - Automatic data enhancement with caching
4. **Health Monitoring** - Comprehensive monitoring and recovery systems
5. **Admin Workflows** - Complete admin interface for system management

## 🔧 Installation & Setup

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build
```

## 📚 Documentation

### Core Documentation
- **`docs/stand-implementierung-loesungen-vorschlaege.md`** - Complete implementation status and dual-type model documentation
- **`docs/LLM_CATALOG.md`** - Comprehensive catalog of all AI tools by industry
- **`docs/recommendations-mvp.md`** - MVP recommendations and implementation guide

### Key Implementation Files
- **`src/lib/workflowIndexer.ts`** - Unified solution loading, caching, and filtering
- **`src/lib/solutions/enrichmentService.ts`** - LLM-powered data enrichment pipeline
- **`src/lib/solutions/agentSourceHealthService.ts`** - Comprehensive health monitoring
- **`src/lib/solutions/incrementalUpdateScheduler.ts`** - Intelligent update scheduling

### Admin Components
- **`src/components/EnhancedSourcesManagement.tsx`** - Per-type source management
- **`src/components/AdminValidationQueue.tsx`** - Unified validation interface
- **`src/components/PilotFeedbackManagement.tsx`** - User feedback system

### Database Schema
- **`supabase/migrations/20250128000007_consolidated_admin_system.sql`** - Admin system schema
- **`supabase/migrations/20250128000009_enrichment_pipeline.sql`** - Enrichment pipeline schema
- **`supabase/migrations/20250128000010_agent_source_health_checks.sql`** - Health monitoring schema

## 🌟 Benefits of Dual-Type Solution Model

### For Businesses
- **Unified Solution Discovery** - Access to both Workflows and AI Agents in one platform
- **Intelligent Scoring & Tiering** - Quality assessment for all solution types
- **LLM-Enhanced Data** - Automatically improved descriptions and categorizations
- **Health-Monitored Sources** - Reliable, up-to-date solution data
- **Admin-Validated Content** - Quality-controlled implementation steps

### For Developers
- **Unified API** - Single interface for both Workflows and AI Agents
- **Type-Safe Operations** - Comprehensive type guards and validation
- **Extensible Architecture** - Easy addition of new solution types and sources
- **Comprehensive Monitoring** - Health checks, performance metrics, and error recovery
- **Admin Workflows** - Complete admin interface for system management

### For Administrators
- **Enhanced Source Management** - Per-type source monitoring and control
- **Validation Workflows** - Quality control for LLM-generated content
- **User Feedback Analytics** - Data-driven quality improvement
- **Request Funnel Management** - Lead generation and business development
- **Performance Monitoring** - Comprehensive system health and optimization

## 🤝 Contributing

We welcome contributions to further enhance the dual-type solution platform:

### Solution Sources
- **New Workflow Sources** - Add new workflow repositories and APIs
- **New AI Agent Sources** - Integrate additional AI agent platforms
- **Source Health Monitoring** - Improve health check strategies
- **Data Quality Enhancement** - Better normalization and validation

### Enrichment Pipeline
- **LLM Prompt Optimization** - Improve enrichment quality and accuracy
- **Caching Strategies** - Optimize cost and performance
- **Domain Classification** - Enhance business domain mapping
- **Capability Normalization** - Standardize AI agent capabilities

### Admin Workflows
- **UI/UX Improvements** - Enhance admin interfaces
- **Validation Workflows** - Streamline quality control processes
- **Feedback Analytics** - Improve user feedback analysis
- **Performance Monitoring** - Advanced monitoring and alerting

### Technical Architecture
- **Type System Enhancement** - Improve type safety and validation
- **API Extensions** - Add new endpoints and functionality
- **Database Optimization** - Performance and scalability improvements
- **Testing Coverage** - Comprehensive test suites for all features

## 🎉 Dual-Type Solution Model - Complete Implementation

**Fully Implemented Features:**
- ✅ **Unified SolutionIndex Model** for Workflows and AI Agents
- ✅ **LLM-Powered Enrichment Pipeline** with caching and observability
- ✅ **Comprehensive Health Monitoring** with automatic recovery
- ✅ **Admin Validation Workflows** with feedback systems
- ✅ **Advanced Scoring Systems** for Workflows and Agents
- ✅ **Enhanced Database Schema** with versioning and performance optimization

**Solution Sources:**
- **Workflows**: GitHub Community, Awesome n8n Templates, n8n.io Official, AI-Enhanced
- **AI Agents**: CrewAI Examples, HuggingFace Spaces, GitHub Agent Repositories

**Admin Capabilities:**
- **Enhanced Source Management** with per-type monitoring
- **Validation Queue** for LLM-generated content
- **Pilot Feedback System** with analytics
- **Implementation Request Funnel** with email integration
- **Health Monitoring** with incremental updates

**Technical Highlights:**
- **Type-Safe Operations** with comprehensive validation
- **Content-Hash Caching** for cost optimization
- **Exponential Backoff** for robust error handling
- **Performance Monitoring** with detailed metrics
- **Scalable Architecture** for future expansion

## 📄 License

MIT License - see LICENSE file for details.

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
