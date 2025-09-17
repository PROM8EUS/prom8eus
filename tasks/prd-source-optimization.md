# PRD – Source Optimization for Prom8eus (per create-prd.md)

**Project:** Prom8eus – Automation Workflow Discovery  
**Date:** September 2025  
**Owner:** André Sheydin

---

## 1. Introduction/Overview

Prom8eus analyzes user tasks and returns relevant solutions in two forms:  
1) deterministic workflows/automations and 2) AI agents (non‑deterministic, LLM‑powered).  
This PRD focuses on optimizing source ingestion, normalization, and matching for both solution types, plus targeted OpenAI usage to improve quality where heuristics are insufficient.

Outcome: a reliable, consistent solutions base (workflows + agents) with transparent metadata (complexity/capabilities, triggers, integrations, model/provider) to power decisions and CTAs (How‑to Implement | Request Implementation). MVP agent sources are limited to CrewAI examples and HuggingFace Spaces, with others earmarked for Phase 2.  
Note: The current implementation may be replaced in future phases; only the frontend UI component pattern (expandable Task Item) is kept as baseline.  
Much of the existing code and backend is experimental and can be fully refactored or replaced. Do not consider current implementations binding; prioritize clean, maintainable solutions even if this means overwriting prior experiments.

---

## 2. Goals

1. Integrate and stabilize prioritized sources for workflows and AI agents.  
2. Normalize and validate data for consistent display and matching across types.  
3. Use OpenAI only where it materially improves UX (task decomposition, enrichment).  
4. Maintain a lean, cost‑efficient, cache‑first architecture (Edge/DB/Client).  
5. Deliver measurable value: fast results, explainable scores, clear CTAs.

---

## 3. User Stories

- As a user, I want to see both automations and AI agents that fit my task so I can choose the best approach.  
- As a user, I want immediate visibility of key metadata (integrations/trigger/complexity for workflows; model/provider/capabilities for agents) to judge fit.  
- As an admin, I want to manage sources (both types), refresh caches, and see health/counts to ensure quality and availability.  
- As a user, I want to choose between self‑implementation (How‑to) and requesting implementation, based on effort and risk.  
- As a buyer, I want to understand trade‑offs between deterministic workflows and non‑deterministic agents (speed/reliability vs. adaptability).

---

## 4. Functional Requirements

1. Ingestion & Normalization  
   1.1 Workflows: ingest from n8n.io API and GitHub repositories (cache‑first, via Edge Functions).  
   1.2 AI Agents: ingest from limited MVP community catalogs/repos (CrewAI examples, HuggingFace Spaces filtered by tags such as `agents`, `autonomous`, and `crew` to avoid bulk or irrelevant imports); other sources like AgentGPT, SuperAGI marked for Phase 2. For HuggingFace Spaces, ingestion must include quality filters to only include projects with ≥5 stars OR updated within the last 12 months OR with at least 1 fork or open issue, and preferably ≥2 contributors AND evidence of active downloads/clones. Parse manifests/README to map into `AgentSolution`.  
   1.3 Unified solution schema with core mandatory fields: `id`, `source`, `title`, `summary`, `link`. For workflows: `category`, `integrations`, `complexity`. For agents: `model/provider`, `capabilities`. All other metadata optional with fallback `Unknown`. Licenses must be extracted and displayed in the detail modal when available; fallback to "Unknown".  
   1.4 Persist to Supabase cache (versioned) per source; build `all` union from per‑source caches.  
   1.5 Optional OpenAI enrichment (background) triggered on first import and optionally via Admin-Refresh to fill missing fields. Enrichment is mandatory for `summary` and `categories`, while `capabilities` remain optional. Agent capabilities should be standardized (e.g., `web_search`, `data_analysis`, `file_io`, `email_send`). Domain classification uses the 20-domain ontology above; the LLM must pick up to 3 domains from this list with confidences (see 2.5).

