/**
 * useSmartSearch Hook
 * Manages search and filter state with debouncing and smart suggestions
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchFilter, SearchSuggestion } from '@/components/ui/SmartSearch';
import { FilterConfig, SortConfig } from '@/components/ui/SmartFilter';

export interface UseSmartSearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterConfigs: FilterConfig[];
  sortConfigs?: SortConfig[];
  debounceMs?: number;
  maxSuggestions?: number;
  enableHistory?: boolean;
  enablePopular?: boolean;
  historyKey?: string;
  popularKey?: string;
}

export interface UseSmartSearchReturn<T> {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Filter state
  filterValues: Record<string, any>;
  setFilterValues: (values: Record<string, any>) => void;
  updateFilter: (filterId: string, value: any) => void;
  clearFilters: () => void;
  
  // Sort state
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  
  // Results
  filteredData: T[];
  searchSuggestions: SearchSuggestion[];
  filterOptions: Record<string, Array<{ value: string; label: string; count: number }>>;
  
  // Stats
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  
  // History
  recentSearches: string[];
  popularSearches: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}

export function useSmartSearch<T extends Record<string, any>>({
  data,
  searchFields,
  filterConfigs,
  sortConfigs = [],
  debounceMs = 300,
  maxSuggestions = 8,
  enableHistory = true,
  enablePopular = true,
  historyKey = 'smart-search-history',
  popularKey = 'smart-search-popular'
}: UseSmartSearchOptions<T>): UseSmartSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  // Load history from localStorage
  useEffect(() => {
    if (enableHistory) {
      try {
        const history = localStorage.getItem(historyKey);
        if (history) {
          setRecentSearches(JSON.parse(history));
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, [enableHistory, historyKey]);

  // Load popular searches from localStorage
  useEffect(() => {
    if (enablePopular) {
      try {
        const popular = localStorage.getItem(popularKey);
        if (popular) {
          setPopularSearches(JSON.parse(popular));
        }
      } catch (error) {
        console.warn('Failed to load popular searches:', error);
      }
    }
  }, [enablePopular, popularKey]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Filter data based on search query
  const searchFilteredData = useMemo(() => {
    if (!debouncedQuery.trim()) return data;

    const query = debouncedQuery.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === 'number') {
          return value.toString().includes(query);
        }
        if (Array.isArray(value)) {
          return value.some(v => 
            typeof v === 'string' ? v.toLowerCase().includes(query) : false
          );
        }
        return false;
      })
    );
  }, [data, debouncedQuery, searchFields]);

  // Filter data based on filter values
  const filteredData = useMemo(() => {
    let result = searchFilteredData;

    // Apply filters
    filterConfigs.forEach(filter => {
      const filterValue = filterValues[filter.id];
      if (filterValue === null || filterValue === undefined || filterValue === '') return;

      result = result.filter(item => {
        const itemValue = item[filter.id];

        switch (filter.type) {
          case 'select':
            return itemValue === filterValue;
          
          case 'multiselect':
            if (Array.isArray(filterValue)) {
              return Array.isArray(itemValue) 
                ? filterValue.some(v => itemValue.includes(v))
                : filterValue.includes(itemValue);
            }
            return false;
          
          case 'range':
            if (typeof filterValue === 'object' && filterValue !== null) {
              const { min, max } = filterValue;
              const numValue = typeof itemValue === 'number' ? itemValue : parseFloat(itemValue);
              if (isNaN(numValue)) return false;
              if (min !== null && numValue < min) return false;
              if (max !== null && numValue > max) return false;
              return true;
            }
            return false;
          
          case 'boolean':
            return Boolean(itemValue) === Boolean(filterValue);
          
          case 'tags':
            if (Array.isArray(filterValue) && filterValue.length > 0) {
              return Array.isArray(itemValue) 
                ? filterValue.some(tag => itemValue.includes(tag))
                : filterValue.includes(itemValue);
            }
            return false;
          
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [searchFilteredData, filterValues, filterConfigs, sortConfig]);

  // Generate filter options with counts
  const filterOptions = useMemo(() => {
    const options: Record<string, Array<{ value: string; label: string; count: number }>> = {};

    filterConfigs.forEach(filter => {
      if (filter.type === 'select' || filter.type === 'multiselect') {
        const uniqueValues = new Map<string, number>();
        
        searchFilteredData.forEach(item => {
          const value = item[filter.id];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => {
                const key = String(v);
                uniqueValues.set(key, (uniqueValues.get(key) || 0) + 1);
              });
            } else {
              const key = String(value);
              uniqueValues.set(key, (uniqueValues.get(key) || 0) + 1);
            }
          }
        });

        options[filter.id] = Array.from(uniqueValues.entries()).map(([value, count]) => ({
          value,
          label: value,
          count
        }));
      }
    });

    return options;
  }, [searchFilteredData, filterConfigs]);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    const suggestions: SearchSuggestion[] = [];

    // Add recent searches
    if (enableHistory && recentSearches.length > 0) {
      recentSearches.slice(0, 3).forEach((search, index) => ({
        id: `recent-${index}`,
        text: search,
        type: 'recent' as const,
        category: 'Recent Searches'
      }));
    }

    // Add popular searches
    if (enablePopular && popularSearches.length > 0) {
      popularSearches.slice(0, 3).forEach((search, index) => ({
        id: `popular-${index}`,
        text: search,
        type: 'popular' as const,
        category: 'Popular Searches'
      }));
    }

    // Add field-based suggestions
    if (debouncedQuery.length > 1) {
      const query = debouncedQuery.toLowerCase();
      const fieldSuggestions = new Set<string>();

      searchFields.forEach(field => {
        data.forEach(item => {
          const value = item[field];
          if (typeof value === 'string' && value.toLowerCase().includes(query)) {
            fieldSuggestions.add(value);
          }
        });
      });

      Array.from(fieldSuggestions).slice(0, 5).forEach((suggestion, index) => {
        suggestions.push({
          id: `suggestion-${index}`,
          text: suggestion,
          type: 'suggestion',
          category: 'Suggestions'
        });
      });
    }

    return suggestions.slice(0, maxSuggestions);
  }, [debouncedQuery, data, searchFields, recentSearches, popularSearches, enableHistory, enablePopular, maxSuggestions]);

  // Update filter value
  const updateFilter = useCallback((filterId: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedValues: Record<string, any> = {};
    filterConfigs.forEach(filter => {
      if (filter.type === 'multiselect' || filter.type === 'tags') {
        clearedValues[filter.id] = [];
      } else if (filter.type === 'boolean') {
        clearedValues[filter.id] = false;
      } else {
        clearedValues[filter.id] = null;
      }
    });
    setFilterValues(clearedValues);
  }, [filterConfigs]);

  // Add to search history
  const addToHistory = useCallback((query: string) => {
    if (!enableHistory || !query.trim()) return;

    setRecentSearches(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 10);
      try {
        localStorage.setItem(historyKey, JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
      return newHistory;
    });
  }, [enableHistory, historyKey]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(historyKey);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, [historyKey]);

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return Object.values(filterValues).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      return value !== null && value !== undefined && value !== '';
    });
  }, [filterValues]);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    
    // Filter state
    filterValues,
    setFilterValues,
    updateFilter,
    clearFilters,
    
    // Sort state
    sortConfig,
    setSortConfig,
    
    // Results
    filteredData,
    searchSuggestions,
    filterOptions,
    
    // Stats
    totalCount: data.length,
    filteredCount: filteredData.length,
    hasActiveFilters,
    
    // History
    recentSearches,
    popularSearches,
    addToHistory,
    clearHistory
  };
}

export default useSmartSearch;
