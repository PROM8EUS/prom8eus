import { AIAgent, AgentCategory } from './aiAgentsCatalog';
import { SubtaskCategory } from './agentCategorization';

export interface AgentSubtaskMapping {
  agentId: string;
  subtaskCategories: string[];
  businessDomains: string[];
  matchScore: number; // 0-100
  useCaseScenarios: UseCaseScenario[];
  implementationPriority: 'High' | 'Medium' | 'Low';
  estimatedROI: string;
  timeToValue: string;
}

export interface UseCaseScenario {
  scenario: string;
  description: string;
  automationPotential: number;
  implementationEffort: 'Low' | 'Medium' | 'High';
  expectedOutcome: string;
  prerequisites: string[];
}

export interface SubtaskAgentRecommendation {
  subtaskId: string;
  subtaskName: string;
  businessDomain: string;
  recommendedAgents: AgentSubtaskMapping[];
  alternativeAgents: AgentSubtaskMapping[];
  implementationRoadmap: ImplementationStep[];
}

export interface ImplementationStep {
  step: number;
  action: string;
  description: string;
  estimatedTime: string;
  dependencies: string[];
  resources: string[];
}

// Comprehensive mapping of agents to subtask categories
export const agentSubtaskMappings: AgentSubtaskMapping[] = [
  // HR & Recruitment Agents
  {
    agentId: 'hr-assistant',
    subtaskCategories: ['recruitment', 'employee-management', 'hr-processes'],
    businessDomains: ['HR'],
    matchScore: 95,
    useCaseScenarios: [
      {
        scenario: 'Resume Screening',
        description: 'Automated screening of job applications and resumes',
        automationPotential: 90,
        implementationEffort: 'Low',
        expectedOutcome: 'Reduce screening time by 80%',
        prerequisites: ['ATS integration', 'Job description templates']
      },
      {
        scenario: 'Employee Onboarding',
        description: 'Automated onboarding workflow and documentation',
        automationPotential: 85,
        implementationEffort: 'Medium',
        expectedOutcome: 'Standardize onboarding process',
        prerequisites: ['HR system access', 'Onboarding checklist']
      },
      {
        scenario: 'Performance Reviews',
        description: 'Automated performance review scheduling and reminders',
        automationPotential: 75,
        implementationEffort: 'Low',
        expectedOutcome: 'Improve review completion rates',
        prerequisites: ['Performance management system', 'Review templates']
      }
    ],
    implementationPriority: 'High',
    estimatedROI: '200-400%',
    timeToValue: '2-4 weeks'
  },
  {
    agentId: 'recruitment-bot',
    subtaskCategories: ['recruitment'],
    businessDomains: ['HR'],
    matchScore: 90,
    useCaseScenarios: [
      {
        scenario: 'Candidate Sourcing',
        description: 'Automated candidate sourcing from multiple platforms',
        automationPotential: 95,
        implementationEffort: 'Medium',
        expectedOutcome: 'Increase candidate pipeline by 60%',
        prerequisites: ['Job board APIs', 'Sourcing criteria']
      },
      {
        scenario: 'Initial Screening',
        description: 'Automated initial candidate qualification',
        automationPotential: 85,
        implementationEffort: 'Medium',
        expectedOutcome: 'Reduce manual screening time by 70%',
        prerequisites: ['Screening criteria', 'Assessment tools']
      }
    ],
    implementationPriority: 'High',
    estimatedROI: '300-500%',
    timeToValue: '3-5 weeks'
  },

  // Finance & Accounting Agents
  {
    agentId: 'financial-advisor',
    subtaskCategories: ['budgeting', 'expense-tracking', 'financial-reporting'],
    businessDomains: ['Finance'],
    matchScore: 88,
    useCaseScenarios: [
      {
        scenario: 'Expense Categorization',
        description: 'Automated categorization of business expenses',
        automationPotential: 90,
        implementationEffort: 'Low',
        expectedOutcome: 'Reduce manual categorization by 85%',
        prerequisites: ['Expense data access', 'Category definitions']
      },
      {
        scenario: 'Budget Monitoring',
        description: 'Real-time budget tracking and alerts',
        automationPotential: 80,
        implementationEffort: 'Medium',
        expectedOutcome: 'Improve budget compliance by 40%',
        prerequisites: ['Budget data', 'Alert thresholds']
      },
      {
        scenario: 'Financial Reporting',
        description: 'Automated financial report generation',
        automationPotential: 75,
        implementationEffort: 'Medium',
        expectedOutcome: 'Reduce report preparation time by 60%',
        prerequisites: ['Financial data sources', 'Report templates']
      }
    ],
    implementationPriority: 'High',
    estimatedROI: '250-400%',
    timeToValue: '3-6 weeks'
  },
  {
    agentId: 'invoice-processor',
    subtaskCategories: ['invoice-processing', 'expense-tracking'],
    businessDomains: ['Finance'],
    matchScore: 92,
    useCaseScenarios: [
      {
        scenario: 'Invoice Data Extraction',
        description: 'OCR-based invoice data extraction and processing',
        automationPotential: 95,
        implementationEffort: 'Medium',
        expectedOutcome: 'Process invoices 10x faster',
        prerequisites: ['OCR capabilities', 'Invoice templates']
      },
      {
        scenario: 'Payment Workflows',
        description: 'Automated payment approval and scheduling',
        automationPotential: 90,
        implementationEffort: 'High',
        expectedOutcome: 'Reduce payment processing time by 75%',
        prerequisites: ['Approval workflows', 'Payment systems']
      }
    ],
    implementationPriority: 'High',
    estimatedROI: '400-600%',
    timeToValue: '4-8 weeks'
  },

  // Marketing & Sales Agents
  {
    agentId: 'marketing-copilot',
    subtaskCategories: ['campaign-planning', 'content-creation'],
    businessDomains: ['Marketing'],
    matchScore: 82,
    useCaseScenarios: [
      {
        scenario: 'Campaign Planning',
        description: 'AI-assisted marketing campaign planning and strategy',
        automationPotential: 70,
        implementationEffort: 'Low',
        expectedOutcome: 'Improve campaign effectiveness by 25%',
        prerequisites: ['Marketing data', 'Campaign objectives']
      },
      {
        scenario: 'Content Creation',
        description: 'Automated content generation for marketing materials',
        automationPotential: 65,
        implementationEffort: 'Medium',
        expectedOutcome: 'Increase content production by 40%',
        prerequisites: ['Brand guidelines', 'Content templates']
      }
    ],
    implementationPriority: 'Medium',
    estimatedROI: '150-250%',
    timeToValue: '2-4 weeks'
  },
  {
    agentId: 'sales-assistant',
    subtaskCategories: ['lead-qualification', 'sales-follow-up'],
    businessDomains: ['Sales'],
    matchScore: 85,
    useCaseScenarios: [
      {
        scenario: 'Lead Qualification',
        description: 'Automated lead scoring and qualification',
        automationPotential: 85,
        implementationEffort: 'Medium',
        expectedOutcome: 'Improve lead quality by 35%',
        prerequisites: ['CRM integration', 'Qualification criteria']
      },
      {
        scenario: 'Follow-up Automation',
        description: 'Automated sales follow-up sequences',
        automationPotential: 80,
        implementationEffort: 'Medium',
        expectedOutcome: 'Increase follow-up response rates by 50%',
        prerequisites: ['Email automation', 'Follow-up templates']
      }
    ],
    implementationPriority: 'High',
    estimatedROI: '200-350%',
    timeToValue: '3-5 weeks'
  },

  // Customer Support Agents
  {
    agentId: 'support-bot',
    subtaskCategories: ['ticket-handling', 'knowledge-base'],
    businessDomains: ['Support'],
    matchScore: 90,
    useCaseScenarios: [
      {
        scenario: 'Ticket Routing',
        description: 'Automated ticket categorization and routing',
        automationPotential: 90,
        implementationEffort: 'Medium',
        expectedOutcome: 'Reduce ticket resolution time by 40%',
        prerequisites: ['Help desk system', 'Routing rules']
      },
      {
        scenario: 'Automated Responses',
        description: 'AI-powered responses to common support questions',
        automationPotential: 85,
        implementationEffort: 'Medium',
        expectedOutcome: 'Resolve 60% of tickets automatically',
        prerequisites: ['Knowledge base', 'Response templates']
      }
    ],
    implementationPriority: 'High',
    estimatedROI: '300-450%',
    timeToValue: '4-6 weeks'
  },

  // Data Analysis Agents
  {
    agentId: 'data-analyst',
    subtaskCategories: ['data-processing', 'reporting'],
    businessDomains: ['Analytics'],
    matchScore: 88,
    useCaseScenarios: [
      {
        scenario: 'Data Cleaning',
        description: 'Automated data cleaning and preprocessing',
        automationPotential: 85,
        implementationEffort: 'High',
        expectedOutcome: 'Reduce data preparation time by 70%',
        prerequisites: ['Data sources', 'Quality standards']
      },
      {
        scenario: 'Report Generation',
        description: 'Automated report creation and distribution',
        automationPotential: 80,
        implementationEffort: 'Medium',
        expectedOutcome: 'Generate reports 5x faster',
        prerequisites: ['Report templates', 'Data access']
      }
    ],
    implementationPriority: 'Medium',
    estimatedROI: '200-300%',
    timeToValue: '6-10 weeks'
  },

  // Content Creation Agents
  {
    agentId: 'content-writer',
    subtaskCategories: ['content-creation'],
    businessDomains: ['Marketing'],
    matchScore: 78,
    useCaseScenarios: [
      {
        scenario: 'Blog Post Generation',
        description: 'AI-assisted blog post writing and optimization',
        automationPotential: 70,
        implementationEffort: 'Low',
        expectedOutcome: 'Increase content production by 50%',
        prerequisites: ['Content strategy', 'Writing guidelines']
      },
      {
        scenario: 'Social Media Content',
        description: 'Automated social media content creation',
        automationPotential: 65,
        implementationEffort: 'Low',
        expectedOutcome: 'Maintain consistent posting schedule',
        prerequisites: ['Social media accounts', 'Content calendar']
      }
    ],
    implementationPriority: 'Medium',
    estimatedROI: '120-200%',
    timeToValue: '1-3 weeks'
  },

  // Project Management Agents
  {
    agentId: 'project-manager',
    subtaskCategories: ['task-planning', 'progress-tracking'],
    businessDomains: ['Operations'],
    matchScore: 80,
    useCaseScenarios: [
      {
        scenario: 'Task Scheduling',
        description: 'AI-assisted project task planning and scheduling',
        automationPotential: 75,
        implementationEffort: 'Medium',
        expectedOutcome: 'Improve project efficiency by 20%',
        prerequisites: ['Project data', 'Resource information']
      },
      {
        scenario: 'Progress Monitoring',
        description: 'Automated progress tracking and reporting',
        automationPotential: 80,
        implementationEffort: 'Medium',
        expectedOutcome: 'Reduce status update time by 60%',
        prerequisites: ['Project management tools', 'Reporting templates']
      }
    ],
    implementationPriority: 'Medium',
    estimatedROI: '180-280%',
    timeToValue: '4-6 weeks'
  },

  // Development & DevOps Agents
  {
    agentId: 'code-assistant',
    subtaskCategories: ['data-processing', 'reporting'],
    businessDomains: ['Analytics'],
    matchScore: 85,
    useCaseScenarios: [
      {
        scenario: 'Code Review',
        description: 'Automated code review and quality checks',
        automationPotential: 85,
        implementationEffort: 'High',
        expectedOutcome: 'Improve code quality by 30%',
        prerequisites: ['Code repositories', 'Quality standards']
      },
      {
        scenario: 'Documentation Generation',
        description: 'Automated code documentation creation',
        automationPotential: 80,
        implementationEffort: 'Medium',
        expectedOutcome: 'Reduce documentation time by 70%',
        prerequisites: ['Code comments', 'Documentation templates']
      }
    ],
    implementationPriority: 'Medium',
    estimatedROI: '250-400%',
    timeToValue: '8-12 weeks'
  },

  // Research & Analysis Agents
  {
    agentId: 'research-assistant',
    subtaskCategories: ['reporting', 'data-processing'],
    businessDomains: ['Analytics'],
    matchScore: 82,
    useCaseScenarios: [
      {
        scenario: 'Market Research',
        description: 'Automated market research and competitive analysis',
        automationPotential: 80,
        implementationEffort: 'Medium',
        expectedOutcome: 'Reduce research time by 50%',
        prerequisites: ['Research databases', 'Analysis criteria']
      },
      {
        scenario: 'Data Synthesis',
        description: 'AI-powered data analysis and insights generation',
        automationPotential: 75,
        implementationEffort: 'Medium',
        expectedOutcome: 'Generate insights 3x faster',
        prerequisites: ['Data sources', 'Analysis frameworks']
      }
    ],
    implementationPriority: 'Medium',
    estimatedROI: '200-300%',
    timeToValue: '5-8 weeks'
  },

  // Communication Agents
  {
    agentId: 'communication-hub',
    subtaskCategories: ['email-management', 'meeting-coordination'],
    businessDomains: ['Operations'],
    matchScore: 85,
    useCaseScenarios: [
      {
        scenario: 'Email Management',
        description: 'Automated email prioritization and responses',
        automationPotential: 85,
        implementationEffort: 'Medium',
        expectedOutcome: 'Reduce email handling time by 40%',
        prerequisites: ['Email system access', 'Response templates']
      },
      {
        scenario: 'Meeting Coordination',
        description: 'Automated meeting scheduling and coordination',
        automationPotential: 80,
        implementationEffort: 'Low',
        expectedOutcome: 'Reduce scheduling conflicts by 60%',
        prerequisites: ['Calendar access', 'Meeting preferences']
      }
    ],
    implementationPriority: 'Medium',
    estimatedROI: '150-250%',
    timeToValue: '2-4 weeks'
  },

  // General Business Agents
  {
    agentId: 'business-assistant',
    subtaskCategories: ['reporting', 'task-planning'],
    businessDomains: ['Operations'],
    matchScore: 70,
    useCaseScenarios: [
      {
        scenario: 'Process Optimization',
        description: 'AI-assisted business process analysis and optimization',
        automationPotential: 70,
        implementationEffort: 'Medium',
        expectedOutcome: 'Improve process efficiency by 15%',
        prerequisites: ['Process documentation', 'Performance data']
      },
      {
        scenario: 'Decision Support',
        description: 'AI-powered business decision support and analysis',
        automationPotential: 65,
        implementationEffort: 'Low',
        expectedOutcome: 'Improve decision quality by 25%',
        prerequisites: ['Business data', 'Decision criteria']
      }
    ],
    implementationPriority: 'Low',
    estimatedROI: '100-180%',
    timeToValue: '3-5 weeks'
  }
];

