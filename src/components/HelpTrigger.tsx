/**
 * HelpTrigger Component
 * Easy-to-use component for adding contextual help to any element
 */

import React from 'react';
import { SmartTooltip } from './ui/SmartTooltip';
import { useContextualHelp } from './ContextualHelpSystem';
import { HelpCircle } from 'lucide-react';

interface HelpTriggerProps {
  section: string;
  element?: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'info' | 'warning' | 'success' | 'help';
  showIcon?: boolean;
  lang?: 'de' | 'en';
}

export function HelpTrigger({
  section,
  element,
  children,
  className = '',
  size = 'sm',
  variant = 'help',
  showIcon = true,
  lang = 'en'
}: HelpTriggerProps) {
  const { getContextualHelp, trackUserAction, showHints } = useContextualHelp();

  const helpContent = getContextualHelp(section, element);

  if (!helpContent || !showHints) {
    return children ? <>{children}</> : null;
  }

  const handleHelpOpen = () => {
    trackUserAction('help-opened', section, element);
  };

  const handleHelpClose = () => {
    trackUserAction('help-closed', section, element);
  };

  return (
    <SmartTooltip
      content={helpContent}
      trigger="click"
      size={size}
      variant={variant}
      showIcon={showIcon}
      persistent={false}
      onOpen={handleHelpOpen}
      onClose={handleHelpClose}
      lang={lang}
      className={className}
    >
      {children || (
        <div className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
          <HelpCircle className="h-4 w-4" />
        </div>
      )}
    </SmartTooltip>
  );
}

// Convenience components for common use cases
export function SectionHelp({ section, element, lang = 'en' }: { section: string; element?: string; lang?: 'de' | 'en' }) {
  return (
    <HelpTrigger
      section={section}
      element={element}
      size="md"
      variant="help"
      lang={lang}
    />
  );
}

export function InlineHelp({ section, element, lang = 'en' }: { section: string; element?: string; lang?: 'de' | 'en' }) {
  return (
    <HelpTrigger
      section={section}
      element={element}
      size="sm"
      variant="info"
      showIcon={true}
      lang={lang}
    />
  );
}

export function WarningHelp({ section, element, lang = 'en' }: { section: string; element?: string; lang?: 'de' | 'en' }) {
  return (
    <HelpTrigger
      section={section}
      element={element}
      size="md"
      variant="warning"
      lang={lang}
    />
  );
}

export default HelpTrigger;
