/**
 * SmartSearch Component
 * Advanced search with autocomplete, filters, and smart suggestions
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Filter, 
  ChevronDown, 
  Clock, 
  TrendingUp, 
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
  History,
  Lightbulb,
  Target,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchFilter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'range' | 'boolean';
  options?: Array<{ value: string; label: string; count?: number }>;
  value?: any;
  placeholder?: string;
  icon?: React.ReactNode;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion' | 'filter';
  category?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

export interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showHistory?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
  // Data sources
  suggestions?: SearchSuggestion[];
  filters?: SearchFilter[];
  recentSearches?: string[];
  popularSearches?: string[];
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  // Behavior
  autoFocus?: boolean;
  clearOnEscape?: boolean;
  selectOnEnter?: boolean;
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  value,
  onChange,
  onFilterChange,
  onSuggestionSelect,
  placeholder = 'Search...',
  className,
  disabled = false,
  showFilters = true,
  showSuggestions = true,
  showHistory = true,
  maxSuggestions = 8,
  debounceMs = 300,
  suggestions = [],
  filters = [],
  recentSearches = [],
  popularSearches = [],
  size = 'md',
  variant = 'default',
  autoFocus = false,
  clearOnEscape = true,
  selectOnEnter = true,
  ariaLabel = 'Search',
  ariaDescription
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce search value
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, debounceMs]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveFilter(null);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!debouncedValue || !showSuggestions) return [];
    
    const allSuggestions = [
      // Recent searches
      ...(showHistory ? recentSearches.map((search, index) => ({
        id: `recent-${index}`,
        text: search,
        type: 'recent' as const,
        category: 'Recent',
        icon: <History className="h-4 w-4" />
      })) : []),
      
      // Popular searches
      ...popularSearches.map((search, index) => ({
        id: `popular-${index}`,
        text: search,
        type: 'popular' as const,
        category: 'Popular',
        icon: <TrendingUp className="h-4 w-4" />
      })),
      
      // Custom suggestions
      ...suggestions
    ];

    // Filter by search value
    const filtered = allSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(debouncedValue.toLowerCase())
    );

    // Sort by relevance
    return filtered
      .sort((a, b) => {
        // Exact matches first
        const aExact = a.text.toLowerCase() === debouncedValue.toLowerCase();
        const bExact = b.text.toLowerCase() === debouncedValue.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by type priority
        const typePriority = { recent: 0, popular: 1, suggestion: 2, filter: 3 };
        return typePriority[a.type] - typePriority[b.type];
      })
      .slice(0, maxSuggestions);
  }, [debouncedValue, suggestions, recentSearches, popularSearches, showSuggestions, showHistory, maxSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    
    setSelectedIndex(-1);
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === 'Escape' && clearOnEscape) {
        onChange('');
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          handleSuggestionSelect(filteredSuggestions[selectedIndex]);
        } else if (selectOnEnter && filteredSuggestions.length > 0) {
          handleSuggestionSelect(filteredSuggestions[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        if (clearOnEscape) {
          onChange('');
        }
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSuggestionSelect?.(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle filter change
  const handleFilterChange = (filterId: string, filterValue: any) => {
    const newFilterValues = { ...filterValues, [filterId]: filterValue };
    setFilterValues(newFilterValues);
    onFilterChange?.(newFilterValues);
  };

  // Clear search
  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterValues({});
    onFilterChange?.({});
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-white border-gray-300 focus:border-primary focus:ring-primary',
    outline: 'bg-transparent border-gray-300 focus:border-primary focus:ring-primary',
    ghost: 'bg-transparent border-transparent focus:border-primary focus:ring-primary'
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10 pr-10',
            sizeClasses[size],
            variantClasses[variant],
            'transition-all duration-200'
          )}
          aria-label={ariaLabel}
          aria-describedby={ariaDescription}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        
        {/* Clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.map((filter) => (
            <div key={filter.id} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
                className={cn(
                  'h-8 px-3 text-xs',
                  filterValues[filter.id] && 'bg-primary/10 border-primary text-primary'
                )}
              >
                {filter.icon && <span className="mr-1">{filter.icon}</span>}
                {filter.label}
                {filterValues[filter.id] && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {Array.isArray(filterValues[filter.id]) 
                      ? filterValues[filter.id].length 
                      : '1'
                    }
                  </Badge>
                )}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
              
              {/* Filter dropdown */}
              {activeFilter === filter.id && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
                  {filter.type === 'text' && (
                    <Input
                      placeholder={filter.placeholder}
                      value={filterValues[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                      className="w-full"
                    />
                  )}
                  
                  {filter.type === 'select' && filter.options && (
                    <div className="space-y-1">
                      {filter.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleFilterChange(filter.id, option.value)}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between',
                            filterValues[filter.id] === option.value && 'bg-primary/10 text-primary'
                          )}
                        >
                          <span>{option.label}</span>
                          {option.count && (
                            <Badge variant="secondary" className="text-xs">
                              {option.count}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {filter.type === 'multiselect' && filter.options && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filter.options.map((option) => {
                        const isSelected = filterValues[filter.id]?.includes(option.value) || false;
                        return (
                          <label
                            key={option.value}
                            className="flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentValues = filterValues[filter.id] || [];
                                const newValues = e.target.checked
                                  ? [...currentValues, option.value]
                                  : currentValues.filter((v: string) => v !== option.value);
                                handleFilterChange(filter.id, newValues);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="flex-1">{option.label}</span>
                            {option.count && (
                              <Badge variant="secondary" className="text-xs">
                                {option.count}
                              </Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  
                  {filter.type === 'boolean' && (
                    <div className="space-y-1">
                      <label className="flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterValues[filter.id] || false}
                          onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span>Enable {filter.label}</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Clear filters button */}
          {Object.keys(filterValues).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors',
                index === selectedIndex && 'bg-primary/10 text-primary'
              )}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center space-x-3">
                {suggestion.icon && (
                  <span className="text-gray-400">{suggestion.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.text}
                  </div>
                  {suggestion.category && (
                    <div className="text-xs text-gray-500">
                      {suggestion.category}
                    </div>
                  )}
                </div>
                {suggestion.type === 'recent' && (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                {suggestion.type === 'popular' && (
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                )}
                {suggestion.type === 'suggestion' && (
                  <Lightbulb className="h-4 w-4 text-gray-400" />
                )}
                {suggestion.type === 'filter' && (
                  <Filter className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && debouncedValue && filteredSuggestions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
        >
          <div className="text-center text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No results found for "{debouncedValue}"</p>
            <p className="text-xs text-gray-400 mt-1">
              Try different keywords or check your spelling
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
