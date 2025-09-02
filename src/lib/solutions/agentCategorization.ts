import { AIAgent, AgentCategory } from './aiAgentsCatalog';

export interface SubtaskCategory {
  id: string;
  name: string;
  description: string;
  businessDomain: string;
  automationPotential: number;
  relatedCategories: AgentCategory[];
  keywords: string[];
}

export const subtaskCategories: SubtaskCategory[] = [
  // HR & Recruitment
  {
    id: 'recruitment',
    name: 'Recruitment & Hiring',
    description: 'Tasks related to finding, screening, and hiring candidates',
    businessDomain: 'HR',
    automationPotential: 90,
    relatedCategories: ['HR & Recruitment'],
    keywords: ['recruitment', 'hiring', 'candidates', 'screening', 'interviews', 'job postings', 'applications']
  },
  {
    id: 'employee-management',
    name: 'Employee Management',
    description: 'Tasks related to managing employee lifecycle and performance',
    businessDomain: 'HR',
    automationPotential: 80,
    relatedCategories: ['HR & Recruitment'],
    keywords: ['onboarding', 'performance reviews', 'employee records', 'hr policies', 'compliance', 'training']
  },
  {
    id: 'hr-processes',
    name: 'HR Process Automation',
    description: 'Automating routine HR processes and workflows',
    businessDomain: 'HR',
    automationPotential: 85,
    relatedCategories: ['HR & Recruitment'],
    keywords: ['hr workflows', 'process automation', 'documentation', 'approvals', 'reporting']
  },

  // Finance & Accounting
  {
    id: 'budgeting',
    name: 'Budgeting & Planning',
    description: 'Financial planning, budgeting, and forecasting tasks',
    businessDomain: 'Finance',
    automationPotential: 75,
    relatedCategories: ['Finance & Accounting'],
    keywords: ['budgeting', 'financial planning', 'forecasting', 'cost analysis', 'financial modeling']
  },
  {
    id: 'expense-tracking',
    name: 'Expense Tracking & Management',
    description: 'Tracking, categorizing, and managing business expenses',
    businessDomain: 'Finance',
    automationPotential: 90,
    relatedCategories: ['Finance & Accounting'],
    keywords: ['expense tracking', 'receipts', 'expense reports', 'categorization', 'approvals']
  },
  {
    id: 'invoice-processing',
    name: 'Invoice Processing',
    description: 'Processing invoices, payments, and accounts payable',
    businessDomain: 'Finance',
    automationPotential: 95,
    relatedCategories: ['Finance & Accounting'],
    keywords: ['invoices', 'payments', 'accounts payable', 'ocr', 'approval workflows']
  },
  {
    id: 'financial-reporting',
    name: 'Financial Reporting',
    description: 'Generating financial reports and analysis',
    businessDomain: 'Finance',
    automationPotential: 80,
    relatedCategories: ['Finance & Accounting', 'Data Analysis'],
    keywords: ['financial reports', 'analysis', 'kpis', 'dashboards', 'compliance']
  },

  // Marketing & Sales
  {
    id: 'campaign-planning',
    name: 'Marketing Campaign Planning',
    description: 'Planning and executing marketing campaigns',
    businessDomain: 'Marketing',
    automationPotential: 70,
    relatedCategories: ['Marketing & Sales'],
    keywords: ['campaign planning', 'marketing strategy', 'content calendar', 'audience targeting']
  },
  {
    id: 'content-creation',
    name: 'Content Creation',
    description: 'Creating marketing content and copy',
    businessDomain: 'Marketing',
    automationPotential: 65,
    relatedCategories: ['Marketing & Sales', 'Content Creation'],
    keywords: ['content creation', 'copywriting', 'blog posts', 'social media', 'marketing materials']
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification & Management',
    description: 'Qualifying and managing sales leads',
    businessDomain: 'Sales',
    automationPotential: 85,
    relatedCategories: ['Marketing & Sales'],
    keywords: ['lead qualification', 'lead scoring', 'crm management', 'sales pipeline']
  },
  {
    id: 'sales-follow-up',
    name: 'Sales Follow-up & Nurturing',
    description: 'Following up with prospects and nurturing relationships',
    businessDomain: 'Sales',
    automationPotential: 80,
    relatedCategories: ['Marketing & Sales'],
    keywords: ['follow-up', 'lead nurturing', 'email sequences', 'relationship management']
  },

  // Customer Support
  {
    id: 'ticket-handling',
    name: 'Support Ticket Management',
    description: 'Managing customer support tickets and requests',
    businessDomain: 'Support',
    automationPotential: 90,
    relatedCategories: ['Customer Support'],
    keywords: ['support tickets', 'customer requests', 'issue tracking', 'escalation']
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base Management',
    description: 'Creating and maintaining support documentation',
    businessDomain: 'Support',
    automationPotential: 75,
    relatedCategories: ['Customer Support', 'Content Creation'],
    keywords: ['documentation', 'knowledge base', 'faqs', 'help articles', 'troubleshooting']
  },

  // Data Analysis
  {
    id: 'data-processing',
    name: 'Data Processing & Cleaning',
    description: 'Processing, cleaning, and preparing data for analysis',
    businessDomain: 'Analytics',
    automationPotential: 85,
    relatedCategories: ['Data Analysis'],
    keywords: ['data processing', 'data cleaning', 'data preparation', 'etl', 'data quality']
  },
  {
    id: 'reporting',
    name: 'Reporting & Analytics',
    description: 'Generating reports and analyzing business data',
    businessDomain: 'Analytics',
    automationPotential: 80,
    relatedCategories: ['Data Analysis', 'General Business'],
    keywords: ['reporting', 'analytics', 'dashboards', 'kpis', 'business intelligence']
  },

  // Project Management
  {
    id: 'task-planning',
    name: 'Task Planning & Scheduling',
    description: 'Planning, scheduling, and organizing project tasks',
    businessDomain: 'Operations',
    automationPotential: 75,
    relatedCategories: ['Project Management'],
    keywords: ['task planning', 'scheduling', 'project management', 'resource allocation', 'timeline']
  },
  {
    id: 'progress-tracking',
    name: 'Progress Tracking & Monitoring',
    description: 'Tracking project progress and performance metrics',
    businessDomain: 'Operations',
    automationPotential: 80,
    relatedCategories: ['Project Management'],
    keywords: ['progress tracking', 'performance monitoring', 'milestones', 'status updates', 'reporting']
  },

  // Communication
  {
    id: 'email-management',
    name: 'Email Management',
    description: 'Managing email communications and workflows',
    businessDomain: 'Operations',
    automationPotential: 85,
    relatedCategories: ['Communication'],
    keywords: ['email management', 'communication', 'workflows', 'automation', 'prioritization']
  },
  {
    id: 'meeting-coordination',
    name: 'Meeting Coordination',
    description: 'Scheduling and coordinating meetings and events',
    businessDomain: 'Operations',
    automationPotential: 80,
    relatedCategories: ['Communication'],
    keywords: ['meeting scheduling', 'calendar management', 'coordination', 'event planning']
  }
];