2. Matching (heuristic)  
   2.1 Shared alias dictionary for services/tools.  
   2.2 Workflow matching: category overlap, service overlap, trigger/action match.  
   2.3 Agent matching simplified to capability + domain tags with confidence tiers: Generalist | Specialist | Experimental. Workflows show numeric score (0–100); Agents show tier with disclaimer. Agent matching uses standardized capability tags, with categories mapped via the domain heuristics table.  
   2.4 Confidence score combines relevance and effort; expose reasoning chips in UI. Workflows show numeric score (0–100); Agents show tier (Generalist | Specialist | Experimental) with disclaimer chip ("Adaptive – outcomes may vary").  
   2.5 Domain classification (LLM-based, broad ontology)

   We use an LLM to assign each solution (workflow/agent) to a fixed, controlled ontology of **20 high-level domains**. The LLM must choose from this list only, returning up to 3 domains with confidences. Admin can override; fallback is "Other" (shown in UI).

   **Ontology (20 domains):**
   1) Healthcare & Medicine  
   2) Nursing & Care  
   3) Life Sciences & Biotech  
   4) Finance & Accounting  
   5) Marketing & Advertising  
   6) Sales & CRM  
   7) Human Resources & Recruiting  
   8) Education & Training  
   9) Legal & Compliance  
   10) IT & Software Development  
   11) DevOps & Cloud  
   12) Design & Creative  
   13) Manufacturing & Engineering  
   14) Energy & Utilities  
   15) Logistics & Supply Chain  
   16) Retail & E-Commerce  
   17) Real Estate & Property  
   18) Government & Public Sector  
   19) Customer Support & Service  
   20) Research & Data Science  
   21) Other (fallback only; shown explicitly in UI)

   **Mapping process (LLM):**
   - Inputs: title, summary, (optional) README snippet / node labels.  
   - Output JSON: `[{ "domain": <one of the 20>, "confidence": 0..1 }, ...]` (max 3 entries).  
   - Strict label enforcement: Only labels from the ontology are allowed.  
   - Confidence threshold: store all confidences; UI shows only the top domain, others via tooltip.  
   - Trigger: runs during enrichment on first import and on Admin-Refresh.  
   - Caching: hash(title+summary+source_id) → store result; reuse unless source document hash changes.  
   - Admin override: Admin-UI can edit/replace domains; overrides are preserved across refreshes.

   **Storage:**
   - `domains` (string[]) – ordered by confidence.  
   - `domain_confidences` (float[]) – same order as `domains`.  
   - `domain_origin` (enum: "llm" | "admin" | "mixed").

3. UI  
   3.1 Task input, automation score, subtask list (LLM output).  
   3.2 Solution cards with type badge clearly differentiating: Workflows = Reliable/Deterministic badge; Agents = Adaptive/Variable badge with disclaimer chip ("Adaptive – outcomes may vary"). Type‑specific fields (complexity/integrations vs model/provider/capabilities). Show the top domain badge on cards; additional domains (if any) appear in a tooltip or popover.  
   3.3 Detail modal with prerequisites, setup effort, deep links to source.  
   3.4 CTAs: How‑to Implement | Request Implementation; download/apply when available.  
       - Mandatory displayed fields for How-to Implement: Prerequisites, Source Link, Trigger type, Estimated setup effort.  
       - If a README is available, combine JSON nodes and README for enrichment; if not, use JSON nodes only. Extraction of step-by-step setup instructions from workflow JSON/README is optional stretch goal; a simple LLM-prompt pipeline will be used to generate 3–5 setup steps. Generated setup steps must be validated via simple smoke-tests or pilot user feedback before being shown broadly. Generated setup steps must be validated by the Admin before being shown broadly. Pilot-user feedback should be collected and documented in the Admin-UI alongside Admin validation to refine generated steps over time. If fewer than 2 valid setup steps can be extracted, the extraction is considered failed and only mandatory fields will be displayed. If step extraction fails, fallback to mandatory fields only (Prerequisites, Source Link, Trigger type, Estimated setup effort).

       Validation criteria: At least 3 setup steps, each containing a clear action and tool reference; no empty or placeholder steps. Steps failing these criteria are rejected.

       **Request Implementation (Lead Funnel):**  
       - Users can submit an implementation request via a form.  
       - Collected fields: Name, Email, Company (optional), preferred tools (n8n, Zapier, etc.), desired timeline (mandatory), budget range (mandatory, indicative pricing suggested).  
       - Automatically attached: Task description, subtasks, automation score, and selected Workflow/Agent IDs.  
       - Submission flow: sends email to `service@prom8.eus` (MVP).  
       - All requests must also be logged into the Supabase database (`implementation_requests` table) with full payload (form fields + attached task context). This ensures funnel tracking and future CRM integration.  
       - Auto-reply confirmation sent to user upon submission.  
       - Admin receives context-rich request by email, enabling follow-up with estimate and proposal.

4. Admin  
   4.1 Source management for both types (status, counts, last updated) with health checks.  
   4.2 Manual refresh per source; progress/alerts.  
   4.3 Cache analytics for MVP limited to counts, errors, and last updated timestamps with a "Refresh now" button; live polling deferred to Phase 2.  
   4.4 Admin validation workflow for generated setup steps and domain overrides.  
   4.5 Pilot user feedback collection integrated into Admin-UI to refine setup steps and enrichments.

---

## 5. Non‑Goals (Out of Scope)

- Full semantic embeddings/vector search (only optional in Edge pipeline). Deferred but planned as an add-on for Phase 2 once dataset grows.  
- ROI calculators.  
- Additional ecosystems (Zapier, Make, Reddit) for MVP.  
- Payments, ratings, reviews.

---

## 5a. Monetization Approach (MVP and beyond)

