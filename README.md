# Prom8eus - Unified Workflow Platform

Eine intelligente Plattform zur Analyse von Stellenanzeigen und Bewertung des Automatisierungspotenzials mit **Unified Workflows**. Das System verwendet ein einheitliches **UnifiedWorkflow**-Schema für alle Workflow-Typen (GitHub, n8n.io, AI-generated) mit konsistenter Datenstruktur und optimierter Performance.

## 🚀 Unified Workflow Schema

### Unified Workflow Architecture
- **GitHub Workflows**: Community n8n workflows from GitHub repositories
- **n8n.io Templates**: Official n8n template gallery workflows
- **AI-Generated Workflows**: Context-based AI workflow generation
- **Unified Interface**: Einheitliche Anzeige und Bewertung aller Workflow-Typen
- **Consistent Data Model**: Einheitliches Schema für alle Workflow-Quellen

### Advanced Features
- **LLM-Powered Enrichment**: Automatische Datenverbesserung mit GPT-4o-mini
- **Health Monitoring**: Comprehensive Health-Checks für alle Quellen
- **Simplified Admin Interface**: Streamlined admin interface for system management
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

## 🔧 Simplified Admin Interface

### Streamlined Source Management
- **Unified Source Display** mit konsolidierten Workflow- und Agent-Quellen
- **Real-Time Health Monitoring** mit Status-Indikatoren
- **Cache Analytics** mit Performance-Metriken
- **Manual Refresh Controls** mit Status-Tracking
- **Error Reporting** mit Recovery-Status

### Quality Control & Management
- **Simplified Validation** für Setup-Steps
- **Domain Management** für manuelle Domain-Klassifikation
- **Batch Operations** für Bulk-Approval
- **Audit Trail** für alle Admin-Aktionen
- **Quality Metrics** basierend auf User-Feedback

### Implementation Request Management
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

# Tests ausführen
npm run test

# Tests mit UI
npm run test:ui

# Test Coverage
npm run test:coverage

# Linting
npm run lint
```

## 📚 Documentation

### Core Documentation
- **`docs/stand-implementierung-loesungen-vorschlaege.md`** - Complete implementation status and dual-type model documentation
- **`docs/LLM_CATALOG.md`** - Comprehensive catalog of all AI tools by industry
- **`docs/recommendations-mvp.md`** - MVP recommendations and implementation guide

### Feature Toggle Documentation
- **`docs/feature-toggles.md`** - Complete feature toggle system documentation
- **`docs/feature-toggle-migration.md`** - Migration guide from old feature flags to new toggles
- **`docs/configuration-system.md`** - Configuration system documentation and best practices
- **`docs/environment-variables.md`** - Comprehensive environment variables reference and setup guide

### Migration and Remediation Documentation
- **`docs/overengineering-remediation-migration-guide.md`** - Complete technical migration guide for the over-engineering remediation
- **`docs/team-memo-overengineering-remediation.md`** - Executive summary and team memo for the remediation effort

### Rollout and Deployment Documentation
- **`docs/rollout-plan-feature-toggles.md`** - Comprehensive rollout plan for feature toggles and phased deployment
- **`docs/dark-launch-strategy.md`** - Dark launch strategy for safe feature deployment
- **`docs/rollout-implementation-guide.md`** - Step-by-step implementation guide with commands and troubleshooting

### Monitoring and Analytics Documentation
- **`docs/monitoring-system.md`** - Comprehensive monitoring system for refactored analysis and marketplace flows

### Key Implementation Files
- **`src/lib/workflowIndexer.ts`** - Unified solution loading, caching, and filtering
- **`src/lib/solutions/enrichmentService.ts`** - LLM-powered data enrichment pipeline
- **`src/lib/solutions/agentSourceHealthService.ts`** - Comprehensive health monitoring
- **`src/lib/solutions/incrementalUpdateScheduler.ts`** - Intelligent update scheduling

### Feature Toggle System
- **`src/lib/featureToggle.ts`** - Lightweight feature toggle system using environment variables
- **`supabase/functions/_shared/feature-toggles.ts`** - Shared feature toggle utilities for Supabase Edge Functions
- **`src/lib/config.ts`** - Configuration system with robust boolean environment variable handling

### Admin Components
- **`src/components/EnhancedSourcesManagement.tsx`** - Per-type source management
- **`src/components/ImplementationRequestsManagement.tsx`** - Implementation request management

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
- **Streamlined Source Management** with unified monitoring
- **Simplified Validation** for content quality control
- **Implementation Request Management** with email integration
- **Health Monitoring** with incremental updates
- **Performance Analytics** with detailed metrics

**Technical Highlights:**
- **Type-Safe Operations** with comprehensive validation
- **Content-Hash Caching** for cost optimization
- **Exponential Backoff** for robust error handling
- **Performance Monitoring** with detailed metrics
- **Scalable Architecture** for future expansion

## 📄 License

MIT License - see LICENSE file for details.

## Environment Variables

This project uses environment variables for configuration. For a comprehensive guide to all environment variables, see [Environment Variables Documentation](docs/environment-variables.md).

### Quick Setup

1. Create a `.env` file in the project root
2. Add your environment variables (see [Environment Variables Documentation](docs/environment-variables.md) for complete list)
3. Restart your development server

### Required Environment Variables

- **Supabase Configuration**: Database and authentication settings
- **Logo.dev API Key**: For AI tool logo fallbacks (get your keys from [logo.dev](https://logo.dev))

### Feature Toggles

The application uses a lightweight feature toggle system based on environment variables. All toggles are enabled by default but can be disabled by setting the corresponding environment variable to `false`.

#### Client-Side Feature Toggles (VITE_*)

```bash
# Unified Workflow Schema
VITE_UNIFIED_WORKFLOW_SCHEMA=true
VITE_UNIFIED_WORKFLOW_READ=true
VITE_UNIFIED_WORKFLOW_WRITE=true
VITE_UNIFIED_WORKFLOW_SEARCH=true
VITE_UNIFIED_WORKFLOW_AI_GENERATION=true
VITE_UNIFIED_WORKFLOW_MIGRATION=false
VITE_UNIFIED_WORKFLOW_FRONTEND=true
VITE_UNIFIED_WORKFLOW_ANALYTICS=false

