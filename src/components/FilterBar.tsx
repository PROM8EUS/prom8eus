/**
 * Unified FilterBar Component
 * Provides consistent search, filtering, and sorting controls across all tabs
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filters: {
    label: string;
    value: string;
    options: FilterOption[];
    onValueChange: (value: string) => void;
  }[];
  
  // Sorting
  sortBy: string;
  sortOptions: FilterOption[];
  onSortByChange: (value: string) => void;
  
  // Sort Order
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  
  // Language
  lang?: 'de' | 'en';
  
  // Styling
  className?: string;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters,
  sortBy,
  sortOptions,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  lang = 'de',
  className = ''
}: FilterBarProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder={searchPlaceholder || (lang === 'de' ? 'Durchsuchen...' : 'Search...')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          {filters.map((filter, index) => (
            <Select key={index} value={filter.value} onValueChange={filter.onValueChange}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      {option.icon && <span className="text-xs">{option.icon}</span>}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Sort By */}
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder={lang === 'de' ? 'Sortieren' : 'Sort'} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    {option.icon && <span className="text-xs">{option.icon}</span>}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-8 w-8 p-0 text-xs"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>
    </div>
  );
}