// Get agent recommendations for a specific subtask
export const getAgentRecommendationsForSubtask = (subtaskId: string): AgentSubtaskMapping[] => {
  return agentSubtaskMappings
    .filter(mapping => mapping.subtaskCategories.includes(subtaskId))
    .sort((a, b) => b.matchScore - a.matchScore);
};

// Get subtask recommendations for a specific agent
export const getSubtaskRecommendationsForAgent = (agentId: string): string[] => {
  const mapping = agentSubtaskMappings.find(m => m.agentId === agentId);
  return mapping ? mapping.subtaskCategories : [];
};

// Get business domain recommendations for a specific agent
export const getBusinessDomainRecommendationsForAgent = (agentId: string): string[] => {
  const mapping = agentSubtaskMappings.find(m => m.agentId === agentId);
  return mapping ? mapping.businessDomains : [];
};

// Get high-priority agent recommendations
export const getHighPriorityAgents = (): AgentSubtaskMapping[] => {
  return agentSubtaskMappings
    .filter(mapping => mapping.implementationPriority === 'High')
    .sort((a, b) => b.matchScore - a.matchScore);
};

// Get agent recommendations by business domain
export const getAgentRecommendationsByDomain = (domain: string): AgentSubtaskMapping[] => {
  return agentSubtaskMappings
    .filter(mapping => mapping.businessDomains.includes(domain))
    .sort((a, b) => b.matchScore - a.matchScore);
};

