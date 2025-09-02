export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  subcategories: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  setupTime: 'Quick' | 'Medium' | 'Long';
  requirements: string[];
  deployment: 'Local' | 'Cloud' | 'Hybrid';
  githubUrl?: string;
  demoUrl?: string;
  documentationUrl?: string;
  tags: string[];
  automationPotential: number; // 0-100 percentage
  useCases: string[];
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
}

export type AgentCategory = 
  | 'HR & Recruitment'
  | 'Finance & Accounting'
  | 'Marketing & Sales'
  | 'Customer Support'
  | 'Data Analysis'
  | 'Content Creation'
  | 'Project Management'
  | 'Development & DevOps'
  | 'Research & Analysis'
  | 'Communication'
  | 'General Business';

export const aiAgentsCatalog: AIAgent[] = [
  // HR & Recruitment Agents
  {
    id: 'hr-assistant',
    name: 'HR Assistant',
    description: 'AI-powered HR assistant for recruitment, employee management, and HR processes',
    category: 'HR & Recruitment',
    subcategories: ['recruitment', 'employee-management', 'hr-processes'],
    difficulty: 'Beginner',
    setupTime: 'Quick',
    requirements: ['OpenAI API key', 'Basic HR knowledge'],
    deployment: 'Cloud',
    tags: ['hr', 'recruitment', 'employee-management', 'automation'],
    automationPotential: 85,
    useCases: [
      'Resume screening and candidate matching',
      'Employee onboarding automation',
      'HR policy compliance checking',
      'Performance review assistance'
    ],
    pricing: 'Freemium'
  },
  {
    id: 'recruitment-bot',
    name: 'Recruitment Bot',
    description: 'Automated recruitment bot for candidate sourcing and initial screening',
    category: 'HR & Recruitment',
    subcategories: ['recruitment', 'candidate-sourcing', 'screening'],
    difficulty: 'Intermediate',
    setupTime: 'Medium',
    requirements: ['OpenAI API key', 'ATS integration', 'Job board APIs'],
    deployment: 'Cloud',
    tags: ['recruitment', 'automation', 'candidate-sourcing', 'screening'],
    automationPotential: 90,
    useCases: [
      'Automated job posting',
      'Candidate sourcing from multiple platforms',
      'Initial candidate screening',
      'Interview scheduling'
    ],
    pricing: 'Paid'
  },

  // Finance & Accounting Agents
  {
    id: 'financial-advisor',
    name: 'Financial Advisor',
    description: 'AI financial advisor for budgeting, expense tracking, and financial planning',
    category: 'Finance & Accounting',
    subcategories: ['budgeting', 'expense-tracking', 'financial-planning'],
    difficulty: 'Beginner',
    setupTime: 'Quick',
    requirements: ['OpenAI API key', 'Banking API access'],
    deployment: 'Cloud',
    tags: ['finance', 'budgeting', 'expense-tracking', 'automation'],
    automationPotential: 80,
    useCases: [
      'Expense categorization and tracking',
      'Budget planning and monitoring',
      'Financial report generation',
      'Investment recommendations'
    ],
    pricing: 'Freemium'
  },
  {
    id: 'invoice-processor',
    name: 'Invoice Processor',
    description: 'Automated invoice processing and accounts payable management',
    category: 'Finance & Accounting',
    subcategories: ['invoice-processing', 'accounts-payable', 'automation'],
    difficulty: 'Intermediate',
    setupTime: 'Medium',
    requirements: ['OpenAI API key', 'OCR capabilities', 'Accounting software integration'],
    deployment: 'Hybrid',
    tags: ['finance', 'invoice-processing', 'automation', 'ocr'],
    automationPotential: 95,
    useCases: [
      'Automated invoice data extraction',
      'Expense approval workflows',
      'Payment scheduling',
      'Financial reconciliation'
    ],
    pricing: 'Paid'
  },

  // Marketing & Sales Agents
  {
    id: 'marketing-copilot',
    name: 'Marketing Copilot',
    description: 'AI marketing assistant for campaign planning, content creation, and analytics',
    category: 'Marketing & Sales',
    subcategories: ['campaign-planning', 'content-creation', 'analytics'],
    difficulty: 'Beginner',
    setupTime: 'Quick',
    requirements: ['OpenAI API key', 'Marketing platform access'],
    deployment: 'Cloud',
    tags: ['marketing', 'campaign-planning', 'content-creation', 'automation'],
    automationPotential: 75,
    useCases: [
      'Marketing campaign ideation',
      'Content calendar planning',
      'Social media post generation',
      'Performance analytics'
    ],
    pricing: 'Freemium'
  },
  {
    id: 'sales-assistant',
    name: 'Sales Assistant',
    description: 'AI sales assistant for lead qualification, follow-up automation, and sales analytics',
    category: 'Marketing & Sales',
    subcategories: ['lead-qualification', 'follow-up', 'sales-analytics'],
    difficulty: 'Intermediate',
    setupTime: 'Medium',
    requirements: ['OpenAI API key', 'CRM integration', 'Email automation'],
    deployment: 'Cloud',
    tags: ['sales', 'lead-qualification', 'follow-up', 'automation'],
    automationPotential: 85,
    useCases: [
      'Lead scoring and qualification',
      'Automated follow-up sequences',
      'Sales pipeline management',
      'Performance tracking'
    ],
    pricing: 'Paid'
  },

  // Customer Support Agents
  {
    id: 'support-bot',
    name: 'Support Bot',
    description: 'Intelligent customer support bot for ticket handling and customer service',
    category: 'Customer Support',
    subcategories: ['ticket-handling', 'customer-service', 'automation'],
    difficulty: 'Intermediate',
    setupTime: 'Medium',
    requirements: ['OpenAI API key', 'Help desk integration', 'Knowledge base'],
    deployment: 'Cloud',
    tags: ['support', 'customer-service', 'automation', 'tickets'],
    automationPotential: 90,
    useCases: [
      'Ticket categorization and routing',
      'Automated responses to common questions',
      'Customer satisfaction surveys',
      'Support analytics'
    ],
    pricing: 'Paid'
  },

  // Data Analysis Agents
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'AI data analyst for data processing, visualization, and insights generation',
    category: 'Data Analysis',
    subcategories: ['data-processing', 'visualization', 'insights'],
    difficulty: 'Advanced',
    setupTime: 'Long',
    requirements: ['OpenAI API key', 'Data processing libraries', 'Database access'],
    deployment: 'Local',
    tags: ['data-analysis', 'visualization', 'insights', 'automation'],
    automationPotential: 80,
    useCases: [
      'Data cleaning and preprocessing',
      'Automated report generation',
      'Trend analysis and forecasting',
      'Data visualization'
    ],
    pricing: 'Enterprise'
  },

  // Content Creation Agents
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'AI content writer for blog posts, social media, and marketing copy',
    category: 'Content Creation',
    subcategories: ['blog-writing', 'social-media', 'marketing-copy'],
    difficulty: 'Beginner',
    setupTime: 'Quick',
    requirements: ['OpenAI API key', 'Content guidelines', 'Brand voice'],
    deployment: 'Cloud',
    tags: ['content-creation', 'writing', 'marketing', 'automation'],
    automationPotential: 70,
    useCases: [
      'Blog post generation',
      'Social media content creation',
      'Email marketing copy',
      'Product descriptions'
    ],
    pricing: 'Freemium'
  },

  // Project Management Agents
  {
    id: 'project-manager',
    name: 'Project Manager',
    description: 'AI project manager for task planning, progress tracking, and team coordination',
    category: 'Project Management',
    subcategories: ['task-planning', 'progress-tracking', 'team-coordination'],
    difficulty: 'Intermediate',
    setupTime: 'Medium',
    requirements: ['OpenAI API key', 'Project management tools', 'Team communication'],
    deployment: 'Cloud',
    tags: ['project-management', 'task-planning', 'automation', 'team-coordination'],
    automationPotential: 75,
    useCases: [
      'Task prioritization and scheduling',
      'Progress monitoring and reporting',
      'Resource allocation',
      'Risk assessment'
    ],
    pricing: 'Paid'
  },

  // Development & DevOps Agents
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'AI coding assistant for code review, debugging, and development automation',
    category: 'Development & DevOps',
    subcategories: ['code-review', 'debugging', 'development'],
    difficulty: 'Advanced',
    setupTime: 'Long',
    requirements: ['OpenAI API key', 'Development environment', 'Code repositories'],
    deployment: 'Local',
    tags: ['development', 'coding', 'debugging', 'automation'],
    automationPotential: 85,
    useCases: [
      'Code review and suggestions',
      'Bug detection and fixing',
      'Documentation generation',
      'Testing automation'
    ],
    pricing: 'Enterprise'
  },

  // Research & Analysis Agents
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'AI research assistant for market research, competitive analysis, and insights',
    category: 'Research & Analysis',
    subcategories: ['market-research', 'competitive-analysis', 'insights'],
    difficulty: 'Intermediate',
    setupTime: 'Medium',
    requirements: ['OpenAI API key', 'Research databases', 'Web scraping'],
    deployment: 'Cloud',
    tags: ['research', 'analysis', 'market-research', 'automation'],
    automationPotential: 80,
    useCases: [
      'Market trend analysis',
      'Competitive intelligence',
      'Industry research reports',
      'Data synthesis'
    ],
    pricing: 'Paid'
  },

  // Communication Agents
  {
    id: 'communication-hub',
    name: 'Communication Hub',
    description: 'AI communication hub for email management, meeting scheduling, and team collaboration',
    category: 'Communication',
    subcategories: ['email-management', 'meeting-scheduling', 'collaboration'],
    difficulty: 'Beginner',
    setupTime: 'Quick',
    requirements: ['OpenAI API key', 'Email integration', 'Calendar access'],
    deployment: 'Cloud',
    tags: ['communication', 'email', 'meetings', 'automation'],
    automationPotential: 85,
    useCases: [
      'Email prioritization and responses',
      'Meeting scheduling and coordination',
      'Team communication management',
      'Communication analytics'
    ],
    pricing: 'Freemium'
  },

  // General Business Agents
  {
    id: 'business-assistant',
    name: 'Business Assistant',
    description: 'General AI business assistant for various business operations and decision support',
    category: 'General Business',
    subcategories: ['operations', 'decision-support', 'automation'],
    difficulty: 'Beginner',
    setupTime: 'Quick',
    requirements: ['OpenAI API key', 'Business process knowledge'],
    deployment: 'Cloud',
    tags: ['business', 'operations', 'decision-support', 'automation'],
    automationPotential: 70,
    useCases: [
      'Process optimization suggestions',
      'Decision support and analysis',
      'Business report generation',
      'Efficiency recommendations'
    ],
    pricing: 'Freemium'
  }
];

export const getAgentsByCategory = (category: AgentCategory): AIAgent[] => {
  return aiAgentsCatalog.filter(agent => agent.category === category);
};

export const getAgentsBySubcategory = (subcategory: string): AIAgent[] => {
  return aiAgentsCatalog.filter(agent => 
    agent.subcategories.includes(subcategory)
  );
};

export const getAgentsByDifficulty = (difficulty: AIAgent['difficulty']): AIAgent[] => {
  return aiAgentsCatalog.filter(agent => agent.difficulty === difficulty);
};

export const getAgentsByAutomationPotential = (minPotential: number): AIAgent[] => {
  return aiAgentsCatalog.filter(agent => agent.automationPotential >= minPotential);
};

export const searchAgents = (query: string): AIAgent[] => {
  const lowerQuery = query.toLowerCase();
  return aiAgentsCatalog.filter(agent =>
    agent.name.toLowerCase().includes(lowerQuery) ||
    agent.description.toLowerCase().includes(lowerQuery) ||
    agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    agent.subcategories.some(sub => sub.toLowerCase().includes(lowerQuery))
  );
};
