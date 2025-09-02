import React, { useState, useEffect } from 'react';
import { SolutionFilter, FilterCriteria } from '../lib/solutions/solutionFilters';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface SolutionFiltersProps {
  filters: SolutionFilter;
  onFiltersChange: (filters: SolutionFilter) => void;
  onClearFilters: () => void;
  availableOptions: FilterCriteria;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-medium text-left hover:text-foreground transition-colors"
      >
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="space-y-3 pl-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SolutionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  availableOptions
}: SolutionFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SolutionFilter>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof SolutionFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updateArrayFilter = (key: keyof SolutionFilter, value: string, checked: boolean) => {
    const currentValues = (localFilters[key] as string[]) || [];
    let newValues: string[];

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }

    updateFilter(key, newValues.length > 0 ? newValues : undefined);
  };

  const updateRangeFilter = (key: keyof SolutionFilter, value: number[]) => {
    updateFilter(key, value[0]);
  };

  const clearSection = (sectionKey: keyof SolutionFilter) => {
    const newFilters = { ...localFilters };
    delete newFilters[sectionKey];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key => filters[key as keyof SolutionFilter] !== undefined).length;
  };

  const renderCheckboxGroup = (
    key: keyof SolutionFilter,
    options: string[],
    label: string
  ) => {
    const currentValues = (localFilters[key] as string[]) || [];

    return (
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${key}-${option}`}
              checked={currentValues.includes(option)}
              onCheckedChange={(checked) => 
                updateArrayFilter(key, option, checked as boolean)
              }
            />
            <Label 
              htmlFor={`${key}-${option}`} 
              className="text-sm font-normal cursor-pointer"
            >
              {option}
            </Label>
          </div>
        ))}
      </div>
    );
  };

  const renderSliderFilter = (
    key: keyof SolutionFilter,
    min: number,
    max: number,
    step: number,
    label: string,
    suffix?: string
  ) => {
    const currentValue = localFilters[key] as number || min;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{label}</Label>
          <Badge variant="secondary">
            {currentValue}{suffix}
          </Badge>
        </div>
        <Slider
          value={[currentValue]}
          onValueChange={(value) => updateRangeFilter(key, value)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{min}{suffix}</span>
          <span>{max}{suffix}</span>
        </div>
      </div>
    );
  };

  const renderRatingFilter = () => {
    const currentRating = localFilters.minRating || 0;
    const ratings = [1, 2, 3, 4, 5];

    return (
      <div className="space-y-2">
        {ratings.map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <Checkbox
              id={`rating-${rating}`}
              checked={currentRating >= rating}
              onCheckedChange={(checked) => 
                updateFilter('minRating', checked ? rating : undefined)
              }
            />
            <Label 
              htmlFor={`rating-${rating}`} 
              className="text-sm font-normal cursor-pointer flex items-center gap-1"
            >
              {rating} {renderStars(rating)}
            </Label>
          </div>
        ))}
      </div>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              "h-3 w-3",
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            )}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderTextFilter = (
    key: keyof SolutionFilter,
    placeholder: string,
    label: string
  ) => {
    const currentValue = localFilters[key] as string || '';

    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}</Label>
        <Input
          placeholder={placeholder}
          value={currentValue}
          onChange={(e) => updateFilter(key, e.target.value || undefined)}
          className="h-8"
        />
      </div>
    );
  };

  const renderBooleanFilter = (
    key: keyof SolutionFilter,
    label: string
  ) => {
    const currentValue = localFilters[key] as boolean;

    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={key}
          checked={currentValue || false}
          onCheckedChange={(checked) => updateFilter(key, checked || undefined)}
        />
        <Label 
          htmlFor={key} 
          className="text-sm font-normal cursor-pointer"
        >
          {label}
        </Label>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFilterCount()}
            </Badge>
          )}
        </div>
        
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Solution Type */}
      <FilterSection title="Solution Type">
        {renderCheckboxGroup('type', ['workflow', 'agent'], 'Type')}
      </FilterSection>

      <Separator />

      {/* Category */}
      {availableOptions.category && availableOptions.category.length > 0 && (
        <>
          <FilterSection title="Category">
            {renderCheckboxGroup('category', availableOptions.category, 'Category')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Difficulty */}
      {availableOptions.difficulty && availableOptions.difficulty.length > 0 && (
        <>
          <FilterSection title="Difficulty">
            {renderCheckboxGroup('difficulty', availableOptions.difficulty, 'Difficulty')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Setup Time */}
      {availableOptions.setupTime && availableOptions.setupTime.length > 0 && (
        <>
          <FilterSection title="Setup Time">
            {renderCheckboxGroup('setupTime', availableOptions.setupTime, 'Setup Time')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Deployment */}
      {availableOptions.deployment && availableOptions.deployment.length > 0 && (
        <>
          <FilterSection title="Deployment">
            {renderCheckboxGroup('deployment', availableOptions.deployment, 'Deployment')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Status */}
      {availableOptions.status && availableOptions.status.length > 0 && (
        <>
          <FilterSection title="Status">
            {renderCheckboxGroup('status', availableOptions.status, 'Status')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Implementation Priority */}
      {availableOptions.implementationPriority && availableOptions.implementationPriority.length > 0 && (
        <>
          <FilterSection title="Priority">
            {renderCheckboxGroup('implementationPriority', availableOptions.implementationPriority, 'Priority')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Automation Potential */}
      <FilterSection title="Automation Potential">
        {renderSliderFilter(
          'minAutomationPotential',
          0,
          100,
          5,
          'Minimum Automation Potential',
          '%'
        )}
      </FilterSection>

      <Separator />

      {/* User Rating */}
      <FilterSection title="User Rating">
        {renderRatingFilter()}
      </FilterSection>

      <Separator />

      {/* Price Range */}
      {availableOptions.priceRange && availableOptions.priceRange.length > 0 && (
        <>
          <FilterSection title="Price Range">
            {renderCheckboxGroup('priceRange', availableOptions.priceRange, 'Price')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Business Domain */}
      {availableOptions.businessDomain && availableOptions.businessDomain.length > 0 && (
        <>
          <FilterSection title="Business Domain">
            {renderCheckboxGroup('businessDomain', availableOptions.businessDomain, 'Domain')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Author */}
      {availableOptions.author && availableOptions.author.length > 0 && (
        <>
          <FilterSection title="Author">
            {renderCheckboxGroup('author', availableOptions.author, 'Author')}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Features */}
      <FilterSection title="Features">
        {renderBooleanFilter('hasDocumentation', 'Has Documentation')}
        {renderBooleanFilter('hasDemo', 'Has Demo')}
        {renderBooleanFilter('hasGithub', 'Has GitHub')}
      </FilterSection>

      <Separator />

      {/* Tags */}
      <FilterSection title="Tags">
        {renderTextFilter('tags', 'Enter tag names...', 'Tags (comma-separated)')}
      </FilterSection>

      {/* Search Query */}
      <FilterSection title="Search">
        {renderTextFilter('searchQuery', 'Enter search terms...', 'Search Query')}
      </FilterSection>

      {/* Setup Time (minutes) */}
      <FilterSection title="Setup Time">
        {renderSliderFilter(
          'maxSetupTime',
          0,
          480,
          30,
          'Maximum Setup Time',
          ' min'
        )}
      </FilterSection>

      {/* Active Filters Summary */}
      {getActiveFilterCount() > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (value === undefined) return null;
                
                let displayValue = '';
                if (Array.isArray(value)) {
                  displayValue = value.join(', ');
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else {
                  displayValue = String(value);
                }

                return (
                  <Badge
                    key={key}
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                  >
                    {key}: {displayValue}
                    <button
                      onClick={() => clearSection(key as keyof SolutionFilter)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
