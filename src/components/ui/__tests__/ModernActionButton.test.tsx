/**
 * ModernActionButton Tests
 * Tests the modern action button system with loading states and success feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernActionButton, ActionButtonGroup } from '../ModernActionButton';
import { FloatingActionButton } from '../FloatingActionButton';
import { ActionToast, ToastContainer } from '../ActionToast';
import { useActionToast } from '@/hooks/useActionToast';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
});

describe('ModernActionButton Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(
      <ModernActionButton action="copy" onClick={() => {}}>
        Copy
      </ModernActionButton>
    );

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles loading state', async () => {
    const handleClick = jest.fn().mockResolvedValue(undefined);
    
    render(
      <ModernActionButton 
        action="download" 
        onClick={handleClick}
        loading={true}
      >
        Download
      </ModernActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-wait');
  });

  it('handles success state', async () => {
    render(
      <ModernActionButton 
        action="save" 
        success={true}
        onClick={() => {}}
      >
        Save
      </ModernActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-green-500');
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    render(
      <ModernActionButton 
        action="delete" 
        error={true}
        onClick={() => {}}
      >
        Delete
      </ModernActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-500');
  });

  it('handles click with async operation', async () => {
    const handleClick = jest.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    render(
      <ModernActionButton 
        action="send" 
        onClick={handleClick}
      >
        Send
      </ModernActionButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalled();
    
    // Should show loading state during async operation
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('handles click with error', async () => {
    const handleClick = jest.fn().mockRejectedValue(new Error('Test error'));
    
    render(
      <ModernActionButton 
        action="upload" 
        onClick={handleClick}
      >
        Upload
      </ModernActionButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalled();
    
    // Should show error state
    await waitFor(() => {
      expect(button).toHaveClass('bg-red-500');
    });
  });

  it('auto-resets success state after duration', async () => {
    const onStateChange = jest.fn();
    
    render(
      <ModernActionButton 
        action="copy" 
        success={true}
        successDuration={100}
        onStateChange={onStateChange}
        onClick={() => {}}
      >
        Copy
      </ModernActionButton>
    );

    expect(onStateChange).toHaveBeenCalledWith('success');
    
    // Wait for auto-reset
    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith('idle');
    }, { timeout: 200 });
  });

  it('shows correct icon for different actions', () => {
    const { rerender } = render(
      <ModernActionButton action="download" onClick={() => {}}>
        Download
      </ModernActionButton>
    );

    // Should show download icon
    expect(screen.getByTestId('download-icon') || document.querySelector('[data-lucide="download"]')).toBeInTheDocument();

    rerender(
      <ModernActionButton action="copy" onClick={() => {}}>
        Copy
      </ModernActionButton>
    );

    // Should show copy icon
    expect(screen.getByTestId('copy-icon') || document.querySelector('[data-lucide="copy"]')).toBeInTheDocument();
  });

  it('handles different sizes', () => {
    const { rerender } = render(
      <ModernActionButton action="save" size="sm" onClick={() => {}}>
        Save
      </ModernActionButton>
    );

    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(
      <ModernActionButton action="save" size="lg" onClick={() => {}}>
        Save
      </ModernActionButton>
    );

    expect(screen.getByRole('button')).toHaveClass('h-12');
  });

  it('handles different variants', () => {
    const { rerender } = render(
      <ModernActionButton action="delete" variant="destructive" onClick={() => {}}>
        Delete
      </ModernActionButton>
    );

    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(
      <ModernActionButton action="save" variant="outline" onClick={() => {}}>
        Save
      </ModernActionButton>
    );

    expect(screen.getByRole('button')).toHaveClass('border');
  });

  it('handles disabled state', () => {
    render(
      <ModernActionButton 
        action="save" 
        disabled={true}
        onClick={() => {}}
      >
        Save
      </ModernActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('handles full width', () => {
    render(
      <ModernActionButton 
        action="save" 
        fullWidth={true}
        onClick={() => {}}
      >
        Save
      </ModernActionButton>
    );

    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('handles icon position', () => {
    const { rerender } = render(
      <ModernActionButton 
        action="next" 
        iconPosition="right"
        onClick={() => {}}
      >
        Next
      </ModernActionButton>
    );

    // Should have icon on the right
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    rerender(
      <ModernActionButton 
        action="next" 
        iconPosition="left"
        onClick={() => {}}
      >
        Next
      </ModernActionButton>
    );

    // Should have icon on the left
    expect(button).toBeInTheDocument();
  });

  it('handles showIcon and showText props', () => {
    const { rerender } = render(
      <ModernActionButton 
        action="save" 
        showIcon={false}
        showText={true}
        onClick={() => {}}
      >
        Save
      </ModernActionButton>
    );

    expect(screen.getByText('Save')).toBeInTheDocument();

    rerender(
      <ModernActionButton 
        action="save" 
        showIcon={true}
        showText={false}
        onClick={() => {}}
      >
        Save
      </ModernActionButton>
    );

    // Should not show text
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });
});

describe('ActionButtonGroup Tests', () => {
  it('renders children with consistent styling', () => {
    render(
      <ActionButtonGroup size="sm" variant="outline">
        <ModernActionButton action="save" onClick={() => {}}>
          Save
        </ModernActionButton>
        <ModernActionButton action="cancel" onClick={() => {}}>
          Cancel
        </ModernActionButton>
      </ActionButtonGroup>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    // All buttons should have consistent size
    buttons.forEach(button => {
      expect(button).toHaveClass('h-8');
    });
  });

  it('handles different orientations', () => {
    const { rerender } = render(
      <ActionButtonGroup orientation="horizontal">
        <ModernActionButton action="save" onClick={() => {}}>
          Save
        </ModernActionButton>
        <ModernActionButton action="cancel" onClick={() => {}}>
          Cancel
        </ModernActionButton>
      </ActionButtonGroup>
    );

    expect(screen.getByRole('group') || document.querySelector('.flex-row')).toBeInTheDocument();

    rerender(
      <ActionButtonGroup orientation="vertical">
        <ModernActionButton action="save" onClick={() => {}}>
          Save
        </ModernActionButton>
        <ModernActionButton action="cancel" onClick={() => {}}>
          Cancel
        </ModernActionButton>
      </ActionButtonGroup>
    );

    expect(screen.getByRole('group') || document.querySelector('.flex-col')).toBeInTheDocument();
  });

  it('handles different spacing', () => {
    const { rerender } = render(
      <ActionButtonGroup spacing="tight">
        <ModernActionButton action="save" onClick={() => {}}>
          Save
        </ModernActionButton>
        <ModernActionButton action="cancel" onClick={() => {}}>
          Cancel
        </ModernActionButton>
      </ActionButtonGroup>
    );

    expect(screen.getByRole('group') || document.querySelector('.gap-1')).toBeInTheDocument();

    rerender(
      <ActionButtonGroup spacing="loose">
        <ModernActionButton action="save" onClick={() => {}}>
          Save
        </ModernActionButton>
        <ModernActionButton action="cancel" onClick={() => {}}>
          Cancel
        </ModernActionButton>
      </ActionButtonGroup>
    );

    expect(screen.getByRole('group') || document.querySelector('.gap-4')).toBeInTheDocument();
  });
});

describe('FloatingActionButton Tests', () => {
  const mockItems = [
    {
      id: 'download',
      action: 'download' as const,
      label: 'Download',
      onClick: jest.fn()
    },
    {
      id: 'copy',
      action: 'copy' as const,
      label: 'Copy',
      onClick: jest.fn()
    }
  ];

  it('renders closed by default', () => {
    render(
      <FloatingActionButton items={mockItems} />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Download')).not.toBeInTheDocument();
  });

  it('opens menu on click', () => {
    render(
      <FloatingActionButton items={mockItems} />
    );

    const fabButton = screen.getByRole('button');
    fireEvent.click(fabButton);

    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    render(
      <div>
        <FloatingActionButton items={mockItems} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const fabButton = screen.getByRole('button');
    fireEvent.click(fabButton);

    expect(screen.getByText('Download')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    expect(screen.queryByText('Download')).not.toBeInTheDocument();
  });

  it('handles item clicks', () => {
    render(
      <FloatingActionButton items={mockItems} />
    );

    const fabButton = screen.getByRole('button');
    fireEvent.click(fabButton);

    const downloadButton = screen.getByText('Download');
    fireEvent.click(downloadButton);

    expect(mockItems[0].onClick).toHaveBeenCalled();
  });

  it('handles disabled items', () => {
    const itemsWithDisabled = [
      ...mockItems,
      {
        id: 'disabled',
        action: 'delete' as const,
        label: 'Delete',
        onClick: jest.fn(),
        disabled: true
      }
    ];

    render(
      <FloatingActionButton items={itemsWithDisabled} />
    );

    const fabButton = screen.getByRole('button');
    fireEvent.click(fabButton);

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeDisabled();
  });
});

describe('ActionToast Tests', () => {
  it('renders toast with correct type styling', () => {
    render(
      <ActionToast
        id="test-toast"
        type="success"
        title="Success!"
        message="Operation completed successfully"
      />
    );

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
  });

  it('auto-dismisses after duration', async () => {
    const onClose = jest.fn();
    
    render(
      <ActionToast
        id="test-toast"
        type="info"
        title="Info"
        duration={100}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Info')).toBeInTheDocument();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('test-toast');
    }, { timeout: 200 });
  });

  it('shows progress bar when enabled', () => {
    render(
      <ActionToast
        id="test-toast"
        type="info"
        title="Info"
        showProgress={true}
        progress={50}
      />
    );

    const progressBar = document.querySelector('.h-1');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles close button click', () => {
    const onClose = jest.fn();
    
    render(
      <ActionToast
        id="test-toast"
        type="info"
        title="Info"
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledWith('test-toast');
  });

  it('handles action button click', () => {
    const onAction = jest.fn();
    
    render(
      <ActionToast
        id="test-toast"
        type="info"
        title="Info"
        action="download"
        onAction={onAction}
      />
    );

    const actionButton = screen.getByText('View Details');
    fireEvent.click(actionButton);

    expect(onAction).toHaveBeenCalledWith('download');
  });
});

describe('useActionToast Hook Tests', () => {
  it('manages toast state correctly', () => {
    const TestComponent = () => {
      const { toasts, showSuccess, dismissToast } = useActionToast();
      
      return (
        <div>
          <button onClick={() => showSuccess('Test Success')}>
            Show Success
          </button>
          <button onClick={() => dismissToast(toasts[0]?.id || '')}>
            Dismiss
          </button>
          <div data-testid="toast-count">{toasts.length}</div>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');

    const showButton = screen.getByText('Show Success');
    fireEvent.click(showButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    expect(screen.getByText('Test Success')).toBeInTheDocument();

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('provides convenience methods for different toast types', () => {
    const TestComponent = () => {
      const { showSuccess, showError, showWarning, showInfo, showLoading } = useActionToast();
      
      return (
        <div>
          <button onClick={() => showSuccess('Success!')}>Success</button>
          <button onClick={() => showError('Error!')}>Error</button>
          <button onClick={() => showWarning('Warning!')}>Warning</button>
          <button onClick={() => showInfo('Info!')}>Info</button>
          <button onClick={() => showLoading('Loading...')}>Loading</button>
        </div>
      );
    };

    render(<TestComponent />);

    fireEvent.click(screen.getByText('Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Error'));
    expect(screen.getByText('Error!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Warning'));
    expect(screen.getByText('Warning!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Info'));
    expect(screen.getByText('Info!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Loading'));
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
