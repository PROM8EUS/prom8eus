/**
 * SmartFilter Component
 * Advanced filtering system with multiple filter types and smart suggestions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Check, 
  Clock, 
  Star, 
  Zap,
  Bot,
  Code,
  MessageSquare,
  Download,
  Settings,
  Eye,
  Copy,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  SortAsc,
  SortDesc,
  Calendar,
  Tag,
  Users,
  Building,
  Globe,
  Shield,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'boolean' | 'search' | 'tags';
  options?: FilterOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  multiple?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  // Range specific
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  // Date specific
  dateFormat?: string;
  // Tags specific
  allowCustom?: boolean;
  maxTags?: number;
  // Styling
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface SortConfig {
  id: string;
  label: string;
  field: string;
  direction: 'asc' | 'desc';
  icon?: React.ReactNode;
}

export interface SmartFilterProps {
  filters: FilterConfig[];
  sortOptions?: SortConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onSortChange?: (sort: SortConfig | null) => void;
  className?: string;
  // Layout
  layout?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  showCounts?: boolean;
  // Behavior
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  // Data
  totalCount?: number;
  filteredCount?: number;
}

export const SmartFilter: React.FC<SmartFilterProps> = ({
  filters,
  sortOptions = [],
  values,
  onChange,
  onSortChange,
  className,
  layout = 'horizontal',
  showLabels = true,
  showCounts = true,
  collapsible = false,
  defaultCollapsed = false,
  size = 'md',
  variant = 'outline',
  totalCount = 0,
  filteredCount = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(values).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      return value !== null && value !== undefined && value !== '';
    }).length;
  }, [values]);

  // Handle filter change
  const handleFilterChange = (filterId: string, value: any) => {
    onChange({ ...values, [filterId]: value });
  };

  // Handle sort change
  const handleSortChange = (sort: SortConfig | null) => {
    onSortChange?.(sort);
  };

  // Clear all filters
  const handleClearAll = () => {
    const clearedValues: Record<string, any> = {};
    filters.forEach(filter => {
      if (filter.type === 'multiselect' || filter.type === 'tags') {
        clearedValues[filter.id] = [];
      } else if (filter.type === 'boolean') {
        clearedValues[filter.id] = false;
      } else {
        clearedValues[filter.id] = null;
      }
    });
    onChange(clearedValues);
  };

  // Toggle filter expansion
  const toggleFilterExpansion = (filterId: string) => {
    setExpandedFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filterId)) {
        newSet.delete(filterId);
      } else {
        newSet.add(filterId);
      }
      return newSet;
    });
  };

  // Handle search in filter options
  const handleFilterSearch = (filterId: string, query: string) => {
    setSearchQueries(prev => ({ ...prev, [filterId]: query }));
  };

  // Get filtered options for a filter
  const getFilteredOptions = (filter: FilterConfig) => {
    if (!filter.options || !filter.searchable) return filter.options || [];
    
    const query = searchQueries[filter.id]?.toLowerCase() || '';
    if (!query) return filter.options;

    return filter.options.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.description?.toLowerCase().includes(query)
    );
  };

  // Render filter based on type
  const renderFilter = (filter: FilterConfig) => {
    const isExpanded = expandedFilters.has(filter.id);
    const currentValue = values[filter.id];
    const filteredOptions = getFilteredOptions(filter);

    switch (filter.type) {
      case 'select':
        return (
          <div className="relative">
            <Button
              variant={variant}
              size={size}
              onClick={() => toggleFilterExpansion(filter.id)}
              className={cn(
                'justify-between min-w-32',
                currentValue && 'bg-primary/10 border-primary text-primary'
              )}
            >
              <div className="flex items-center">
                {filter.icon && <span className="mr-2">{filter.icon}</span>}
                <span className="truncate">
                  {currentValue 
                    ? filteredOptions.find(opt => opt.value === currentValue)?.label || currentValue
                    : filter.label
                  }
                </span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {isExpanded && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {filter.searchable && (
                  <div className="p-2 border-b border-gray-100">
                    <Input
                      placeholder={`Search ${filter.label.toLowerCase()}...`}
                      value={searchQueries[filter.id] || ''}
                      onChange={(e) => handleFilterSearch(filter.id, e.target.value)}
                      className="h-8"
                    />
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleFilterChange(filter.id, option.value);
                        toggleFilterExpansion(filter.id);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between',
                        currentValue === option.value && 'bg-primary/10 text-primary'
                      )}
                    >
                      <div className="flex items-center">
                        {option.icon && <span className="mr-2">{option.icon}</span>}
                        <span>{option.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {showCounts && option.count !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {option.count}
                          </Badge>
                        )}
                        {currentValue === option.value && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div className="relative">
            <Button
              variant={variant}
              size={size}
              onClick={() => toggleFilterExpansion(filter.id)}
              className={cn(
                'justify-between min-w-32',
                currentValue?.length > 0 && 'bg-primary/10 border-primary text-primary'
              )}
            >
              <div className="flex items-center">
                {filter.icon && <span className="mr-2">{filter.icon}</span>}
                <span>
                  {currentValue?.length > 0 
                    ? `${filter.label} (${currentValue.length})`
                    : filter.label
                  }
                </span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {isExpanded && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {filter.searchable && (
                  <div className="p-2 border-b border-gray-100">
                    <Input
                      placeholder={`Search ${filter.label.toLowerCase()}...`}
                      value={searchQueries[filter.id] || ''}
                      onChange={(e) => handleFilterSearch(filter.id, e.target.value)}
                      className="h-8"
                    />
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto">
                  {filteredOptions.map((option) => {
                    const isSelected = currentValue?.includes(option.value) || false;
                    return (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentValues = currentValue || [];
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter((v: string) => v !== option.value);
                            handleFilterChange(filter.id, newValues);
                          }}
                          className="rounded border-gray-300"
                        />
                        <div className="flex items-center flex-1">
                          {option.icon && <span className="mr-2">{option.icon}</span>}
                          <span>{option.label}</span>
                        </div>
                        {showCounts && option.count !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {option.count}
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'range':
        return (
          <div className="flex items-center space-x-2">
            {filter.icon && <span>{filter.icon}</span>}
            {showLabels && <span className="text-sm font-medium">{filter.label}:</span>}
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder={filter.min?.toString() || 'Min'}
                value={currentValue?.min || ''}
                onChange={(e) => handleFilterChange(filter.id, {
                  ...currentValue,
                  min: e.target.value ? Number(e.target.value) : null
                })}
                className="w-20 h-8"
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
              <span className="text-gray-400">-</span>
              <Input
                type="number"
                placeholder={filter.max?.toString() || 'Max'}
                value={currentValue?.max || ''}
                onChange={(e) => handleFilterChange(filter.id, {
                  ...currentValue,
                  max: e.target.value ? Number(e.target.value) : null
                })}
                className="w-20 h-8"
                min={filter.min}
                max={filter.max}
                step={filter.step}
              />
              {filter.unit && <span className="text-sm text-gray-500">{filter.unit}</span>}
            </div>
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue || false}
              onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
              className="rounded border-gray-300"
            />
            {filter.icon && <span>{filter.icon}</span>}
            {showLabels && <span className="text-sm font-medium">{filter.label}</span>}
          </label>
        );

      case 'tags':
        return (
          <div className="space-y-2">
            {showLabels && (
              <div className="flex items-center space-x-2">
                {filter.icon && <span>{filter.icon}</span>}
                <span className="text-sm font-medium">{filter.label}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {currentValue?.map((tag: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => {
                      const newTags = currentValue.filter((_: string, i: number) => i !== index);
                      handleFilterChange(filter.id, newTags);
                    }}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(!filter.maxTags || (currentValue?.length || 0) < filter.maxTags) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newTag = prompt('Enter tag:');
                    if (newTag && !currentValue?.includes(newTag)) {
                      handleFilterChange(filter.id, [...(currentValue || []), newTag]);
                    }
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tag
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showCounts && (
            <span className="text-sm text-gray-500">
              {filteredCount > 0 ? `${filteredCount} of ${totalCount}` : totalCount} results
            </span>
          )}
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
          
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 px-2"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {!isCollapsed && (
        <div className={cn(
          'space-y-4',
          layout === 'horizontal' && 'flex flex-wrap gap-4',
          layout === 'compact' && 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
        )}>
          {filters.map((filter) => (
            <div key={filter.id} className="space-y-2">
              {renderFilter(filter)}
            </div>
          ))}
        </div>
      )}

      {/* Sort Options */}
      {sortOptions.length > 0 && (
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          {sortOptions.map((sort) => (
            <Button
              key={sort.id}
              variant="outline"
              size="sm"
              onClick={() => handleSortChange(sort)}
              className="h-8 px-3 text-xs"
            >
              {sort.icon && <span className="mr-1">{sort.icon}</span>}
              {sort.label}
              {sort.direction === 'asc' ? (
                <SortAsc className="h-3 w-3 ml-1" />
              ) : (
                <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartFilter;
