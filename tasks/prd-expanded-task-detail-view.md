# PRD: Expanded Task Detail View (Optimized, v1.4)

## 1. Introduction/Overview

The expanded task detail view provides users with **concrete automation solutions** for their analyzed tasks.  
It extends the existing task analysis interface by showing **implementation options (Workflows, Agents, LLMs)** below the header.  

**Goal:** Give users a clear, action-oriented overview with immediate implementation or next steps, while keeping the MVP scope lean.  

---

## 2. Goals

1. Provide concrete solution approaches (Workflows, Agents, LLMs)  
2. Maximize implementability (downloads, prompts, service requests)  
3. Ensure user-friendliness (intuitive sidebar + tabs)  
4. Demonstrate value (time & cost savings, ROI incl. setup cost)  
5. Keep MVP lean but scalable (examples → AI-generated → library)  

---

## 3. User Stories

### Business Users
- **Manager:** Compare automation approaches and choose best for team  
- **Analyst:** Download workflow blueprints for company use  
- **Project Manager:** See savings + setup costs to calculate ROI  

### Technical Users
- **Developer:** Download & import n8n/Zapier workflows  
- **DevOps Engineer:** Adapt agent configs for infrastructure  
- **Automation Expert:** Copy LLM prompts and test them  

### Mixed Users
- **Entrepreneur:** Choose between simple LLM vs. complex workflow solution  
- **Consultant:** Present clients with concrete proposals including next steps  

---

## 4. Functional Requirements (Prioritized)

### 4.1 Layout & Navigation (P1)
- Two-column layout:  
  - Left: Subtask navigation  
  - Right: Solution tabs  
- Tabs: **Workflows | Agents | LLMs**  
- Default tab: based on highest automation potential  
- Responsive design: desktop + tablet  

### 4.2 Subtask Navigation (P1)
- Show all subtasks with automation potential  
- Option **“Alle (Komplettlösungen)”** for overarching solutions  
- Active selection highlighted  
- Scrollable list for many subtasks  

### 4.3 Business Case Block (P1)
- Show **current vs. automated effort** (hours/month)  
- Show **monetary value** (€/month), editable hourly rate  
- Add **setup cost estimate** (auto-calculated based on complexity: Low=200€, Medium=500€, High=1000€)  
- Show **ROI indicator** = break-even point in months (setup cost only, no ongoing fees)  

### 4.4 Workflows Tab
- **P1:**  
  - Show list of workflows per subtask (prioritize n8n)  
  - Display name, description, steps, status (**generated**, **verified**, **fallback**)  
  - Actions:  
    - [Einrichtung anfragen]  
    - [Download Blueprint] (without syntax validation in MVP)  
  - Auto-generate workflow if no library match found  
  - Show **status badge** for source transparency  
- **P2:**  
  - Syntax validation before download  
  - Workflow parameter adjustment  

### 4.5 Agents Tab
- **P1:**  
  - List of agents: name, description, functions, tools, status  
  - Action: [Agent einrichten lassen]  
  - Clear function lists (bullet points)  
- **P2:**  
  - [Config anzeigen]  
  - Agent parameter adjustment  

### 4.6 LLMs Tab
- **P1:**  
  - Optimized prompts for different LLM services  
  - Actions: [Prompt kopieren], [In ChatGPT öffnen], [In Claude öffnen]  
  - Show prompt preview (formal, creative style)  
- **P2:**  
  - Alternative prompt sets (user-configurable)  

### 4.7 Interaction & Actions
- **P1:** Einrichtung anfragen, Blueprint download (no validation), Prompt kopieren, External links  
- **P2:** Config anzeigen, Parameter adjustment, Download with validation  

---

## 5. Data Sources & Generation

- **Priority:** Library match → AI generation → Static fallback  
- **Validation:** Only basic JSON structure check (P2, not MVP)  
- **Transparency:** Badge for AI-generated / verified / fallback  
- **Caching:** Generated solutions stored and reused  
- **Timeout:** 3-second AI generation timeout for MVP  
- **Multi-language:** Generate all content (workflows, agents, prompts) in both DE and EN  
- **API Priority:** Focus on **n8n** workflows first  

---

## 6. Non-Goals (MVP Exclusions)

- No full workflow IDE  
- No live monitoring  
- No workflow execution in-app  
- No model training  
- No multi-tenant isolation  

---

## 7. Design & UX Guidelines

- Consistent icons (Workflows, Agents, LLMs)  
- Clear primary/secondary CTAs (max 2 per card)  
- ROI block at top of detail view  
- Loading spinners + skeletons for AI generation  
- WCAG 2.1 AA accessibility  

---

## 8. Technical Considerations

- **Frontend:** React components, state for subtask/tab  
- **Backend:** OpenAI/Claude APIs, Redis cache, Rate limits  
- **Performance:** Lazy loading, debouncing, CDN  

---

## 9. Economic API Strategy

- **Caching:** Store & reuse generated content (TTL)  
- **Limits:**  
  - Anonymous: 1 analysis/day  
  - Free registered: 3/day  
  - Paid: unlimited  
- **Tiered Models:**  
  - Budget (Mistral/GPT-4o-mini) → Subtask breakdown  
  - Premium (GPT-4.1 Turbo/Claude) → Workflows/Agents  
- **Monitoring:** Token tracking & cost alerts  

---

## 10. Success Metrics

- **Engagement:**  
  - 70% switch tabs  
  - 40% interact with at least one solution  
  - 3+ min session duration  

- **Conversion:**  
  - 15% submit setup requests  
  - 60% copy at least one prompt  
  - 30% download at least one blueprint  

- **Quality:**  
  - 80% workflows successfully imported  
  - ≥4.5 satisfaction in feedback  
  - 25% fewer “how to automate” support requests  

---

## 11. MVP Scope – To-Do List (P1 Features)

**Layout & Navigation**
- [ ] Implement two-column layout (Sidebar + Tabs)  
- [ ] Responsive design for desktop/tablet  
- [ ] Default tab = highest automation potential  

**Subtask Sidebar**
- [ ] Show all subtasks with "Alle (Komplettlösungen)" option  
- [ ] Highlight active subtask  
- [ ] Add scroll support  

**Business Case Block**
- [ ] Show hours saved + money saved  
- [ ] Editable hourly rate  
- [ ] Auto-calculate setup cost (200/500/1000 € tiers)  
- [ ] Show ROI = break-even point  

**Workflows**
- [ ] Show list of workflows (name, desc, steps, status)  
- [ ] Actions: [Einrichtung anfragen], [Download Blueprint] (no validation)  
- [ ] Auto-generate workflow if no match  
- [ ] Show status badge  

**Agents**
- [ ] Show agent cards with description, functions, tools  
- [ ] Action: [Agent einrichten lassen]  

**LLMs**
- [ ] Show optimized prompts per subtask  
- [ ] Actions: [Prompt kopieren], [In ChatGPT öffnen], [In Claude öffnen]  
- [ ] Show prompt previews  

**General**
- [ ] Add transparency badges (AI-generated / verified / fallback)  
- [ ] Implement caching & 3s timeout for AI generation  
- [ ] Multi-language generation (DE & EN)  

---

## 12. Phase 2 Features (P2, after MVP)

- Workflow downloads with **syntax validation**  
- Agent/Workflow config display & adjustment  
- Alternative prompt sets (configurable)  
- Advanced ROI (include ongoing costs)  
- User feedback mechanism  
- Library of verified workflows  
- Versioning & update tracking  

---

**Version:** 1.4 (MVP includes Blueprint Download)  
**Status:** Ready for Implementation  
**Next Steps:** UI mockups + development tickets