import { Solution, SolutionType, SolutionCategory, SolutionFilter, SolutionSort, SolutionSearchResult } from '../../types/solutions';

export interface FilterCriteria {
  type?: SolutionType[];
  category?: SolutionCategory[];
  difficulty?: string[];
  setupTime?: string[];
  deployment?: string[];
  status?: string[];
  minAutomationPotential?: number;
  maxAutomationPotential?: number;
  implementationPriority?: string[];
  tags?: string[];
  priceRange?: string[];
  minRating?: number;
  maxSetupTime?: number;
  businessDomain?: string[];
  author?: string[];
  hasDocumentation?: boolean;
  hasDemo?: boolean;
  hasGithub?: boolean;
}

export interface SearchQuery {
  text: string;
  filters: FilterCriteria;
  sort: SolutionSort;
  pagination: {
    page: number;
    pageSize: number;
  };
}

export interface FacetedSearchResult {
  solutions: Solution[];
  facets: {
    categories: FacetCount[];
    difficulties: FacetCount[];
    setupTimes: FacetCount[];
    deployments: FacetCount[];
    priorities: FacetCount[];
    tags: FacetCount[];
    priceRanges: FacetCount[];
    businessDomains: FacetCount[];
    authors: FacetCount[];
  };
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  searchMetadata: {
    queryTime: number;
    totalResults: number;
    filteredResults: number;
    suggestions: string[];
  };
}

export interface FacetCount {
  value: string;
  count: number;
  selected: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'category' | 'tag' | 'author' | 'solution';
  relevance: number;
}

export class SolutionFilters {
  private solutions: Solution[] = [];

  constructor(solutions: Solution[]) {
    this.solutions = solutions;
  }