# General Features
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_WORKFLOW_SEARCH=true
VITE_ENABLE_AGENT_RECOMMENDATIONS=true
VITE_RECOMMENDATIONS_ENABLE_LLM=true
VITE_RECOMMENDATIONS_ENABLE_CACHE=true
VITE_RECOMMENDATIONS_TOP_K=6
VITE_RECOMMENDATIONS_LLM_TIMEOUT_MS=3000
VITE_RECOMMENDATIONS_CACHE_TTL_MINUTES=60
```

#### Server-Side Feature Toggles (Deno.env)

```bash
# Unified Workflow Schema (for Supabase Edge Functions)
UNIFIED_WORKFLOW_SCHEMA=true
UNIFIED_WORKFLOW_READ=true
UNIFIED_WORKFLOW_WRITE=true
UNIFIED_WORKFLOW_SEARCH=true
UNIFIED_WORKFLOW_AI_GENERATION=true
UNIFIED_WORKFLOW_MIGRATION=false
UNIFIED_WORKFLOW_FRONTEND=true
UNIFIED_WORKFLOW_ANALYTICS=false
```

#### Feature Toggle Usage

```typescript
// Client-side usage
import { getFeatureToggleManager, isUnifiedWorkflowEnabled } from '@/lib/featureToggle';

const manager = getFeatureToggleManager();
const isEnabled = manager.isEnabled('unified_workflow_schema');

// Or using helper functions
const isEnabled = isUnifiedWorkflowEnabled();
```

```typescript
// Server-side usage (Supabase Edge Functions)
import { checkFeatureToggle, isUnifiedWorkflowReadEnabled } from '../_shared/feature-toggles.ts';

const isEnabled = checkFeatureToggle('unified_workflow_read');
// Or using helper functions
const isEnabled = isUnifiedWorkflowReadEnabled();
```

#### Available Feature Toggles

| Toggle Name | Description | Default | Environment Variable |
|-------------|-------------|---------|---------------------|
| `unified_workflow_schema` | Enable unified workflow schema | `true` | `VITE_UNIFIED_WORKFLOW_SCHEMA` |
| `unified_workflow_read` | Enable unified workflow reading | `true` | `VITE_UNIFIED_WORKFLOW_READ` |
| `unified_workflow_write` | Enable unified workflow writing | `true` | `VITE_UNIFIED_WORKFLOW_WRITE` |
| `unified_workflow_search` | Enable unified workflow search | `true` | `VITE_UNIFIED_WORKFLOW_SEARCH` |
| `unified_workflow_ai_generation` | Enable AI workflow generation | `true` | `VITE_UNIFIED_WORKFLOW_AI_GENERATION` |
| `unified_workflow_migration` | Enable workflow migration features | `false` | `VITE_UNIFIED_WORKFLOW_MIGRATION` |
| `unified_workflow_frontend` | Enable unified workflow frontend | `true` | `VITE_UNIFIED_WORKFLOW_FRONTEND` |
| `unified_workflow_analytics` | Enable workflow analytics | `false` | `VITE_UNIFIED_WORKFLOW_ANALYTICS` |

#### Boolean Environment Variable Format

The system supports various boolean formats for environment variables:

**Truthy values**: `true`, `1`, `yes`, `on`
**Falsy values**: `false`, `0`, `no`, `off`

Examples:
```bash
# All of these enable the feature
VITE_UNIFIED_WORKFLOW_SCHEMA=true
VITE_UNIFIED_WORKFLOW_SCHEMA=1
VITE_UNIFIED_WORKFLOW_SCHEMA=yes
VITE_UNIFIED_WORKFLOW_SCHEMA=on

# All of these disable the feature
VITE_UNIFIED_WORKFLOW_SCHEMA=false
VITE_UNIFIED_WORKFLOW_SCHEMA=0
VITE_UNIFIED_WORKFLOW_SCHEMA=no
VITE_UNIFIED_WORKFLOW_SCHEMA=off
```

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
