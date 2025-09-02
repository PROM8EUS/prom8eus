import { AIAgent } from './aiAgentsCatalog';

export interface AgentMetadata {
  agentId: string;
  difficulty: {
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    description: string;
    prerequisites: string[];
    estimatedLearningTime: string;
    technicalSkills: string[];
  };
  setupTime: {
    level: 'Quick' | 'Medium' | 'Long';
    description: string;
    estimatedMinutes: number;
    steps: SetupStep[];
    commonIssues: string[];
    troubleshooting: string[];
  };
  requirements: {
    technical: TechnicalRequirement[];
    business: BusinessRequirement[];
    integrations: IntegrationRequirement[];
    costs: CostRequirement[];
  };
  implementation: {
    phases: ImplementationPhase[];
    bestPractices: string[];
    securityConsiderations: string[];
    scalingGuidance: string[];
  };
  maintenance: {
    frequency: string;
    tasks: MaintenanceTask[];
    monitoring: MonitoringRequirement[];
    updates: UpdateRequirement[];
  };
}

export interface SetupStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  required: boolean;
  notes?: string;
}

export interface TechnicalRequirement {
  category: string;
  items: string[];
  importance: 'Required' | 'Recommended' | 'Optional';
  alternatives?: string[];
}

export interface BusinessRequirement {
  category: string;
  items: string[];
  importance: 'Required' | 'Recommended' | 'Optional';
  businessValue: string;
}

export interface IntegrationRequirement {
  platform: string;
  type: 'API' | 'Webhook' | 'Database' | 'File' | 'Custom';
  description: string;
  setupComplexity: 'Low' | 'Medium' | 'High';
  documentationUrl?: string;
}

export interface CostRequirement {
  type: 'One-time' | 'Recurring' | 'Usage-based';
  description: string;
  estimatedCost: string;
  frequency?: string;
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  dependencies?: string[];
}