  /**
   * Apply filters to solutions
   */
  applyFilters(filters: FilterCriteria): Solution[] {
    let filteredSolutions = [...this.solutions];

    // Type filter
    if (filters.type && filters.type.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.type!.includes(solution.type)
      );
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.category!.includes(solution.category)
      );
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.difficulty!.includes(solution.difficulty)
      );
    }

    // Setup time filter
    if (filters.setupTime && filters.setupTime.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.setupTime!.includes(solution.setupTime)
      );
    }

    // Deployment filter
    if (filters.deployment && filters.deployment.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.deployment!.includes(solution.deployment)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.status!.includes(solution.status)
      );
    }

    // Automation potential range
    if (filters.minAutomationPotential !== undefined) {
      filteredSolutions = filteredSolutions.filter(solution => 
        solution.automationPotential >= filters.minAutomationPotential!
      );
    }

    if (filters.maxAutomationPotential !== undefined) {
      filteredSolutions = filteredSolutions.filter(solution => 
        solution.automationPotential <= filters.maxAutomationPotential!
      );
    }

    // Implementation priority filter
    if (filters.implementationPriority && filters.implementationPriority.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.implementationPriority!.includes(solution.implementationPriority)
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.tags!.some(tag => solution.tags.includes(tag))
      );
    }

    // Price range filter
    if (filters.priceRange && filters.priceRange.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        solution.pricing && filters.priceRange!.includes(solution.pricing)
      );
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      filteredSolutions = filteredSolutions.filter(solution => 
        solution.metrics.userRating >= filters.minRating!
      );
    }

    // Setup time filter (in minutes)
    if (filters.maxSetupTime !== undefined) {
      filteredSolutions = filteredSolutions.filter(solution => {
        const setupTimeMinutes = this.convertSetupTimeToMinutes(solution.setupTime);
        return setupTimeMinutes <= filters.maxSetupTime!;
      });
    }

    // Business domain filter
    if (filters.businessDomain && filters.businessDomain.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.businessDomain!.some(domain => 
          solution.category.toLowerCase().includes(domain.toLowerCase()) ||
          solution.subcategories.some(sub => sub.toLowerCase().includes(domain.toLowerCase()))
        )
      );
    }

    // Author filter
    if (filters.author && filters.author.length > 0) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.author!.includes(solution.author)
      );
    }

    // Documentation availability filter
    if (filters.hasDocumentation !== undefined) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.hasDocumentation! ? !!solution.documentationUrl : true
      );
    }

    // Demo availability filter
    if (filters.hasDemo !== undefined) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.hasDemo! ? !!solution.demoUrl : true
      );
    }

    // GitHub availability filter
    if (filters.hasGithub !== undefined) {
      filteredSolutions = filteredSolutions.filter(solution => 
        filters.hasGithub! ? !!solution.githubUrl : true
      );
    }

    return filteredSolutions;
  }

  /**
   * Search solutions by text query
   */
  searchSolutions(query: string): Solution[] {
    if (!query.trim()) return this.solutions;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return this.solutions.filter(solution => {
      const searchableText = [
        solution.name,
        solution.description,
        solution.category,
        ...solution.subcategories,
        ...solution.tags,
        solution.author
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * Apply sorting to solutions
   */
  sortSolutions(solutions: Solution[], sort: SolutionSort): Solution[] {
    const sortedSolutions = [...solutions];

    sortedSolutions.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'automationPotential':
          aValue = a.automationPotential;
          bValue = b.automationPotential;
          break;
        case 'estimatedROI':
          aValue = this.parseROIValue(a.estimatedROI);
          bValue = this.parseROIValue(b.estimatedROI);
          break;
        case 'timeToValue':
          aValue = this.parseTimeToValue(a.timeToValue);
          bValue = this.parseTimeToValue(b.timeToValue);
          break;
        case 'userRating':
          aValue = a.metrics.userRating;
          bValue = b.metrics.userRating;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          aValue = a.automationPotential;
          bValue = b.automationPotential;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedSolutions;
  }

  /**
   * Get faceted search results
   */
  getFacetedSearchResults(
    query: SearchQuery,
    includeFacets: boolean = true
  ): FacetedSearchResult {
    const startTime = Date.now();

    // Apply filters
    let filteredSolutions = this.applyFilters(query.filters);

    // Apply text search
    if (query.text.trim()) {
      filteredSolutions = this.searchSolutions(query.text);
      // Re-apply filters after search
      filteredSolutions = this.applyFilters(query.filters);
    }

    // Apply sorting
    const sortedSolutions = this.sortSolutions(filteredSolutions, query.sort);

    // Apply pagination
    const { page, pageSize } = query.pagination;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSolutions = sortedSolutions.slice(startIndex, endIndex);

    // Calculate facets
    const facets = includeFacets ? this.calculateFacets(filteredSolutions, query.filters) : this.getEmptyFacets();

    // Calculate pagination info
    const totalPages = Math.ceil(filteredSolutions.length / pageSize);

    const queryTime = Date.now() - startTime;

    return {
      solutions: paginatedSolutions,
      facets,
      pagination: {
        total: filteredSolutions.length,
        page,
        pageSize,
        totalPages
      },
      searchMetadata: {
        queryTime,
        totalResults: this.solutions.length,
        filteredResults: filteredSolutions.length,
        suggestions: this.generateSearchSuggestions(query.text, filteredSolutions)
      }
    };
  }

  /**
   * Calculate facets for filtered results
   */
  private calculateFacets(solutions: Solution[], currentFilters: FilterCriteria): FacetedSearchResult['facets'] {
    const facets = {
      categories: this.calculateFacetCounts(solutions, 'category', currentFilters.category),
      difficulties: this.calculateFacetCounts(solutions, 'difficulty', currentFilters.difficulty),
      setupTimes: this.calculateFacetCounts(solutions, 'setupTime', currentFilters.setupTime),
      deployments: this.calculateFacetCounts(solutions, 'deployment', currentFilters.deployment),
      priorities: this.calculateFacetCounts(solutions, 'implementationPriority', currentFilters.implementationPriority),
      tags: this.calculateTagFacets(solutions, currentFilters.tags),
      priceRanges: this.calculateFacetCounts(solutions, 'pricing', currentFilters.priceRange),
      businessDomains: this.calculateBusinessDomainFacets(solutions, currentFilters.businessDomain),
      authors: this.calculateFacetCounts(solutions, 'author', currentFilters.author)
    };

    return facets;
  }

  /**
   * Calculate facet counts for a specific field
   */
  private calculateFacetCounts(
    solutions: Solution[],
    field: keyof Solution,
    selectedValues?: string[]
  ): FacetCount[] {
    const counts: Record<string, number> = {};
    
    solutions.forEach(solution => {
      const value = solution[field] as string;
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([value, count]) => ({
      value,
      count,
      selected: selectedValues ? selectedValues.includes(value) : false
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate tag facets
   */
  private calculateTagFacets(solutions: Solution[], selectedTags?: string[]): FacetCount[] {
    const tagCounts: Record<string, number> = {};
    
    solutions.forEach(solution => {
      solution.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts).map(([tag, count]) => ({
      value: tag,
      count,
      selected: selectedTags ? selectedTags.includes(tag) : false
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate business domain facets
   */
  private calculateBusinessDomainFacets(solutions: Solution[], selectedDomains?: string[]): FacetCount[] {
    const domainCounts: Record<string, number> = {};
    
    solutions.forEach(solution => {
      // Extract business domain from category
      const domain = this.extractBusinessDomain(solution.category);
      if (domain) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    });

    return Object.entries(domainCounts).map(([domain, count]) => ({
      value: domain,
      count,
      selected: selectedDomains ? selectedDomains.includes(domain) : false
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Extract business domain from category
   */
  private extractBusinessDomain(category: string): string {
    const domainMapping: Record<string, string> = {
      'HR & Recruitment': 'HR',
      'Finance & Accounting': 'Finance',
      'Marketing & Sales': 'Marketing',
      'Customer Support': 'Support',
      'Data Analysis': 'Analytics',
      'Content Creation': 'Content',
      'Project Management': 'Operations',
      'Development & DevOps': 'Development',
      'Research & Analysis': 'Analytics',
      'Communication': 'Operations',
      'General Business': 'Operations'
    };

    return domainMapping[category] || 'Other';
  }

  /**
   * Get empty facets structure
   */
  private getEmptyFacets(): FacetedSearchResult['facets'] {
    return {
      categories: [],
      difficulties: [],
      setupTimes: [],
      deployments: [],
      priorities: [],
      tags: [],
      priceRanges: [],
      businessDomains: [],
      authors: []
    };
  }

  /**
   * Generate search suggestions
   */
  private generateSearchSuggestions(query: string, solutions: Solution[]): string[] {
    if (!query.trim()) return [];

    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Category suggestions
    const categorySuggestions = solutions
      .map(s => s.category)
      .filter(cat => cat.toLowerCase().includes(queryLower))
      .slice(0, 3);

    // Tag suggestions
    const tagSuggestions = solutions
      .flatMap(s => s.tags)
      .filter(tag => tag.toLowerCase().includes(queryLower))
      .slice(0, 3);

    // Author suggestions
    const authorSuggestions = solutions
      .map(s => s.author)
      .filter(author => author.toLowerCase().includes(queryLower))
      .slice(0, 3);

    suggestions.push(...categorySuggestions, ...tagSuggestions, ...authorSuggestions);

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Parse ROI value for sorting
   */
  private parseROIValue(roiString: string): number {
    const match = roiString.match(/(\d+)-(\d+)%/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return (min + max) / 2;
    }
    return 0;
  }

  /**
   * Parse time to value for sorting
   */
  private parseTimeToValue(timeString: string): number {
    if (timeString.includes('1-2 weeks')) return 1;
    if (timeString.includes('2-4 weeks')) return 2;
    if (timeString.includes('4-8 weeks')) return 3;
    if (timeString.includes('8+ weeks')) return 4;
    return 2.5; // Default
  }

  /**
   * Convert setup time to minutes for filtering
   */
  private convertSetupTimeToMinutes(setupTime: string): number {
    switch (setupTime) {
      case 'Quick': return 30;
      case 'Medium': return 120;
      case 'Long': return 480;
      default: return 120;
    }
  }

  /**
   * Get filter suggestions based on current results
   */
  getFilterSuggestions(currentFilters: FilterCriteria): FilterCriteria {
    const suggestions: FilterCriteria = {};

    // Suggest categories that would give good results
    if (!currentFilters.category || currentFilters.category.length === 0) {
      const popularCategories = this.getPopularCategories();
      if (popularCategories.length > 0) {
        suggestions.category = popularCategories.slice(0, 3);
      }
    }

    // Suggest difficulty levels based on automation potential
    if (!currentFilters.difficulty || currentFilters.difficulty.length === 0) {
      if (currentFilters.minAutomationPotential && currentFilters.minAutomationPotential >= 80) {
        suggestions.difficulty = ['Advanced'];
      } else if (currentFilters.minAutomationPotential && currentFilters.minAutomationPotential >= 60) {
        suggestions.difficulty = ['Intermediate'];
      } else {
        suggestions.difficulty = ['Beginner'];
      }
    }

    // Suggest setup time based on priority
    if (!currentFilters.setupTime || currentFilters.setupTime.length === 0) {
      if (currentFilters.implementationPriority && currentFilters.implementationPriority.includes('High')) {
        suggestions.setupTime = ['Quick'];
      } else {
        suggestions.setupTime = ['Quick', 'Medium'];
      }
    }

    return suggestions;
  }

  /**
   * Get popular categories
   */
  private getPopularCategories(): string[] {
    const categoryCounts: Record<string, number> = {};
    
    this.solutions.forEach(solution => {
      categoryCounts[solution.category] = (categoryCounts[solution.category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category);
  }

  /**
   * Clear all filters
   */
  clearFilters(): FilterCriteria {
    return {};
  }

  /**
   * Get available filter options
   */
  getAvailableFilterOptions(): FilterCriteria {
    const options: FilterCriteria = {};

    options.type = [...new Set(this.solutions.map(s => s.type))];
    options.category = [...new Set(this.solutions.map(s => s.category))];
    options.difficulty = [...new Set(this.solutions.map(s => s.difficulty))];
    options.setupTime = [...new Set(this.solutions.map(s => s.setupTime))];
    options.deployment = [...new Set(this.solutions.map(s => s.deployment))];
    options.status = [...new Set(this.solutions.map(s => s.status))];
    options.implementationPriority = [...new Set(this.solutions.map(s => s.implementationPriority))];
    options.priceRange = [...new Set(this.solutions.map(s => s.pricing).filter(Boolean))];
    options.businessDomain = [...new Set(this.solutions.map(s => this.extractBusinessDomain(s.category)))];
    options.author = [...new Set(this.solutions.map(s => s.author))];

    return options;
  }
}

// Factory function to create solution filters
export const createSolutionFilters = (solutions: Solution[]): SolutionFilters => {
  return new SolutionFilters(solutions);
};
