/**
 * SubtaskSidebar Component
 * Extracted from TaskPanel.tsx for better modularity and file size compliance
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ListWithSeparators } from './ListWithSeparators';
import { Loader2 } from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';

// Simple string->SHA256 helper for stable cache keys
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SUBTASK_CACHE_NS = 'subtasks_cache_v1';
const SUBTASK_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type CachedSubtasks = {
  createdAt: string;
  subtasks: Subtask[];
};

type Subtask = {
  id: string;
  title: string;
  systems?: string[];
  aiTools?: string[];
  selectedTools?: string[];
  manualHoursShare: number;
  automationPotential: number;
  risks?: string[];
  assumptions?: string[];
  kpis?: string[];
  qualityGates?: string[];
};

function readSubtaskCache(): Record<string, CachedSubtasks> {
  try {
    const raw = localStorage.getItem(SUBTASK_CACHE_NS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSubtaskCache(cache: Record<string, CachedSubtasks>) {
  try {
    localStorage.setItem(SUBTASK_CACHE_NS, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

async function getCachedSubtasksForText(taskText: string): Promise<Subtask[] | null> {
  const key = await sha256(taskText);
  const cache = readSubtaskCache();
  const entry = cache[key];
  if (!entry) return null;
  const age = Date.now() - new Date(entry.createdAt).getTime();
  if (age > SUBTASK_CACHE_TTL_MS) return null;
  console.log(`✅ [SubtasksCache] Hit for ${key}, age ${(age/1000).toFixed(0)}s, items: ${entry.subtasks.length}`);
  return entry.subtasks;
}

async function setCachedSubtasksForText(taskText: string, subtasks: Subtask[]): Promise<void> {
  const key = await sha256(taskText);
  const cache = readSubtaskCache();
  cache[key] = { createdAt: new Date().toISOString(), subtasks };
  writeSubtaskCache(cache);
  console.log(`💾 [SubtasksCache] Saved ${subtasks.length} items for ${key}`);
}

// Simple Counter Component
const SimpleCounter = ({ count, isLoading }: { count: number; isLoading: boolean }) => {

  // Loading shimmer — just gray text
  if (isLoading) {
    return (
      <span className="ml-1 text-gray-500 text-[10px] leading-none animate-pulse">
        ·
      </span>
    );
  }

  // Only show badge if count > 0
  if (count === 0) {
    return null;
  }

  return (
    <span className="ml-1 text-gray-500 text-[10px] leading-none">
      {count}
    </span>
  );
};

type SubtaskSidebarProps = {
  task: {
    title?: string;
    name?: string;
    description?: string;
    category?: string;
    subtasks?: Array<{
      id: string;
      title: string;
      description: string;
      automationPotential: number;
      estimatedTime: number;
      priority: 'low' | 'medium' | 'high' | 'critical';
      complexity: 'low' | 'medium' | 'high';
      systems: string[];
      risks: string[];
      opportunities: string[];
      dependencies: string[];
    }>;
  };
  lang?: 'de' | 'en';
  isVisible?: boolean;
  onSubtaskSelect?: (subtaskId: string) => void;
  selectedSubtaskId?: string;
  aiGeneratedSubtasks?: Subtask[]; // Add AI-generated subtasks prop
};

// Removed unused types: SortOption, FilterOption

export default function SubtaskSidebar({ 
  task, 
  lang = 'de', 
  isVisible = false, 
  onSubtaskSelect,
  selectedSubtaskId,
  aiGeneratedSubtasks = []
}: SubtaskSidebarProps) {
  const [generatedSubtasks, setGeneratedSubtasks] = useState<Subtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({});
  
  // Simplified state - no search, filter, or favorites

  // Handle tool selection
  const handleToolToggle = (subtaskId: string, toolId: string) => {
    setSelectedTools(prev => {
      const current = prev[subtaskId] || [];
      const updated = current.includes(toolId)
        ? current.filter(id => id !== toolId)
        : [...current, toolId];
      
      return {
        ...prev,
        [subtaskId]: updated
      };
    });
  };

  // Simplified handlers - no search, filter, or favorites



  // Get all subtasks - no filtering, always show all
  const realSubtasks = useMemo(() => {
    console.log('🔍 [SubtaskSidebar] Debug subtasks check:', {
      hasTask: !!task,
      hasSubtasks: !!(task?.subtasks),
      subtasksLength: task?.subtasks?.length || 0,
      subtasksData: task?.subtasks
    });
    
    let baseSubtasks: Subtask[] = [];
    
    // Prioritize existing task subtasks first (for immediate display)
    if (task?.subtasks && task.subtasks.length > 0) {
      console.log('✅ [SubtaskSidebar] Using real subtasks from task prop:', task.subtasks.length);
      baseSubtasks = task.subtasks.map(subtask => ({
        id: subtask.id || `subtask-${Math.random().toString(36).substr(2, 9)}`,
        title: subtask.title || 'Unbekannte Teilaufgabe',
        systems: subtask.systems || [],
        manualHoursShare: subtask.automationPotential ? (100 - subtask.automationPotential) / 100 : 0.3,
        automationPotential: subtask.automationPotential ? subtask.automationPotential / 100 : 0.7,
        risks: subtask.risks || [],
        assumptions: [],
        kpis: [],
        qualityGates: []
      }));
    } else if (aiGeneratedSubtasks.length > 0) {
      console.log('✅ [SubtaskSidebar] Using AI-generated subtasks:', aiGeneratedSubtasks.length);
      baseSubtasks = [...aiGeneratedSubtasks];
    } else if (generatedSubtasks.length > 0) {
      console.log('✅ [SubtaskSidebar] Using generated subtasks:', generatedSubtasks.length);
      baseSubtasks = [...generatedSubtasks];
    } else {
      console.log('⏳ [SubtaskSidebar] Subtasks are being generated, showing loading state');
      
      // Return empty array to show loading state instead of fallback
      baseSubtasks = [];
    }

    // Always show all subtasks, sorted by automation potential (highest first)
    return baseSubtasks.sort((a, b) => b.automationPotential - a.automationPotential);
  }, [task?.subtasks, generatedSubtasks, aiGeneratedSubtasks]);

  if (!isVisible) return null;

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {lang === 'de' ? 'Teilaufgaben' : 'Subtasks'}
          </h3>
          <div className="flex items-center gap-2">
            <SimpleCounter count={realSubtasks.length} isLoading={isGenerating} />
          </div>
        </div>

        {/* Subtasks List */}
        {realSubtasks.length === 0 && isGenerating ? (
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">
                  {lang === 'de' ? 'Generiere Teilaufgaben...' : 'Generating subtasks...'}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ListWithSeparators
            subtasks={realSubtasks}
            selectedSubtaskId={selectedSubtaskId}
            lang={lang}
            onSubtaskSelect={onSubtaskSelect}
            showAllItem={true}
          />
        )}
      </div>
    </div>
  );
}
