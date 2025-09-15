import React, { useState, useEffect, useMemo } from 'react';
import { Solution, SolutionType } from '../types/solutions';
import SolutionCard from './SolutionCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SolutionDetailModal from './SolutionDetailModal';
import SolutionIcon from './ui/SolutionIcon';
import { workflowIndexer } from '@/lib/workflowIndexer';
import { rerankWorkflows } from '@/lib/aiRerank';
import { recommendWorkflows } from '@/lib/recommendations/client';

interface SolutionsTabProps {
  taskText?: string;
  lang?: 'de' | 'en';
  selectedApplications?: string[];
  onSolutionsLoaded?: (count: number) => void;
  subtasks?: Array<{
    id: string;
    name: string;
    businessDomain: string;
    automationPotential: number;
    keywords: string[];
    category: string;
  }>;
  onSolutionSelect?: (solution: Solution) => void;
}

export default function SolutionsTab({ 
  taskText,
  lang = 'de',
  selectedApplications = [],
  onSolutionsLoaded,
  subtasks = [],
  onSolutionSelect 
}: SolutionsTabProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'workflows' | 'agents'>('all');
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [solutions, setSolutions] = useState<Solution[]>([]);

  useEffect(() => {
    loadSolutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskText, JSON.stringify(selectedApplications), JSON.stringify(subtasks)]);

  useEffect(() => {
    if (solutions.length > 0 && onSolutionsLoaded) {
      onSolutionsLoaded(solutions.length);
    }
  }, [solutions, onSolutionsLoaded]);

  const normalizeTool = (s: string) => s.toLowerCase();
  const tokenize = (t: string) => (t || '').toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 3);
  const buildKeywordSet = (text: string, subs: typeof subtasks) => {
    const base = tokenize(text);
    const sub = (subs || []).flatMap(s => tokenize(s.name).concat((s.keywords || []).map(k => k.toLowerCase())));
    return new Set([...base, ...sub]);
  };
  const buildPerSubtaskKeywords = (subs: typeof subtasks) =>
    (subs || []).map(s => new Set(tokenize(s.name).concat((s.keywords || []).map(k => k.toLowerCase()))));
  const haystack = (w: any) => `${(w.name||'').toLowerCase()} ${(w.description||'').toLowerCase()} ${(w.tags||[]).join(' ').toLowerCase()} ${(w.integrations||[]).join(' ').toLowerCase()}`;
  const countMatches = (text: string, kws: Set<string>) => {
    let hits = 0; kws.forEach(k => { if (text.includes(k)) hits++; });
    return hits;
  };

  // Infer preferred developer integrations from subtasks
  const inferPreferredIntegrations = (subs: typeof subtasks): string[] => {
    const tokens = new Set<string>();
    (subs || []).forEach(s => {
      tokenize(s.name).forEach(t => tokens.add(t));
      (s.keywords || []).forEach(k => tokens.add(k.toLowerCase()));
    });
    const add = (arr: string[], v: string) => { if (!arr.includes(v)) arr.push(v); };
    const preferred: string[] = [];
    const has = (t: string) => tokens.has(t);
    if (has('react') || has('frontend') || has('web')) {
      add(preferred, 'HTTP Request');
      add(preferred, 'Webhook');
      add(preferred, 'GitHub');
      add(preferred, 'GraphQL');
    }
    if (has('node') || has('backend') || has('api') || has('server')) {
      add(preferred, 'HTTP Request');
      add(preferred, 'Webhook');
      add(preferred, 'PostgreSQL');
      add(preferred, 'MySQL');
      add(preferred, 'MongoDB');
      add(preferred, 'GitHub');
    }
    if (has('deploy') || has('vercel') || has('netlify')) {
      add(preferred, 'GitHub');
    }
    return preferred;
  };

  const loadSolutions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = [taskText || '', ...(subtasks || []).map(s => s.name)].filter(Boolean).join(' ');
      const apps = (selectedApplications || []).map(normalizeTool);
      // Derive more tools from subtasks (heuristic extraction)
      const subtaskTools = new Set<string>();
      (subtasks || []).forEach(s => {
        (s.keywords || []).forEach(k => subtaskTools.add(normalizeTool(k)));
        tokenize(s.name).forEach(t => subtaskTools.add(normalizeTool(t)));
      });
      const wantedTools = new Set<string>([...apps, ...Array.from(subtaskTools)]);
      const kw = buildKeywordSet(q, subtasks);
      const perSubKw = buildPerSubtaskKeywords(subtasks);
      const inferred = inferPreferredIntegrations(subtasks);

      // First try server recommendation pipeline (Edge Function)
      try {
        const efSolutions = await recommendWorkflows({
          taskText: taskText || '',
          subtasks: (subtasks || []).map(s => ({ id: s.id, name: s.name, keywords: s.keywords })),
          selectedApplications,
          flags: { topK: 6 }
        });
        if (efSolutions && efSolutions.length > 0) {
          const mappedEF = efSolutions.map((s, idx) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            type: 'workflow' as const,
            category: 'Development & DevOps' as any,
            subcategories: [],
            difficulty: 'Intermediate' as any,
            setupTime: 'Medium' as any,
            deployment: 'Cloud' as any,
            status: 'Active' as any,
            tags: [],
            automationPotential: 70,
            estimatedROI: '—',
            timeToValue: '—',
            implementationPriority: 'Medium' as any,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0',
            author: s.authorName || 'Community',
            authorUsername: undefined,
            authorAvatarUrl: s.authorAvatarUrl,
            authorEmail: undefined, // Edge Function doesn't provide email yet
            authorVerified: s.authorVerified,
            documentationUrl: undefined,
            demoUrl: undefined,
            githubUrl: undefined,
            pricing: 'Free' as any,
            requirements: [],
            useCases: [],
            integrations: (s.integrations || []).map(x => ({ platform: x, type: 'API' as any, description: '', setupComplexity: 'Low' as any, apiKeyRequired: false })),
            metrics: { usageCount: 0, successRate: 95, averageExecutionTime: 30, errorRate: 2, userRating: 4.4, reviewCount: 0, lastUsed: new Date(), performanceScore: 80 },
            workflow: { id: s.id, name: s.name, description: s.description || '', category: 'General', difficulty: 'Medium' as any, estimatedTime: '—', estimatedCost: '—', nodes: 0, connections: 0, downloads: 0, rating: 4.4, createdAt: new Date().toISOString(), url: '', jsonUrl: '', active: true, triggerType: 'Manual', integrations: s.integrations || [], author: s.authorName || 'Community' } as any,
            workflowMetadata: { nodeCount: 0, triggerType: 'Manual', executionTime: '—', complexity: 'Moderate' as any, dependencies: [], estimatedExecutionTime: '—' }
          }));
          setSolutions(mappedEF);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('[Solutions] recommend-workflows failed, falling back to local pipeline', e);
      }

      // Fallback: local pipeline from cache
      // primary fetch: broad pool from unified cache (avoid prefiltering by q)
      let searchParams: any = { source: 'all', limit: 1200, offset: 0 };
      const wantedCombined = new Set<string>([...Array.from(wantedTools), ...inferred.map(normalizeTool)]);
      if (wantedCombined.size > 0) searchParams.integrations = Array.from(wantedCombined);
      let { workflows } = await workflowIndexer.searchWorkflows(searchParams);

      // secondary fetch: query-scoped pool driven by task/subtasks
      let scoped: any[] = [];
      try {
        const qRes = await workflowIndexer.searchWorkflows({ source: 'all', q, limit: 1200, offset: 0 });
        scoped = qRes.workflows || [];
      } catch {}

      // choose candidate base: prefer scoped if it has signal
      let basePool: any[] = (scoped && scoped.length >= 80) ? scoped : workflows;
      if ((!basePool || basePool.length === 0) && (workflows && workflows.length > 0)) basePool = workflows;

      if ((!basePool || basePool.length === 0)) {
        console.info('[Solutions] No cached results. Forcing refresh from sources...');
        try { await workflowIndexer.forceRefreshWorkflows('github'); } catch (e) { console.warn('[Solutions] GitHub refresh failed', e); }
        try { await workflowIndexer.forceRefreshWorkflows('n8n.io'); } catch (e) { console.warn('[Solutions] n8n.io refresh failed', e); }
        const retry = await workflowIndexer.searchWorkflows(searchParams);
        basePool = retry.workflows;
      }

      // strict prefilter: workflow must match multiple subtasks
      const minSubtasks = Math.max(1, Math.ceil((perSubKw.length || 1) * 0.4));
      const scored = (basePool || []).map((w: any) => {
        const text = haystack(w);
        const subMatches = perSubKw.map(set => countMatches(text, set) > 0 ? 1 : 0);
        const matchedSubtasks = subMatches.reduce((a, b) => a + b, 0);
        const strongHits = countMatches(text, kw);
        // Integration/trigger overlap boost
        const have = new Set<string>((w.integrations || []).map((x: string) => normalizeTool(x)));
        let toolOverlap = 0; Array.from(wantedCombined).forEach(t => { if (have.has(t)) toolOverlap++; });
        const triggerBonus = ((w.triggerType || '').toString().toLowerCase().includes('webhook') && Array.from(wantedTools).includes('webhook')) ? 1 : 0;
        const score = matchedSubtasks * 14 + strongHits + toolOverlap * 8 + triggerBonus * 3;
        return { w, matchedSubtasks, strongHits, score };
      });
      // Require at least minimal overlap with preferred integrations if available
      if (wantedCombined.size > 0) {
        const wc = Array.from(wantedCombined);
        const hasOverlap = (w: any) => (w.integrations || []).some((x: string) => wc.includes(normalizeTool(x)));
        basePool = (scored.map(s => s.w)).filter(hasOverlap);
      }
      let candidates = scored
        .filter(s => s.matchedSubtasks >= minSubtasks)
        .sort((a, b) => b.score - a.score)
        .slice(0, 400)
        .map(s => s.w);
      // If nothing passes, relax to at least one subtask match
      if (candidates.length === 0) {
        candidates = scored
          .filter(s => s.matchedSubtasks >= 1)
          .sort((a, b) => b.score - a.score)
          .slice(0, 400)
          .map(s => s.w);
      }
      if (candidates.length === 0) candidates = basePool;

      // per-source merge fallback if still empty or very small
      if (!candidates || candidates.length < 10) {
        console.info('[Solutions] Merging per-source pools as fallback');
        const [gh, n8n] = await Promise.all([
          workflowIndexer.searchWorkflows({ source: 'github', limit: 2000, offset: 0 }),
          workflowIndexer.searchWorkflows({ source: 'n8n.io', limit: 6000, offset: 0 })
        ]);
        const merged = [...(gh?.workflows || []), ...(n8n?.workflows || [])];
        const seen = new Set<string>();
        const rescored = merged.filter((w: any) => {
          const key = String((w as any).id || (w as any).filename || (w as any).name);
          if (seen.has(key)) return false; seen.add(key);
          const m = perSubKw.map(set => countMatches(haystack(w), set) > 0 ? 1 : 0);
          return m.reduce((a,b)=>a+b,0) >= 1;
        });
        candidates = rescored.slice(0, 600);
        if (candidates.length < 30) candidates = merged; // last resort
      }

      // Per-subtask recommendation: get top items per subtask, then rerank union to 6
      let unionSet: any[] = [];
      const unionSeen = new Set<string>();
      for (const s of (subtasks || [])) {
        const sKw = new Set(tokenize(s.name).concat((s.keywords || []).map((k: string) => k.toLowerCase())));
        const subCandidates = (candidates || []).filter((w: any) => countMatches(haystack(w), sKw) > 0);
        if (subCandidates.length === 0) continue;
        const subR = await rerankWorkflows(s.name, subCandidates as any, selectedApplications || [], {
          subtasks: [s.name],
          diversify: true,
          topK: Math.min(3, subCandidates.length)
        });
        for (const r of subR) {
          const key = String((r.workflow as any).id || (r.workflow as any).filename || (r.workflow as any).name);
          if (unionSeen.has(key)) continue; unionSeen.add(key); unionSet.push(r.workflow);
        }
        if (unionSet.length >= 10) break; // cap to keep fast
      }
      // If union still small, backfill from global candidates
      if (unionSet.length < 6) {
        const backfill = await rerankWorkflows(q, candidates as any, selectedApplications || [], {
          subtasks: (subtasks || []).map(s => s.name),
          diversify: true,
          topK: Math.min(12, (candidates as any[]).length)
        });
        for (const r of backfill) {
          const key = String((r.workflow as any).id || (r.workflow as any).filename || (r.workflow as any).name);
          if (unionSeen.has(key)) continue; unionSeen.add(key); unionSet.push(r.workflow);
          if (unionSet.length >= 12) break;
        }
      }
      // Final rerank across union to pick most relevant 6
      const finalR = await rerankWorkflows(q, unionSet as any, selectedApplications || [], {
        subtasks: (subtasks || []).map(s => s.name),
        diversify: true,
        topK: Math.min(6, unionSet.length)
      });
      const top = finalR.map(r => r.workflow);

      // map to Solution type (workflow solutions)
      const mapped: Solution[] = top.map((w, idx) => ({
        id: String(w.id ?? idx),
        name: w.name || 'n8n Workflow',
        description: w.description || '',
        type: 'workflow',
        category: 'Development & DevOps',
        subcategories: [],
        difficulty: (w as any).complexity === 'High' ? 'Advanced' : (w as any).complexity === 'Low' ? 'Beginner' : 'Intermediate',
        setupTime: 'Medium',
        deployment: 'Cloud',
        status: (w as any).active ? 'Active' : 'Inactive',
        tags: (w as any).tags || [],
        automationPotential: Math.min(95, Math.max(40, ((w as any).nodeCount || (w as any).nodes || 0) * 4 + (w.integrations?.length || 0) * 3)),
        estimatedROI: '—',
        timeToValue: '—',
        implementationPriority: 'Medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        author: (w as any).authorName || (w as any).authorUsername || 'Community',
        authorUsername: (w as any).authorUsername,
        authorAvatarUrl: (w as any).authorAvatar,
        authorEmail: (w as any).authorUsername, // Use username as potential email
        authorVerified: (w as any).authorVerified,
        documentationUrl: undefined,
        demoUrl: undefined,
        githubUrl: undefined,
        pricing: 'Free',
        requirements: [],
        useCases: [],
        integrations: (w.integrations || []).map((x: string) => ({ platform: x, type: 'API', description: '', setupComplexity: 'Low', apiKeyRequired: false })),
        metrics: {
          usageCount: 0,
          successRate: 95,
          averageExecutionTime: 30,
          errorRate: 2,
          userRating: 4.4,
          reviewCount: 0,
          lastUsed: new Date(),
          performanceScore: 80
        },
        workflow: {
          id: String(w.id ?? idx),
          name: w.name || '',
          description: w.description || '',
          category: (w as any).category || 'General',
          difficulty: ((w as any).complexity === 'High' ? 'Hard' : (w as any).complexity === 'Low' ? 'Easy' : 'Medium') as any,
          estimatedTime: '—',
          estimatedCost: '—',
          nodes: (w as any).nodeCount || (w as any).nodes || 0,
          connections: 0,
          downloads: 0,
          rating: 4.4,
          createdAt: (w as any).analyzedAt || new Date().toISOString(),
          url: '',
          jsonUrl: '',
          active: !!(w as any).active,
          triggerType: (w as any).triggerType || 'Manual',
          integrations: w.integrations || [],
          author: (w as any).authorName || (w as any).authorUsername || 'Community'
        } as any,
        workflowMetadata: {
          nodeCount: (w as any).nodeCount || (w as any).nodes || 0,
          triggerType: (w as any).triggerType || 'Manual',
          executionTime: '—',
          complexity: ((w as any).complexity === 'High' ? 'Complex' : (w as any).complexity === 'Low' ? 'Simple' : 'Moderate') as any,
          dependencies: [],
          estimatedExecutionTime: '—'
        }
      }));

      setSolutions(mapped);
    } catch (err) {
      setError('Failed to load solutions');
      console.error('Error loading solutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSolutions = useMemo(() => {
    let filtered = solutions;
    if (activeTab === 'workflows') {
      filtered = filtered.filter(solution => solution.type === 'workflow');
    } else if (activeTab === 'agents') {
      filtered = filtered.filter(solution => solution.type === 'agent');
    }
    return filtered;
  }, [solutions, activeTab]);

  const handleSolutionSelect = (solution: Solution) => {
    setSelectedSolution(solution);
    setShowSolutionModal(true);
    onSolutionSelect?.(solution);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {lang === 'de' ? 'Lade Lösungen...' : 'Loading solutions...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'all' 
                ? 'text-primary border-b-2 border-primary pb-1' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'de' ? 'Alle' : 'All'} {solutions.length}
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'workflows' 
                ? 'text-primary border-b-2 border-primary pb-1' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SolutionIcon type="workflow" className="h-4 w-4" />
            {lang === 'de' ? 'Workflows' : 'Workflows'} {solutions.filter(s => s.type === 'workflow').length}
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'agents' 
                ? 'text-primary border-b-2 border-primary pb-1' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SolutionIcon type="agent" className="h-4 w-4" />
            {lang === 'de' ? 'KI-Agenten' : 'AI Agents'} {solutions.filter(s => s.type === 'agent').length}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSolutions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {lang === 'de' 
                ? 'Keine Lösungen gefunden.'
                : 'No solutions found.'
              }
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal scroller with chevrons */}
            <button
              type="button"
              aria-label="scroll left"
              className="hidden md:flex absolute left-0 top-0 bottom-0 h-full w-12 items-center justify-center z-10 bg-gradient-to-r from-white/90 to-transparent hover:from-white"
              onClick={() => {
                const el = document.getElementById('solutions-scroll');
                if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
              }}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div id="solutions-scroll" className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory">
              {filteredSolutions.map((solution) => (
                <div 
                  key={solution.id}
                  className="min-w-[300px] max-w-[360px] snap-start cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleSolutionSelect(solution)}
                >
                  <SolutionCard
                  solution={{
                    id: solution.id,
                    name: solution.name,
                    description: solution.description,
                    category: solution.category,
                    priority: solution.implementationPriority === 'High' ? 'High' : solution.implementationPriority === 'Medium' ? 'Medium' : 'Low',
                    type: solution.type === 'agent' ? 'ai-agent' : 'workflow',
                    rating: solution.metrics.userRating,
                    reviewCount: solution.metrics.reviewCount,
                    triggerType: solution.type === 'workflow' ? (solution.workflowMetadata?.triggerType as any) : undefined,
                    complexity: solution.difficulty === 'Beginner' ? 'Low' : solution.difficulty === 'Intermediate' ? 'Medium' : 'High',
                    integrations: solution.integrations.map(i => i.platform),
                    tags: solution.tags,
                    active: solution.status === 'Active',
                    lastUpdated: solution.updatedAt.toISOString(),
                    authorName: (solution.author && solution.author.toLowerCase() !== 'community')
                      ? solution.author
                      : (solution.authorUsername || 'Community'),
                    authorAvatarUrl: solution.authorAvatarUrl,
                    authorEmail: solution.authorEmail,
                    authorVerified: !!solution.authorVerified,
                    pricing: solution.pricing,
                  }}
                  onView={() => handleSolutionSelect(solution)}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="scroll right"
              className="hidden md:flex absolute right-0 top-0 bottom-0 h-full w-12 items-center justify-center z-10 bg-gradient-to-l from-white/90 to-transparent hover:from-white"
              onClick={() => {
                const el = document.getElementById('solutions-scroll');
                if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
              }}
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        )}
      </div>
          
          {selectedSolution && (
        <SolutionDetailModal
          solution={selectedSolution}
          isOpen={showSolutionModal}
          onClose={() => setShowSolutionModal(false)}
          onImplement={(solution) => {
            console.log('Implement solution:', solution);
          }}
          onDeploy={(solution) => {
            console.log('Deploy solution:', solution);
          }}
          isAdmin={false}
        />
      )}
    </div>
  );
}