export interface MaintenanceTask {
  task: string;
  frequency: string;
  estimatedTime: number;
  importance: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface MonitoringRequirement {
  metric: string;
  threshold: string;
  alertCondition: string;
  tool?: string;
}

export interface UpdateRequirement {
  type: 'Security' | 'Feature' | 'Bug Fix' | 'Performance';
  frequency: string;
  impact: 'Low' | 'Medium' | 'High';
  rollbackPlan: string;
}

export const agentMetadataMap: Map<string, AgentMetadata> = new Map([
  ['hr-assistant', {
    agentId: 'hr-assistant',
    difficulty: {
      level: 'Beginner',
      description: 'Suitable for HR professionals with basic technical knowledge. No coding required.',
      prerequisites: ['Basic understanding of HR processes', 'Access to HR systems'],
      estimatedLearningTime: '2-4 hours',
      technicalSkills: ['Basic computer skills', 'API key management']
    },
    setupTime: {
      level: 'Quick',
      description: 'Can be set up in under 30 minutes with proper preparation.',
      estimatedMinutes: 25,
      steps: [
        {
          step: 1,
          title: 'Get OpenAI API Key',
          description: 'Sign up for OpenAI and generate an API key',
          estimatedTime: 10,
          required: true
        },
        {
          step: 2,
          title: 'Configure HR System Access',
          description: 'Set up access to your HR/ATS system',
          estimatedTime: 10,
          required: true
        },
        {
          step: 3,
          title: 'Test Basic Functions',
          description: 'Verify the agent can access and process HR data',
          estimatedTime: 5,
          required: true
        }
      ],
      commonIssues: [
        'API key not properly configured',
        'HR system access permissions too restrictive',
        'Network firewall blocking API calls'
      ],
      troubleshooting: [
        'Verify API key is correct and has sufficient credits',
        'Check HR system user permissions and API access',
        'Ensure network allows outbound HTTPS connections'
      ]
    },
    requirements: {
      technical: [
        {
          category: 'API Access',
          items: ['OpenAI API key with sufficient credits', 'HTTPS internet access'],
          importance: 'Required'
        },
        {
          category: 'Data Access',
          items: ['HR system API access or export capabilities'],
          importance: 'Required'
        }
      ],
      business: [
        {
          category: 'HR Processes',
          items: ['Standardized HR workflows', 'Documented procedures'],
          importance: 'Required',
          businessValue: 'Enables consistent automation of routine HR tasks'
        }
      ],
      integrations: [
        {
          platform: 'OpenAI',
          type: 'API',
          description: 'For natural language processing and task understanding',
          setupComplexity: 'Low'
        }
      ],
      costs: [
        {
          type: 'Recurring',
          description: 'OpenAI API usage costs',
          estimatedCost: '$50-200/month',
          frequency: 'Monthly'
        }
      ]
    },
    implementation: {
      phases: [
        {
          phase: 1,
          name: 'Foundation Setup',
          description: 'Basic configuration and API setup',
          duration: '1 day',
          deliverables: ['Working API connection', 'Basic HR data access']
        },
        {
          phase: 2,
          name: 'Process Mapping',
          description: 'Map existing HR processes to automation opportunities',
          duration: '2-3 days',
          deliverables: ['Process automation map', 'Priority list']
        },
        {
          phase: 3,
          name: 'Testing & Validation',
          description: 'Test automation with real HR scenarios',
          duration: '1-2 days',
          deliverables: ['Test results', 'Refined configurations']
        }
      ],
      bestPractices: [
        'Start with low-risk, high-volume tasks',
        'Maintain human oversight for sensitive decisions',
        'Document all automated processes',
        'Regular review of automation accuracy'
      ],
      securityConsiderations: [
        'Ensure HR data encryption in transit and at rest',
        'Implement proper access controls and audit logging',
        'Comply with data protection regulations (GDPR, CCPA)',
        'Regular security audits and updates'
      ],
      scalingGuidance: [
        'Begin with single department or process',
        'Gradually expand to other HR functions',
        'Monitor performance and adjust configurations',
        'Plan for increased API usage costs'
      ]
    },
    maintenance: {
      frequency: 'Weekly',
      tasks: [
        {
          task: 'Review automation accuracy and performance',
          frequency: 'Weekly',
          estimatedTime: 30,
          importance: 'High'
        },
        {
          task: 'Update HR process configurations',
          frequency: 'As needed',
          estimatedTime: 60,
          importance: 'Medium'
        }
      ],
      monitoring: [
        {
          metric: 'Task completion rate',
          threshold: '>95%',
          alertCondition: 'Below threshold for 2 consecutive days'
        },
        {
          metric: 'API response time',
          threshold: '<5 seconds',
          alertCondition: 'Above threshold for 1 hour'
        }
      ],
      updates: [
        {
          type: 'Security',
          frequency: 'Monthly',
          impact: 'Low',
          rollbackPlan: 'Revert to previous configuration version'
        }
      ]
    }
  }],

  ['financial-advisor', {
    agentId: 'financial-advisor',
    difficulty: {
      level: 'Beginner',
      description: 'Suitable for finance professionals with basic technical knowledge.',
      prerequisites: ['Understanding of financial processes', 'Access to financial data'],
      estimatedLearningTime: '3-5 hours',
      technicalSkills: ['Basic computer skills', 'API key management', 'Data export skills']
    },
    setupTime: {
      level: 'Quick',
      description: 'Setup takes about 45 minutes including data source configuration.',
      estimatedMinutes: 45,
      steps: [
        {
          step: 1,
          title: 'Configure OpenAI API',
          description: 'Set up OpenAI API key and configure access',
          estimatedTime: 10,
          required: true
        },
        {
          step: 2,
          title: 'Connect Financial Data Sources',
          description: 'Connect to accounting software or banking APIs',
          estimatedTime: 20,
          required: true
        },
        {
          step: 3,
          title: 'Set Up Financial Categories',
          description: 'Configure expense categories and budget parameters',
          estimatedTime: 15,
          required: true
        }
      ],
      commonIssues: [
        'Banking API access denied',
        'Data format incompatibility',
        'Insufficient API rate limits'
      ],
      troubleshooting: [
        'Contact bank for API access and proper credentials',
        'Use data transformation tools for format conversion',
        'Implement rate limiting and request queuing'
      ]
    },
    requirements: {
      technical: [
        {
          category: 'API Access',
          items: ['OpenAI API key', 'Banking/accounting system API access'],
          importance: 'Required'
        },
        {
          category: 'Data Processing',
          items: ['Data export capabilities', 'CSV/JSON processing'],
          importance: 'Required'
        }
      ],
      business: [
        {
          category: 'Financial Processes',
          items: ['Standardized expense categories', 'Approval workflows'],
          importance: 'Required',
          businessValue: 'Automates routine financial tasks and improves accuracy'
        }
      ],
      integrations: [
        {
          platform: 'OpenAI',
          type: 'API',
          description: 'For financial analysis and categorization',
          setupComplexity: 'Low'
        },
        {
          platform: 'Banking Systems',
          type: 'API',
          description: 'For transaction data access',
          setupComplexity: 'Medium'
        }
      ],
      costs: [
        {
          type: 'Recurring',
          description: 'OpenAI API usage and banking API fees',
          estimatedCost: '$100-300/month',
          frequency: 'Monthly'
        }
      ]
    },
    implementation: {
      phases: [
        {
          phase: 1,
          name: 'Data Source Setup',
          description: 'Connect to financial data sources',
          duration: '1-2 days',
          deliverables: ['Connected data sources', 'Data access verified']
        },
        {
          phase: 2,
          name: 'Process Configuration',
          description: 'Configure financial processes and rules',
          duration: '2-3 days',
          deliverables: ['Configured processes', 'Automation rules']
        },
        {
          phase: 3,
          name: 'Testing & Training',
          description: 'Test with real financial data',
          duration: '1-2 days',
          deliverables: ['Test results', 'User training materials']
        }
      ],
      bestPractices: [
        'Start with expense tracking and categorization',
        'Implement proper approval workflows',
        'Regular reconciliation with manual processes',
        'Maintain audit trail for all automated decisions'
      ],
      securityConsiderations: [
        'Encrypt all financial data',
        'Implement multi-factor authentication',
        'Regular security audits',
        'Comply with financial regulations'
      ],
      scalingGuidance: [
        'Begin with single department',
        'Gradually expand to other financial functions',
        'Monitor API usage and costs',
        'Plan for data volume growth'
      ]
    },
    maintenance: {
      frequency: 'Weekly',
      tasks: [
        {
          task: 'Review financial accuracy',
          frequency: 'Weekly',
          estimatedTime: 45,
          importance: 'Critical'
        },
        {
          task: 'Update categorization rules',
          frequency: 'Monthly',
          estimatedTime: 60,
          importance: 'High'
        }
      ],
      monitoring: [
        {
          metric: 'Categorization accuracy',
          threshold: '>98%',
          alertCondition: 'Below threshold for 1 day'
        }
      ],
      updates: [
        {
          type: 'Security',
          frequency: 'Monthly',
          impact: 'Medium',
          rollbackPlan: 'Immediate rollback to previous version'
        }
      ]
    }
  }]
]);

export const getAgentMetadata = (agentId: string): AgentMetadata | undefined => {
  return agentMetadataMap.get(agentId);
};

export const getMetadataByDifficulty = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): AgentMetadata[] => {
  return Array.from(agentMetadataMap.values()).filter(
    metadata => metadata.difficulty.level === difficulty
  );
};

export const getMetadataBySetupTime = (setupTime: 'Quick' | 'Medium' | 'Long'): AgentMetadata[] => {
  return Array.from(agentMetadataMap.values()).filter(
    metadata => metadata.setupTime.level === setupTime
  );
};

export const getMetadataByCategory = (category: string): AgentMetadata[] => {
  return Array.from(agentMetadataMap.values()).filter(
    metadata => {
      const agent = Array.from(agentMetadataMap.keys()).find(
        key => agentMetadataMap.get(key) === metadata
      );
      return agent && agent.includes(category.toLowerCase());
    }
  );
};