export const mapSubtaskToAgents = (subtaskKeywords: string[]): AIAgent[] => {
  const matchedCategories = new Set<AgentCategory>();
  
  // Find matching subtask categories
  subtaskCategories.forEach(category => {
    const hasMatch = category.keywords.some(keyword =>
      subtaskKeywords.some(subtaskKeyword =>
        subtaskKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(subtaskKeyword.toLowerCase())
      )
    );
    
    if (hasMatch) {
      category.relatedCategories.forEach(cat => matchedCategories.add(cat));
    }
  });

  // Return agents from matched categories
  const matchedAgents: AIAgent[] = [];
  matchedCategories.forEach(category => {
    const agents = getAgentsByCategory(category);
    matchedAgents.push(...agents);
  });

  return matchedAgents;
};

export const getSubtaskCategoriesByDomain = (domain: string): SubtaskCategory[] => {
  return subtaskCategories.filter(category => 
    category.businessDomain.toLowerCase() === domain.toLowerCase()
  );
};

export const getSubtaskCategoriesByAutomationPotential = (minPotential: number): SubtaskCategory[] => {
  return subtaskCategories.filter(category => 
    category.automationPotential >= minPotential
  );
};

export const searchSubtaskCategories = (query: string): SubtaskCategory[] => {
  const lowerQuery = query.toLowerCase();
  return subtaskCategories.filter(category =>
    category.name.toLowerCase().includes(lowerQuery) ||
    category.description.toLowerCase().includes(lowerQuery) ||
    category.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
};

export const getBusinessDomains = (): string[] => {
  return [...new Set(subtaskCategories.map(category => category.businessDomain))];
};
