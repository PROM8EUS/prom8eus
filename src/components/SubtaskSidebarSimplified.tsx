/**
 * SubtaskSidebar Component - Simplified version
 * Focuses only on navigation and display, no AI generation
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ListWithSeparators } from './ListWithSeparators';
import { Loader2 } from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';

interface SubtaskSidebarSimplifiedProps {
  task: any;
  lang: 'de' | 'en';
  isVisible: boolean;
  onSubtaskSelect: (id: string) => void;
  selectedSubtaskId: string;
  subtasks: DynamicSubtask[]; // Server-provided subtasks
  isLoadingSubtasks?: boolean; // Loading state from parent
}

/**
 * SubtaskSidebar - Navigation Component
 * Responsibilities:
 * - Display subtask navigation
 * - Handle subtask selection
 * - Show loading states
 * - Emit selection events
 * 
 * Does NOT:
 * - Generate subtasks (handled by server)
 * - Fetch data (receives from parent)
 * - Handle business logic
 */
export default function SubtaskSidebarSimplified({
  task,
  lang,
  isVisible,
  onSubtaskSelect,
  selectedSubtaskId,
  subtasks,
  isLoadingSubtasks = false
}: SubtaskSidebarSimplifiedProps) {
  
  // Use server-provided subtasks or fallback to task.subtasks
  const displaySubtasks = useMemo(() => {
    if (subtasks && subtasks.length > 0) {
      return subtasks;
    }
    
    // Fallback to task.subtasks if available
    if (task?.subtasks && task.subtasks.length > 0) {
      return task.subtasks.map((subtask: any, index: number) => ({
        id: subtask.id || `subtask-${index}`,
        title: subtask.title || subtask.text || `Subtask ${index + 1}`,
        description: subtask.description || '',
        systems: subtask.systems || [],
        aiTools: subtask.aiTools || [],
        selectedTools: subtask.selectedTools || [],
        manualHoursShare: subtask.manualHoursShare || 0.5,
        automationPotential: subtask.automationPotential || 0.5,
        risks: subtask.risks || [],
        assumptions: subtask.assumptions || [],
        kpis: subtask.kpis || [],
        qualityGates: subtask.qualityGates || []
      }));
    }
    
    return [];
  }, [subtasks, task?.subtasks]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {lang === 'de' ? 'Unteraufgaben' : 'Subtasks'}
        </h3>
        {displaySubtasks.length > 0 && (
          <span className="text-sm text-gray-500">
            {displaySubtasks.length} {lang === 'de' ? 'Aufgaben' : 'tasks'}
          </span>
        )}
      </div>

      {/* Content */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          {isLoadingSubtasks ? (
            // Loading state
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {lang === 'de' ? 'Lade Unteraufgaben...' : 'Loading subtasks...'}
                </p>
              </div>
            </div>
          ) : displaySubtasks.length > 0 ? (
            // Subtask list
            <ListWithSeparators
              items={[
                // "All" item
                {
                  id: 'all',
                  title: lang === 'de' ? 'Alle Aufgaben' : 'All Tasks',
                  description: lang === 'de' ? 'Übergreifende Lösungen' : 'Cross-cutting solutions',
                  isActive: selectedSubtaskId === 'all',
                  onClick: () => onSubtaskSelect('all')
                },
                // Individual subtasks
                ...displaySubtasks.map(subtask => ({
                  id: subtask.id,
                  title: subtask.title,
                  description: subtask.description,
                  isActive: selectedSubtaskId === subtask.id,
                  onClick: () => onSubtaskSelect(subtask.id)
                }))
              ]}
            />
          ) : (
            // Empty state
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {lang === 'de' 
                  ? 'Keine Unteraufgaben verfügbar' 
                  : 'No subtasks available'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
