import { Subtask as SubtaskItemData } from './SubtaskItem';

// Adapter to convert existing TaskPanel subtasks to SubtaskItem format
export interface TaskPanelSubtask {
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
}

export const adaptSubtaskToSubtaskItem = (subtask: TaskPanelSubtask): SubtaskItemData => {
  return {
    id: subtask.id,
    title: subtask.title,
    description: subtask.description,
    automationPotential: subtask.automationPotential,
    estimatedTimeReduction: subtask.estimatedTime,
    tools: subtask.systems || [],
    complexity: subtask.complexity,
    priority: subtask.priority === 'critical' ? 'high' : subtask.priority,
    category: 'general'
  };
};

export const adaptSubtasksToSubtaskItems = (subtasks: TaskPanelSubtask[]): SubtaskItemData[] => {
  return subtasks.map(adaptSubtaskToSubtaskItem);
};
