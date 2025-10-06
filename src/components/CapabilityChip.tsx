import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CapabilityChipProps {
  capability: string;
  displayName?: string;
  description?: string;
  category?: string;
  isCore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Capability display names and descriptions
const capabilityInfo: Record<string, { displayName: string; description: string; category: string; isCore: boolean }> = {
  // Core capabilities
  'web_search': { displayName: 'Web Search', description: 'Search the internet for information', category: 'data_access', isCore: true },
  'data_analysis': { displayName: 'Data Analysis', description: 'Analyze and process data', category: 'data_processing', isCore: true },
  'file_io': { displayName: 'File Operations', description: 'Read, write, and manage files', category: 'data_access', isCore: true },
  'email_send': { displayName: 'Email Sending', description: 'Send emails and notifications', category: 'communication', isCore: true },

  // Data access and processing
  'api_integration': { displayName: 'API Integration', description: 'Connect to external APIs and services', category: 'data_access', isCore: false },
  'database_query': { displayName: 'Database Operations', description: 'Query and manipulate databases', category: 'data_access', isCore: false },
  'data_visualization': { displayName: 'Data Visualization', description: 'Create charts, graphs, and visual representations', category: 'data_processing', isCore: false },
  'data_extraction': { displayName: 'Data Extraction', description: 'Extract data from various sources', category: 'data_access', isCore: false },
  'data_transformation': { displayName: 'Data Transformation', description: 'Transform and clean data', category: 'data_processing', isCore: false },

  // Communication and collaboration
  'chat_interaction': { displayName: 'Chat Interaction', description: 'Interact through chat interfaces', category: 'communication', isCore: false },
  'document_generation': { displayName: 'Document Generation', description: 'Generate reports, documents, and content', category: 'content_creation', isCore: false },
  'notification_sending': { displayName: 'Notifications', description: 'Send various types of notifications', category: 'communication', isCore: false },
  'calendar_management': { displayName: 'Calendar Management', description: 'Manage calendars and scheduling', category: 'productivity', isCore: false },

  // Content creation and processing
  'text_processing': { displayName: 'Text Processing', description: 'Process and analyze text content', category: 'content_processing', isCore: false },
  'image_processing': { displayName: 'Image Processing', description: 'Process and analyze images', category: 'content_processing', isCore: false },
  'code_generation': { displayName: 'Code Generation', description: 'Generate and modify code', category: 'development', isCore: false },
  'content_summarization': { displayName: 'Content Summarization', description: 'Summarize and condense content', category: 'content_processing', isCore: false },

  // Automation and workflow
  'workflow_automation': { displayName: 'Workflow Automation', description: 'Automate business processes and workflows', category: 'automation', isCore: false },
  'task_scheduling': { displayName: 'Task Scheduling', description: 'Schedule and manage tasks', category: 'productivity', isCore: false },
  'monitoring': { displayName: 'Monitoring', description: 'Monitor systems, processes, and data', category: 'automation', isCore: false },
  'alerting': { displayName: 'Alerting', description: 'Send alerts and warnings', category: 'automation', isCore: false },

  // Development and technical
  'code_review': { displayName: 'Code Review', description: 'Review and analyze code', category: 'development', isCore: false },
  'testing': { displayName: 'Testing', description: 'Perform testing and quality assurance', category: 'development', isCore: false },
  'deployment': { displayName: 'Deployment', description: 'Deploy applications and services', category: 'development', isCore: false },
  'security_analysis': { displayName: 'Security Analysis', description: 'Analyze security and vulnerabilities', category: 'security', isCore: false },

  // Business and analytics
  'reporting': { displayName: 'Reporting', description: 'Generate business reports and analytics', category: 'business', isCore: false },
  'forecasting': { displayName: 'Forecasting', description: 'Make predictions and forecasts', category: 'business', isCore: false },
  'optimization': { displayName: 'Optimization', description: 'Optimize processes and performance', category: 'business', isCore: false },
  'compliance_checking': { displayName: 'Compliance Checking', description: 'Check compliance with regulations', category: 'business', isCore: false },

  // Specialized capabilities
  'language_translation': { displayName: 'Language Translation', description: 'Translate between languages', category: 'specialized', isCore: false },
  'voice_processing': { displayName: 'Voice Processing', description: 'Process voice and audio content', category: 'specialized', isCore: false },
  'blockchain_interaction': { displayName: 'Blockchain Interaction', description: 'Interact with blockchain networks', category: 'specialized', isCore: false },
  'iot_management': { displayName: 'IoT Management', description: 'Manage Internet of Things devices', category: 'specialized', isCore: false }
};

// Category colors
const categoryColors: Record<string, string> = {
  'data_access': 'bg-blue-50 text-blue-700 border-blue-200',
  'data_processing': 'bg-purple-50 text-purple-700 border-purple-200',
  'communication': 'bg-green-50 text-green-700 border-green-200',
  'content_creation': 'bg-orange-50 text-orange-700 border-orange-200',
  'content_processing': 'bg-pink-50 text-pink-700 border-pink-200',
  'automation': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'productivity': 'bg-teal-50 text-teal-700 border-teal-200',
  'development': 'bg-gray-50 text-gray-700 border-gray-200',
  'security': 'bg-red-50 text-red-700 border-red-200',
  'business': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'specialized': 'bg-violet-50 text-violet-700 border-violet-200'
};

// Size classes
const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
};

export function CapabilityChip({ 
  capability, 
  displayName, 
  description, 
  category, 
  isCore, 
  size = 'sm',
  className = '' 
}: CapabilityChipProps) {
  const info = capabilityInfo[capability] || {
    displayName: displayName || capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: description || 'AI agent capability',
    category: category || 'general',
    isCore: isCore || false
  };

  const categoryColor = categoryColors[info.category] || 'bg-gray-50 text-gray-700 border-gray-200';
  const sizeClass = sizeClasses[size];
  const coreIndicator = info.isCore ? '⭐ ' : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${sizeClass} ${categoryColor} border font-medium ${className}`}
          >
            {coreIndicator}{info.displayName}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <div className="font-medium mb-1">{info.displayName}</div>
            <div className="text-sm text-gray-600 mb-1">{info.description}</div>
            <div className="text-xs text-gray-500">
              Category: {info.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {info.isCore && <span className="ml-2 text-yellow-600">⭐ Core</span>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CapabilityChipsProps {
  capabilities: string[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showAllOnHover?: boolean;
}

export function CapabilityChips({ 
  capabilities, 
  maxDisplay = 3, 
  size = 'sm',
  className = '',
  showAllOnHover = true 
}: CapabilityChipsProps) {
  if (!capabilities || capabilities.length === 0) {
    return null;
  }

  const displayCapabilities = capabilities.slice(0, maxDisplay);
  const hiddenCount = capabilities.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayCapabilities.map((capability, index) => (
        <CapabilityChip 
          key={`${capability}-${index}`} 
          capability={capability} 
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${sizeClasses[size]} bg-gray-50 text-gray-600 border-gray-200`}
              >
                +{hiddenCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <div className="font-medium mb-2">Additional Capabilities</div>
                <div className="space-y-1">
                  {capabilities.slice(maxDisplay).map((capability, index) => (
                    <div key={`hidden-${capability}-${index}`} className="text-sm">
                      <CapabilityChip capability={capability} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default CapabilityChip;
