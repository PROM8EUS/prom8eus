/**
 * Tests for SubtaskSidebarSimplified Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubtaskSidebarSimplified from '../SubtaskSidebarSimplified';
import { DynamicSubtask } from '@/lib/types';

// Mock the ListWithSeparators component
vi.mock('../ListWithSeparators', () => ({
  ListWithSeparators: ({ items }: any) => (
    <div data-testid="list-with-separators">
      {items.map((item: any) => (
        <div key={item.id} data-testid={`list-item-${item.id}`}>
          <button onClick={item.onClick}>
            {item.title}
          </button>
        </div>
      ))}
    </div>
  )
}));

describe('SubtaskSidebarSimplified', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Subtask 1',
        description: 'Description 1',
        systems: ['System A'],
        aiTools: ['Tool A'],
        selectedTools: [],
        manualHoursShare: 0.5,
        automationPotential: 0.7,
        risks: ['Risk A'],
        assumptions: ['Assumption A'],
        kpis: ['KPI A'],
        qualityGates: ['Gate A']
      },
      {
        id: 'subtask-2',
        title: 'Subtask 2',
        description: 'Description 2',
        systems: ['System B'],
        aiTools: ['Tool B'],
        selectedTools: [],
        manualHoursShare: 0.6,
        automationPotential: 0.8,
        risks: ['Risk B'],
        assumptions: ['Assumption B'],
        kpis: ['KPI B'],
        qualityGates: ['Gate B']
      }
    ]
  };

  const mockSubtasks: DynamicSubtask[] = [
    {
      id: 'subtask-1',
      title: 'Server Subtask 1',
      description: 'Server Description 1',
      systems: ['Server System A'],
      aiTools: ['Server Tool A'],
      selectedTools: [],
      manualHoursShare: 0.5,
      automationPotential: 0.7,
      risks: ['Server Risk A'],
      assumptions: ['Server Assumption A'],
      kpis: ['Server KPI A'],
      qualityGates: ['Server Gate A']
    }
  ];

  const defaultProps = {
    task: mockTask,
    lang: 'de' as const,
    isVisible: true,
    onSubtaskSelect: vi.fn(),
    selectedSubtaskId: 'all',
    subtasks: [],
    isLoadingSubtasks: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with correct title', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} />);

    expect(screen.getByText('Unteraufgaben')).toBeInTheDocument();
  });

  it('should render English title when lang is en', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} lang="en" />);

    expect(screen.getByText('Subtasks')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} isVisible={false} />);

    expect(screen.queryByText('Unteraufgaben')).not.toBeInTheDocument();
  });

  it('should display subtask count from task.subtasks', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} />);

    expect(screen.getByText('2 Aufgaben')).toBeInTheDocument();
  });

  it('should display subtask count from server subtasks when available', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} subtasks={mockSubtasks} />);

    expect(screen.getByText('1 Aufgaben')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} isLoadingSubtasks={true} />);

    expect(screen.getByText('Lade Unteraufgaben...')).toBeInTheDocument();
    expect(screen.getByTestId('list-with-separators')).not.toBeInTheDocument();
  });

  it('should render empty state when no subtasks available', () => {
    const taskWithoutSubtasks = {
      ...mockTask,
      subtasks: []
    };

    render(
      <SubtaskSidebarSimplified 
        {...defaultProps} 
        task={taskWithoutSubtasks}
        subtasks={[]}
      />
    );

    expect(screen.getByText('Keine Unteraufgaben verfügbar')).toBeInTheDocument();
  });

  it('should render subtasks from task.subtasks when server subtasks not available', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} />);

    expect(screen.getByTestId('list-with-separators')).toBeInTheDocument();
    expect(screen.getByTestId('list-item-all')).toBeInTheDocument();
    expect(screen.getByTestId('list-item-subtask-1')).toBeInTheDocument();
    expect(screen.getByTestId('list-item-subtask-2')).toBeInTheDocument();
  });

  it('should render subtasks from server when available', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} subtasks={mockSubtasks} />);

    expect(screen.getByTestId('list-with-separators')).toBeInTheDocument();
    expect(screen.getByTestId('list-item-all')).toBeInTheDocument();
    expect(screen.getByTestId('list-item-subtask-1')).toBeInTheDocument();
    // Should not render task.subtasks when server subtasks are available
    expect(screen.queryByTestId('list-item-subtask-2')).not.toBeInTheDocument();
  });

  it('should call onSubtaskSelect when subtask is clicked', () => {
    const onSubtaskSelect = vi.fn();
    render(
      <SubtaskSidebarSimplified 
        {...defaultProps} 
        onSubtaskSelect={onSubtaskSelect}
      />
    );

    const allButton = screen.getByText('Alle Aufgaben');
    fireEvent.click(allButton);

    expect(onSubtaskSelect).toHaveBeenCalledWith('all');
  });

  it('should call onSubtaskSelect when individual subtask is clicked', () => {
    const onSubtaskSelect = vi.fn();
    render(
      <SubtaskSidebarSimplified 
        {...defaultProps} 
        onSubtaskSelect={onSubtaskSelect}
      />
    );

    const subtaskButton = screen.getByText('Subtask 1');
    fireEvent.click(subtaskButton);

    expect(onSubtaskSelect).toHaveBeenCalledWith('subtask-1');
  });

  it('should handle subtasks without id by generating fallback id', () => {
    const taskWithSubtasksWithoutId = {
      ...mockTask,
      subtasks: [
        {
          title: 'Subtask without ID',
          description: 'Description',
          systems: [],
          aiTools: [],
          selectedTools: [],
          manualHoursShare: 0.5,
          automationPotential: 0.5,
          risks: [],
          assumptions: [],
          kpis: [],
          qualityGates: []
        }
      ]
    };

    render(
      <SubtaskSidebarSimplified 
        {...defaultProps} 
        task={taskWithSubtasksWithoutId}
      />
    );

    expect(screen.getByTestId('list-item-subtask-0')).toBeInTheDocument();
  });

  it('should handle subtasks without title by generating fallback title', () => {
    const taskWithSubtasksWithoutTitle = {
      ...mockTask,
      subtasks: [
        {
          id: 'subtask-1',
          description: 'Description',
          systems: [],
          aiTools: [],
          selectedTools: [],
          manualHoursShare: 0.5,
          automationPotential: 0.5,
          risks: [],
          assumptions: [],
          kpis: [],
          qualityGates: []
        }
      ]
    };

    render(
      <SubtaskSidebarSimplified 
        {...defaultProps} 
        task={taskWithSubtasksWithoutTitle}
      />
    );

    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
  });

  it('should render English empty state message', () => {
    const taskWithoutSubtasks = {
      ...mockTask,
      subtasks: []
    };

    render(
      <SubtaskSidebarSimplified 
        {...defaultProps} 
        task={taskWithoutSubtasks}
        subtasks={[]}
        lang="en"
      />
    );

    expect(screen.getByText('No subtasks available')).toBeInTheDocument();
  });

  it('should render English loading message', () => {
    render(<SubtaskSidebarSimplified {...defaultProps} lang="en" isLoadingSubtasks={true} />);

    expect(screen.getByText('Loading subtasks...')).toBeInTheDocument();
  });
});