// Get agent recommendations by automation potential
export const getAgentRecommendationsByAutomationPotential = (minScore: number): AgentSubtaskMapping[] => {
  return agentSubtaskMappings
    .filter(mapping => mapping.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
};

// Get implementation roadmap for a specific subtask
export const getImplementationRoadmap = (subtaskId: string): ImplementationStep[] => {
  const recommendations = getAgentRecommendationsForSubtask(subtaskId);
  if (recommendations.length === 0) return [];

  const topAgent = recommendations[0];
  
  return [
    {
      step: 1,
      action: 'Assess Requirements',
      description: 'Evaluate current processes and identify automation opportunities',
      estimatedTime: '1-2 days',
      dependencies: [],
      resources: ['Process documentation', 'Stakeholder interviews']
    },
    {
      step: 2,
      action: 'Choose Agent',
      description: `Select ${topAgent.agentId} based on requirements and match score`,
      estimatedTime: '1 day',
      dependencies: ['Requirements assessment'],
      resources: ['Agent documentation', 'Technical specifications']
    },
    {
      step: 3,
      action: 'Configure Integration',
      description: 'Set up necessary integrations and data connections',
      estimatedTime: '2-5 days',
      dependencies: ['Agent selection'],
      resources: ['API documentation', 'System access credentials']
    },
    {
      step: 4,
      action: 'Test & Validate',
      description: 'Test automation with real scenarios and validate results',
      estimatedTime: '2-3 days',
      dependencies: ['Integration setup'],
      resources: ['Test data', 'Validation criteria']
    },
    {
      step: 5,
      action: 'Deploy & Monitor',
      description: 'Deploy to production and establish monitoring',
      estimatedTime: '1-2 days',
      dependencies: ['Testing completed'],
      resources: ['Production environment', 'Monitoring tools']
    }
  ];
};
