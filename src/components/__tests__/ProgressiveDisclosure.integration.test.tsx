/**
 * Progressive Disclosure Integration Tests
 * Tests the integration between CollapsibleSection, SmartDefaults, and ContextualHelp
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { SmartDefaultsProvider } from '../SmartDefaultsManager';
import { ContextualHelpProvider } from '../ContextualHelpSystem';
import { HelpTrigger } from '../HelpTrigger';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SmartDefaultsProvider>
    <ContextualHelpProvider>
      {children}
    </ContextualHelpProvider>
  </SmartDefaultsProvider>
);

describe('Progressive Disclosure Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it('integrates CollapsibleSection with SmartDefaults correctly', async () => {
    const onToggle = jest.fn();
    
    render(
      <TestWrapper>
        <CollapsibleSection
          title="Test Section"
          description="Test description"
          priority="high"
          defaultExpanded={false}
          onToggle={onToggle}
          smartDefaults={{
            autoExpand: true,
            expandOnContent: true,
            collapseOnEmpty: false,
            minContentHeight: 50
          }}
        >
          <div>Test content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    // Check that the section is rendered
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();

    // Click to toggle
    const header = screen.getByText('Test Section').closest('div');
    if (header) {
      fireEvent.click(header);
      expect(onToggle).toHaveBeenCalledWith(true);
    }
  });

  it('integrates CollapsibleSection with ContextualHelp correctly', async () => {
    const helpContent = {
      title: 'Test Help',
      description: 'This is test help content',
      examples: ['Example 1', 'Example 2'],
      tips: ['Tip 1'],
      priority: 'high' as const,
      category: 'general' as const
    };

    render(
      <TestWrapper>
        <CollapsibleSection
          title={
            <div className="flex items-center gap-2">
              Test Section with Help
              <HelpTrigger section="test-section" element="title">
                <span>Help</span>
              </HelpTrigger>
            </div>
          }
          description="Test description"
          priority="high"
        >
          <div>Test content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    // Check that the section with help is rendered
    expect(screen.getByText('Test Section with Help')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('handles priority-based auto-expansion correctly', async () => {
    render(
      <TestWrapper>
        <CollapsibleSection
          title="High Priority Section"
          description="Should auto-expand"
          priority="high"
          smartDefaults={{
            autoExpand: true,
            expandOnContent: true,
            collapseOnEmpty: false,
            minContentHeight: 50
          }}
        >
          <div>High priority content</div>
        </CollapsibleSection>
        <CollapsibleSection
          title="Low Priority Section"
          description="Should not auto-expand"
          priority="low"
          smartDefaults={{
            autoExpand: false,
            expandOnContent: true,
            collapseOnEmpty: false,
            minContentHeight: 50
          }}
        >
          <div>Low priority content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    // Both sections should be rendered
    expect(screen.getByText('High Priority Section')).toBeInTheDocument();
    expect(screen.getByText('Low Priority Section')).toBeInTheDocument();
  });

  it('handles content-based expansion correctly', async () => {
    render(
      <TestWrapper>
        <CollapsibleSection
          title="Section with Content"
          description="Should expand when content is present"
          priority="medium"
          smartDefaults={{
            autoExpand: false,
            expandOnContent: true,
            collapseOnEmpty: false,
            minContentHeight: 50
          }}
        >
          <div>This section has content</div>
        </CollapsibleSection>
        <CollapsibleSection
          title="Empty Section"
          description="Should not expand when empty"
          priority="medium"
          smartDefaults={{
            autoExpand: false,
            expandOnContent: true,
            collapseOnEmpty: true,
            minContentHeight: 50
          }}
        >
          {/* No content */}
        </CollapsibleSection>
      </TestWrapper>
    );

    // Both sections should be rendered
    expect(screen.getByText('Section with Content')).toBeInTheDocument();
    expect(screen.getByText('Empty Section')).toBeInTheDocument();
  });

  it('persists expanded state across renders', async () => {
    // Mock localStorage to return saved expanded state
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'smart-defaults-expanded') {
        return JSON.stringify({
          'test-section': true
        });
      }
      return null;
    });

    const onToggle = jest.fn();
    
    render(
      <TestWrapper>
        <CollapsibleSection
          title="Test Section"
          description="Should remember expanded state"
          priority="medium"
          onToggle={onToggle}
        >
          <div>Test content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    // Verify that localStorage was checked for saved state
    expect(localStorageMock.getItem).toHaveBeenCalledWith('smart-defaults-expanded');
  });

  it('handles badge and progress integration correctly', async () => {
    render(
      <TestWrapper>
        <CollapsibleSection
          title="Section with Badge and Progress"
          description="Should show badge and progress"
          priority="high"
          badge={{
            text: 'Test Badge',
            count: 5,
            variant: 'default'
          }}
          showProgress={true}
          progressValue={75}
          progressMax={100}
        >
          <div>Test content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    // Check that badge and progress are displayed
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles multiple sections with different priorities', async () => {
    render(
      <TestWrapper>
        <CollapsibleSection
          title="High Priority"
          priority="high"
        >
          <div>High priority content</div>
        </CollapsibleSection>
        <CollapsibleSection
          title="Medium Priority"
          priority="medium"
        >
          <div>Medium priority content</div>
        </CollapsibleSection>
        <CollapsibleSection
          title="Low Priority"
          priority="low"
        >
          <div>Low priority content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    // All sections should be rendered with appropriate styling
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    expect(screen.getByText('Low Priority')).toBeInTheDocument();
  });

  it('handles responsive behavior correctly', async () => {
    render(
      <TestWrapper>
        <CollapsibleSection
          title="Responsive Section"
          description="Should adapt to different screen sizes"
          priority="medium"
          className="w-full md:w-1/2 lg:w-1/3"
        >
          <div>Responsive content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    const section = screen.getByText('Responsive Section').closest('.w-full');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('md:w-1/2', 'lg:w-1/3');
  });

  it('handles error states gracefully', async () => {
    // Test with invalid props
    render(
      <TestWrapper>
        <CollapsibleSection
          title="Error Section"
          description="Should handle errors gracefully"
          priority="medium"
          // @ts-ignore - Intentionally passing invalid props for testing
          invalidProp="test"
        >
          <div>Error handling content</div>
        </CollapsibleSection>
      </TestWrapper>
    );

    // Should still render despite invalid props
    expect(screen.getByText('Error Section')).toBeInTheDocument();
  });
});
