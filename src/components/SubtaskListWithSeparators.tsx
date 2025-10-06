import React from 'react';
import { AllItem } from './AllItem';
import { ListItem } from './ListItem';
import { DynamicSubtask } from '@/lib/types';

interface ListWithSeparatorsProps {
  subtasks: DynamicSubtask[];
  selectedSubtaskId?: string;
  lang?: 'de' | 'en';
  onSubtaskSelect?: (subtaskId: string) => void;
  showAllItem?: boolean;
}

export const ListWithSeparators: React.FC<ListWithSeparatorsProps> = ({
  subtasks,
  selectedSubtaskId,
  lang = 'de',
  onSubtaskSelect,
  showAllItem = true
}) => {
  // Calculate total items including "All" item
  const totalItems = subtasks.length + (showAllItem ? 1 : 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* "Alle" item */}
      {showAllItem && (
        <AllItem
          lang={lang}
          isSelected={selectedSubtaskId === 'all'}
          onClick={() => onSubtaskSelect?.('all')}
          isLast={totalItems === 1}
        />
      )}

      {/* Individual subtasks */}
      {subtasks.map((subtask, index) => {
        const isLast = index === subtasks.length - 1 && !showAllItem;
        return (
          <ListItem
            key={subtask.id}
            subtask={subtask}
            index={index}
            lang={lang}
            isSelected={selectedSubtaskId === subtask.id}
            onClick={() => onSubtaskSelect?.(subtask.id)}
            isLast={isLast}
          />
        );
      })}
    </div>
  );
};