- **MVP:** Each implementation request is handled directly by Prom8eus (currently structured as a GbR). The team responds with an offer for implementing individual workflows or agents, and issues an invoice upon successful delivery.  
- **Phase 2:** Streamlined offering and support; possibility to bundle multiple implementations and introduce subscriptions that include implementation + support services.  
- **Phase 3:** Subscription model with recurring revenue, where ongoing costs for customers are lower than the time savings achieved by automation and AI agents.

---

## 6. Design Considerations (Optional)

- Card layout with clear hierarchy (title, short description, key metadata).  
- Removed right‑side category badge; keep consistent complexity/capability indicators.  
- CreatorBadge uses Gravatar only for valid emails; otherwise fallback.

---

## 7. Technical Considerations (Optional)

- Supabase Edge Functions for CORS/rate‑limit‑safe ingestion (GitHub, n8n.io, agent catalogs).  
- Server‑side cache (`workflow_cache` union) with browser read‑first paths.  
- Null‑safe UI and guarded network paths to prevent timeouts; no browser DB writes.  
- Scaling target for MVP: ≥1,000 workflows and ≥100 agents normalized with core metadata; larger scale (≥10k workflows and ≥1k agents) planned for Phase 2.  
- Maintain an `ontology_domains` table (id, label, order, is_fallback) and reference it during enrichment; prevent drift by rejecting non-ontology labels at write time.  
- Sharding via `source LIKE 'x#%'` if needed.  
- Maintain `implementation_requests` table in Supabase (id, user_name, user_email, company, preferred_tools, timeline, budget_range, task_context, created_at, status). All requests logged here in addition to email notifications.

---

## 8. Success Metrics

- ≥2 workflow sources and 1–2 agent catalogs (CrewAI examples, HuggingFace Spaces filtered by tags) integrated end‑to‑end for MVP.  
- ≥1,000 workflows and ≥100 agents normalized with core metadata.  
- ≥70% of user tasks return at least one solution (workflow or agent).  
- <5% ingestion/enrichment failures.  
- ≥20% CTA click‑through rate.  
- ≥50% task analyses served from cache.  
- ≥90% of solutions have at least one non-"Other" domain assigned by the LLM (post-enrichment).  
- ≥30% of implementation requests convert into paid projects (tracked via `implementation_requests` DB table).

---

## 9. Decisions

- Licenses must be extracted and displayed in detail modal; README should only be linked, not inline rendered, in MVP.  
- Confidence visualization: Workflows show numeric score (0–100); Agents show tier (Generalist | Specialist | Experimental) with disclaimer chip ("Adaptive – outcomes may vary").

---

## 10. Open Questions

1. Which additional agent catalogs (e.g., AgentGPT, SuperAGI) should be prioritized for Phase 2?  
   - SuperAGI and LangChain Hub are prioritized for Phase 2; AgentGPT is optional.  
2. Which additional domains should be prioritized in Phase 2 (e.g., Finance, Marketing, IT)? Domain expansion is the most critical lever for user growth and must be prioritized above live update mechanisms.  
3. In Phase 2, decide whether live updates are implemented via polling or event-based mechanisms; this decision will be based on a cost/benefit analysis (polling vs. event-based).

*Note:* Phase 2 prioritization should weigh additional domains higher (Finance, Marketing, IT) compared to live-update method decisions.

---

## 11. Roadmap (informational)

Execution is lean and iterative; development is led by a single developer using Cursor. Sprint boundaries are flexible and can overlap or be adjusted by the single developer.

Sprint 1a – Ingestion + Schema  
- n8n.io + GitHub (Edge), normalization, caching; optional enrichment.  
- Agent catalog discovery (formats) and mapping to `AgentSolution` (CrewAI and HF Spaces filtered by tags for MVP).

Sprint 1b – Matching + LLM Analysis  
- LLM analysis (subtasks/score), alias dictionary, per‑type matching heuristics simplified for agents.

Sprint 2 – UI  
- Task input + score, dual‑type solution cards + modal with clear badges and disclaimers, CTAs, type filters.  
- Expand How-to Implement with mandatory fields (Prerequisites, Source Link, Trigger type, Estimated setup effort); optional stretch goal for step-by-step setup extraction using a simple LLM-prompt pipeline to generate 3–5 steps.

Sprint 3 – Admin  
- Source management (both types), basic cache analytics (counts, errors, last updated), health.  
- Admin validation workflows and pilot user feedback integration.

---

## 12. Risks & Mitigation

**Product Risks** (UX, expectation management):  
- Over‑promising automation (Medium).  
- Single-developer dependency: reliance on one developer may slow execution or block progress if unavailable (Medium).

**Technical Risks** (scaling, cost, compliance):  
- LLM cost/latency (High)  
- Heterogeneous metadata (Medium)  
- License/legal (Low)  

Admin/Developer remain owners for MVP but ownership may be reallocated as the team grows. 
Thomas Fritsch is responsible for workflow and agent setup as well as handling incoming implementation requests.
