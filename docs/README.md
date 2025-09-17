# Prom8eus Documentation

## 📚 Documentation Overview

This directory contains comprehensive documentation for the Prom8eus dual-type solution platform, which supports both **Workflows** and **AI Agents** with a unified SolutionIndex model.

## 🎯 Core Documentation

### Implementation Status
- **[`stand-implementierung-loesungen-vorschlaege.md`](./stand-implementierung-loesungen-vorschlaege.md)** - Complete implementation status and dual-type model documentation
- **[`recommendations-mvp.md`](./recommendations-mvp.md)** - MVP recommendations and implementation guide

### Technical Integration
- **[`mcp-supabase-setup.md`](./mcp-supabase-setup.md)** - Supabase MCP setup and configuration
- **[`agent-api-integration.md`](./agent-api-integration.md)** - AI agent API integration guide
- **[`sharing-system.md`](./sharing-system.md)** - Cross-user sharing system documentation

## 🔧 Technical Architecture

### Dual-Type Solution Model
- **Unified SolutionIndex**: Single interface for both Workflows and AI Agents
- **Type-Specific Fields**: Workflow-specific (category, integrations, complexity) and Agent-specific (model, provider, capabilities)
- **Common Core Fields**: id, source, title, summary, link, type

### Key Features
- **LLM-Powered Enrichment**: Automatic data enhancement with GPT-4o-mini
- **Health Monitoring**: Comprehensive source health checks and recovery
- **Admin Workflows**: Validation queues, feedback systems, and management interfaces
- **Scoring Systems**: Workflow scores (0-100) and Agent tiers (Generalist/Specialist/Experimental)

## 📊 Solution Sources

### Workflow Sources
- **GitHub Community** (~2,056 workflows) - n8n Community Workflows
- **Awesome n8n Templates** (~150 workflows) - Curated Community Templates  
- **n8n.io Official** (~5,496 workflows) - Official n8n Template Gallery
- **AI-Enhanced** (~150 workflows) - AI-Augmented Free Templates

### AI Agent Sources
- **CrewAI Examples** (~50 agents) - CrewAI Framework Examples
- **HuggingFace Spaces** (~200 agents) - AI Agent Spaces
- **GitHub Agents** (~100 agents) - GitHub AI Agent Repositories

## 🏢 Business Domains

The platform supports **20 predefined business domains**:
1. Healthcare & Medicine
2. Nursing & Care
3. Life Sciences & Biotech
4. Finance & Accounting
5. Marketing & Advertising
6. Sales & CRM
7. Human Resources & Recruiting
8. Education & Training
9. Legal & Compliance
10. IT & Software Development
11. DevOps & Cloud
12. Design & Creative
13. E-commerce & Retail
14. Manufacturing & Supply Chain
15. Real Estate & Property
16. Travel & Hospitality
17. Media & Entertainment
18. Non-profit & Social Impact
19. Government & Public Sector
20. Research & Development

## 🚀 Quick Start

1. **For Users**: Enter job description → Automatic industry detection → Task extraction → Solution recommendations
2. **For Administrators**: Enhanced source management → Health monitoring → Validation workflows → Feedback analytics
3. **For Developers**: Unified API → Type-safe operations → Enrichment pipeline → Health monitoring

## 📁 Archive

Obsolete documentation has been moved to the [`archive/`](./archive/) directory for reference.

## 🔗 Related Files

- **Main README**: [`../README.md`](../README.md) - Project overview and setup
- **Task Management**: [`../tasks/tasks-prd-source-optimization.md`](../tasks/tasks-prd-source-optimization.md) - Current task status
- **Optimization Guides**: 
  - [`../WORKFLOW_OPTIMIZATION.md`](../WORKFLOW_OPTIMIZATION.md) - Dual-type solution optimization
  - [`../TOKEN_OPTIMIZATION.md`](../TOKEN_OPTIMIZATION.md) - OpenAI token optimization
  - [`../LLM_ANALYSIS.md`](../LLM_ANALYSIS.md) - LLM analysis for dual-type matching
  - [`../WORKFLOW_EXAMPLES.md`](../WORKFLOW_EXAMPLES.md) - Solution templates and ROI analysis

---

*Last updated: January 2025*
*Version: Dual-Type Solution Model v1.0*
