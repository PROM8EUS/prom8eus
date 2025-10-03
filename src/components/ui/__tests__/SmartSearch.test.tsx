/**
 * SmartSearch and SmartFilter Tests
 * Tests the smart search and filter system with advanced functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartSearch } from '../SmartSearch';
import { SmartFilter } from '../SmartFilter';
import { useSmartSearch } from '@/hooks/useSmartSearch';

// Mock data for testing
const mockData = [
  {
    id: '1',
    title: 'Email Automation',
    description: 'Automate email workflows',
    status: 'verified',
    complexity: 'Low',
    integrations: ['Gmail', 'Slack'],
    category: 'Communication'
  },
  {
    id: '2',
    title: 'Data Processing',
    description: 'Process and analyze data',
    status: 'generated',
    complexity: 'High',
    integrations: ['Database', 'API'],
    category: 'Data'
  },
  {
    id: '3',
    title: 'File Management',
    description: 'Manage files and documents',
    status: 'fallback',
    complexity: 'Medium',
    integrations: ['Google Drive', 'Dropbox'],
    category: 'Storage'
  }
];

const mockFilterConfigs = [
  {
    id: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'verified', label: 'Verified', count: 1 },
      { value: 'generated', label: 'Generated', count: 1 },
      { value: 'fallback', label: 'Fallback', count: 1 }
    ]
  },
  {
    id: 'complexity',
    label: 'Complexity',
    type: 'multiselect' as const,
    options: [
      { value: 'Low', label: 'Low', count: 1 },
      { value: 'Medium', label: 'Medium', count: 1 },
      { value: 'High', label: 'High', count: 1 }
    ]
  }
];

const mockSortConfigs = [
  {
    id: 'title',
    label: 'Title',
    field: 'title',
    direction: 'asc' as const
  },
  {
    id: 'complexity',
    label: 'Complexity',
    field: 'complexity',
    direction: 'desc' as const
  }
];

describe('SmartSearch Tests', () => {
  it('renders search input with placeholder', () => {
    render(
      <SmartSearch
        value=""
        onChange={() => {}}
        placeholder="Search items..."
      />
    );

    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    const onChange = jest.fn();
    
    render(
      <SmartSearch
        value=""
        onChange={onChange}
        placeholder="Search items..."
      />
    );

    const input = screen.getByPlaceholderText('Search items...');
    fireEvent.change(input, { target: { value: 'test search' } });

    expect(onChange).toHaveBeenCalledWith('test search');
  });

  it('shows suggestions when typing', async () => {
    const suggestions = [
      {
        id: '1',
        text: 'Email Automation',
        type: 'suggestion' as const,
        category: 'Suggestions'
      }
    ];

    render(
      <SmartSearch
        value="email"
        onChange={() => {}}
        suggestions={suggestions}
        showSuggestions={true}
      />
    );

    // Should show suggestions dropdown
    await waitFor(() => {
      expect(screen.getByText('Email Automation')).toBeInTheDocument();
    });
  });

  it('handles suggestion selection', async () => {
    const onSuggestionSelect = jest.fn();
    const suggestions = [
      {
        id: '1',
        text: 'Email Automation',
        type: 'suggestion' as const,
        category: 'Suggestions'
      }
    ];

    render(
      <SmartSearch
        value="email"
        onChange={() => {}}
        onSuggestionSelect={onSuggestionSelect}
        suggestions={suggestions}
        showSuggestions={true}
      />
    );

    await waitFor(() => {
      const suggestion = screen.getByText('Email Automation');
      fireEvent.click(suggestion);
    });

    expect(onSuggestionSelect).toHaveBeenCalledWith(suggestions[0]);
  });

  it('handles keyboard navigation', () => {
    const suggestions = [
      {
        id: '1',
        text: 'Email Automation',
        type: 'suggestion' as const,
        category: 'Suggestions'
      },
      {
        id: '2',
        text: 'Data Processing',
        type: 'suggestion' as const,
        category: 'Suggestions'
      }
    ];

    render(
      <SmartSearch
        value="test"
        onChange={() => {}}
        suggestions={suggestions}
        showSuggestions={true}
      />
    );

    const input = screen.getByRole('combobox');
    
    // Arrow down should select first suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByText('Email Automation')).toHaveClass('bg-primary/10');
    
    // Arrow down again should select second suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByText('Data Processing')).toHaveClass('bg-primary/10');
    
    // Arrow up should go back to first
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getByText('Email Automation')).toHaveClass('bg-primary/10');
  });

  it('handles escape key', () => {
    const onChange = jest.fn();
    
    render(
      <SmartSearch
        value="test"
        onChange={onChange}
        clearOnEscape={true}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows clear button when there is text', () => {
    render(
      <SmartSearch
        value="test"
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    const onChange = jest.fn();
    
    render(
      <SmartSearch
        value="test"
        onChange={onChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('SmartFilter Tests', () => {
  it('renders filters with correct labels', () => {
    render(
      <SmartFilter
        filters={mockFilterConfigs}
        values={{}}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Complexity')).toBeInTheDocument();
  });

  it('handles filter changes', () => {
    const onChange = jest.fn();
    
    render(
      <SmartFilter
        filters={mockFilterConfigs}
        values={{}}
        onChange={onChange}
      />
    );

    const statusFilter = screen.getByText('Status');
    fireEvent.click(statusFilter);

    // Should open dropdown
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
    // Click on verified option
    fireEvent.click(screen.getByText('Verified'));
    
    expect(onChange).toHaveBeenCalledWith({ status: 'verified' });
  });

  it('handles multiselect filters', () => {
    const onChange = jest.fn();
    
    render(
      <SmartFilter
        filters={mockFilterConfigs}
        values={{}}
        onChange={onChange}
      />
    );

    const complexityFilter = screen.getByText('Complexity');
    fireEvent.click(complexityFilter);

    // Should open dropdown
    expect(screen.getByText('Low')).toBeInTheDocument();
    
    // Click on Low option
    fireEvent.click(screen.getByText('Low'));
    
    expect(onChange).toHaveBeenCalledWith({ complexity: ['Low'] });
  });

  it('shows active filter count', () => {
    render(
      <SmartFilter
        filters={mockFilterConfigs}
        values={{ status: 'verified', complexity: ['Low'] }}
        onChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Active filters count
    expect(screen.getByText('5 of 10 results')).toBeInTheDocument();
  });

  it('handles clear all filters', () => {
    const onChange = jest.fn();
    
    render(
      <SmartFilter
        filters={mockFilterConfigs}
        values={{ status: 'verified' }}
        onChange={onChange}
      />
    );

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith({});
  });

  it('handles sort options', () => {
    const onSortChange = jest.fn();
    
    render(
      <SmartFilter
        filters={mockFilterConfigs}
        sortOptions={mockSortConfigs}
        values={{}}
        onChange={() => {}}
        onSortChange={onSortChange}
      />
    );

    const sortButton = screen.getByText('Title');
    fireEvent.click(sortButton);

    expect(onSortChange).toHaveBeenCalledWith(mockSortConfigs[0]);
  });

  it('handles collapsible filters', () => {
    render(
      <SmartFilter
        filters={mockFilterConfigs}
        values={{}}
        onChange={() => {}}
        collapsible={true}
        defaultCollapsed={true}
      />
    );

    // Should be collapsed by default
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    
    // Click to expand
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Should now show filters
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

describe('useSmartSearch Hook Tests', () => {
  it('filters data based on search query', () => {
    const TestComponent = () => {
      const { searchQuery, setSearchQuery, filteredData } = useSmartSearch({
        data: mockData,
        searchFields: ['title', 'description'],
        filterConfigs: mockFilterConfigs
      });

      return (
        <div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
          />
          <div data-testid="results">
            {filteredData.map(item => (
              <div key={item.id}>{item.title}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    const input = screen.getByPlaceholderText('Search...');
    const results = screen.getByTestId('results');

    // Initially should show all items
    expect(results.children).toHaveLength(3);

    // Search for "email" should filter to 1 item
    fireEvent.change(input, { target: { value: 'email' } });
    
    // Wait for debounced search
    waitFor(() => {
      expect(results.children).toHaveLength(1);
      expect(screen.getByText('Email Automation')).toBeInTheDocument();
    });
  });

  it('filters data based on filter values', () => {
    const TestComponent = () => {
      const { filterValues, setFilterValues, filteredData } = useSmartSearch({
        data: mockData,
        searchFields: ['title', 'description'],
        filterConfigs: mockFilterConfigs
      });

      return (
        <div>
          <button onClick={() => setFilterValues({ status: 'verified' })}>
            Filter Verified
          </button>
          <div data-testid="results">
            {filteredData.map(item => (
              <div key={item.id}>{item.title}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    const results = screen.getByTestId('results');
    const filterButton = screen.getByText('Filter Verified');

    // Initially should show all items
    expect(results.children).toHaveLength(3);

    // Filter by verified status
    fireEvent.click(filterButton);
    
    // Should show only verified items
    expect(results.children).toHaveLength(1);
    expect(screen.getByText('Email Automation')).toBeInTheDocument();
  });

  it('sorts data based on sort configuration', () => {
    const TestComponent = () => {
      const { sortConfig, setSortConfig, filteredData } = useSmartSearch({
        data: mockData,
        searchFields: ['title', 'description'],
        filterConfigs: mockFilterConfigs,
        sortConfigs: mockSortConfigs
      });

      return (
        <div>
          <button onClick={() => setSortConfig(mockSortConfigs[0])}>
            Sort by Title
          </button>
          <div data-testid="results">
            {filteredData.map(item => (
              <div key={item.id}>{item.title}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    const results = screen.getByTestId('results');
    const sortButton = screen.getByText('Sort by Title');

    // Sort by title
    fireEvent.click(sortButton);
    
    // Should be sorted alphabetically
    const items = Array.from(results.children).map(child => child.textContent);
    expect(items).toEqual(['Data Processing', 'Email Automation', 'File Management']);
  });

  it('generates search suggestions', () => {
    const TestComponent = () => {
      const { searchQuery, setSearchQuery, searchSuggestions } = useSmartSearch({
        data: mockData,
        searchFields: ['title', 'description'],
        filterConfigs: mockFilterConfigs
      });

      return (
        <div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
          />
          <div data-testid="suggestions">
            {searchSuggestions.map(suggestion => (
              <div key={suggestion.id}>{suggestion.text}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    const input = screen.getByPlaceholderText('Search...');
    const suggestions = screen.getByTestId('suggestions');

    // Type to trigger suggestions
    fireEvent.change(input, { target: { value: 'email' } });
    
    // Wait for debounced search
    waitFor(() => {
      expect(suggestions.children.length).toBeGreaterThan(0);
    });
  });

  it('manages search history', () => {
    const TestComponent = () => {
      const { searchQuery, setSearchQuery, recentSearches, addToHistory } = useSmartSearch({
        data: mockData,
        searchFields: ['title', 'description'],
        filterConfigs: mockFilterConfigs,
        enableHistory: true
      });

      return (
        <div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
          />
          <button onClick={() => addToHistory('test search')}>
            Add to History
          </button>
          <div data-testid="history">
            {recentSearches.map((search, index) => (
              <div key={index}>{search}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<TestComponent />);

    const addButton = screen.getByText('Add to History');
    const history = screen.getByTestId('history');

    // Add to history
    fireEvent.click(addButton);
    
    // Should show in history
    expect(history.children).toHaveLength(1);
    expect(screen.getByText('test search')).toBeInTheDocument();
  });
});
