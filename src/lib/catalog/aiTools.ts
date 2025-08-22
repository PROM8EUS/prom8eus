// AI Tools Katalog mit Logo-Informationen für alle Branchen
export interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string[];
  logo: {
    url: string;
    alt: string;
    backgroundColor?: string;
    textColor?: string;
  };
  website: string;
  pricing: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
  automationPotential: number; // 0-100
  features: string[];
}

// Hilfsfunktion für mehrsprachige Beschreibungen
export function getToolDescription(tool: AITool, lang: 'de' | 'en'): string {
  const descriptions: Record<string, { de: string; en: string }> = {
    'chatgpt': {
      de: 'Allgemeine Programmierunterstützung, Code-Erklärungen, Debugging-Hilfe',
      en: 'General programming support, code explanations, debugging assistance'
    },
    'claude': {
      de: 'Detaillierte Code-Analysen, Sicherheitsprüfungen, Architektur-Beratung',
      en: 'Detailed code analysis, security checks, architecture consulting'
    },
    'github-copilot': {
      de: 'Code-Vervollständigung, automatische Funktionen, Tests',
      en: 'Code completion, automatic functions, tests'
    },
    'code-whisperer': {
      de: 'AWS-spezifische Entwicklung, Cloud-Integration',
      en: 'AWS-specific development, cloud integration'
    },
    'tabnine': {
      de: 'Lokale Code-Vervollständigung, Offline-Entwicklung',
      en: 'Local code completion, offline development'
    },
    'notion-ai': {
      de: 'Patientendaten-Management, Dokumentation, Workflows',
      en: 'Patient data management, documentation, workflows'
    },
    'obsidian-ai': {
      de: 'Medizinisches Knowledge Management, Fallstudien',
      en: 'Medical knowledge management, case studies'
    },
    'microsoft-copilot': {
      de: 'Office-Integration für medizinische Berichte',
      en: 'Office integration for medical reports'
    },
    'excel-ai': {
      de: 'Automatische Datenverarbeitung, Berichte, Dashboards',
      en: 'Automatic data processing, reports, dashboards'
    },
    'power-bi-ai': {
      de: 'Finanzdashboards, Trendanalyse, Visualisierung',
      en: 'Financial dashboards, trend analysis, visualization'
    },
    'google-sheets-ai': {
      de: 'Kollaborative Finanzanalyse, Automatisierung',
      en: 'Collaborative financial analysis, automation'
    },
    'airtable-ai': {
      de: 'Finanzdaten-Management, Workflows, Automatisierung',
      en: 'Financial data management, workflows, automation'
    },
    'jasper': {
      de: 'Marketing-Content, Werbetexte, Social Media',
      en: 'Marketing content, advertising copy, social media'
    },
    'copy-ai': {
      de: 'Conversion-optimierte Texte, A/B-Testing',
      en: 'Conversion-optimized texts, A/B testing'
    },
    'writesonic': {
      de: 'E-Commerce-Content, Produktbeschreibungen',
      en: 'E-commerce content, product descriptions'
    },
    'canva-ai': {
      de: 'Design-Templates, Visual Content, Branding',
      en: 'Design templates, visual content, branding'
    },
    'perplexity': {
      de: 'Recherche-basiert, Quellenangaben, Faktenprüfung',
      en: 'Research-based, citations, fact-checking'
    },
    'grammarly': {
      de: 'Grammatik, Stil, Plagiat',
      en: 'Grammar, style, plagiarism'
    },
    'grok': {
      de: 'Echtzeit-Informationen, Innovation, Trendanalyse',
      en: 'Real-time information, innovation, trend analysis'
    },
    'gemini': {
      de: 'Multimodal, Google-Integration, Recherche',
      en: 'Multimodal, Google integration, research'
    }
  };
  
  return descriptions[tool.id]?.[lang] || tool.description;
}

// Hilfsfunktion für mehrsprachige Features
export function getToolFeatures(tool: AITool, lang: 'de' | 'en'): string[] {
  const features: Record<string, { de: string[]; en: string[] }> = {
    'chatgpt': {
      de: ['Code-Erklärungen', 'Debugging-Hilfe', 'Dokumentation', 'Allgemeine Unterstützung'],
      en: ['Code Explanations', 'Debugging Help', 'Documentation', 'General Support']
    },
    'claude': {
      de: ['Code-Analysen', 'Sicherheitsprüfungen', 'Architektur-Beratung', 'Detaillierte Analysen'],
      en: ['Code Analysis', 'Security Checks', 'Architecture Consulting', 'Detailed Analysis']
    },
    'github-copilot': {
      de: ['Code-Vervollständigung', 'Automatische Tests', 'Funktionsgenerierung', 'IDE-Integration'],
      en: ['Code Completion', 'Automatic Tests', 'Function Generation', 'IDE Integration']
    },
    'code-whisperer': {
      de: ['AWS-Integration', 'Cloud-Entwicklung', 'Code-Vervollständigung', 'Sicherheitsanalyse'],
      en: ['AWS Integration', 'Cloud Development', 'Code Completion', 'Security Analysis']
    },
    'tabnine': {
      de: ['Lokale Ausführung', 'Offline-Entwicklung', 'Code-Vervollständigung', 'Privatsphäre'],
      en: ['Local Execution', 'Offline Development', 'Code Completion', 'Privacy']
    },
    'notion-ai': {
      de: ['Dokumentation', 'Workflows', 'Daten-Management', 'Kollaboration'],
      en: ['Documentation', 'Workflows', 'Data Management', 'Collaboration']
    },
    'obsidian-ai': {
      de: ['Knowledge Graph', 'Fallstudien', 'Forschungsnotizen', 'Lokale Speicherung'],
      en: ['Knowledge Graph', 'Case Studies', 'Research Notes', 'Local Storage']
    },
    'microsoft-copilot': {
      de: ['Office-Integration', 'Berichtserstellung', 'Datenanalyse', 'Produktivität'],
      en: ['Office Integration', 'Report Creation', 'Data Analysis', 'Productivity']
    },
    'excel-ai': {
      de: ['Datenverarbeitung', 'Automatische Berichte', 'Dashboards', 'Formeln'],
      en: ['Data Processing', 'Automatic Reports', 'Dashboards', 'Formulas']
    },
    'power-bi-ai': {
      de: ['Dashboards', 'Trendanalyse', 'Visualisierung', 'Echtzeit-Daten'],
      en: ['Dashboards', 'Trend Analysis', 'Visualization', 'Real-time Data']
    },
    'google-sheets-ai': {
      de: ['Kollaboration', 'Finanzanalyse', 'Automatisierung', 'Cloud-basiert'],
      en: ['Collaboration', 'Financial Analysis', 'Automation', 'Cloud-based']
    },
    'airtable-ai': {
      de: ['Daten-Management', 'Workflows', 'Automatisierung', 'Kollaboration'],
      en: ['Data Management', 'Workflows', 'Automation', 'Collaboration']
    },
    'jasper': {
      de: ['Content-Erstellung', 'Werbetexte', 'Social Media', 'Brand Voice'],
      en: ['Content Creation', 'Advertising Copy', 'Social Media', 'Brand Voice']
    },
    'copy-ai': {
      de: ['Conversion-Optimierung', 'A/B-Testing', 'Copywriting', 'Templates'],
      en: ['Conversion Optimization', 'A/B Testing', 'Copywriting', 'Templates']
    },
    'writesonic': {
      de: ['E-Commerce-Content', 'Produktbeschreibungen', 'Landing Pages', 'SEO'],
      en: ['E-commerce Content', 'Product Descriptions', 'Landing Pages', 'SEO']
    },
    'canva-ai': {
      de: ['Design-Templates', 'Visual Content', 'Branding', 'Kollaboration'],
      en: ['Design Templates', 'Visual Content', 'Branding', 'Collaboration']
    },
    'perplexity': {
      de: ['Recherche', 'Quellenangaben', 'Faktenprüfung', 'Aktuelle Informationen'],
      en: ['Research', 'Citations', 'Fact-checking', 'Current Information']
    },
    'grammarly': {
      de: ['Grammatik-Korrektur', 'Stil-Verbesserung', 'Plagiat-Erkennung', 'Schreibhilfe'],
      en: ['Grammar Correction', 'Style Improvement', 'Plagiarism Detection', 'Writing Help']
    },
    'grok': {
      de: ['Echtzeit-Informationen', 'Innovation', 'Trendanalyse', 'Humor'],
      en: ['Real-time Information', 'Innovation', 'Trend Analysis', 'Humor']
    },
    'gemini': {
      de: ['Multimodal', 'Google-Integration', 'Recherche', 'Bildanalyse'],
      en: ['Multimodal', 'Google Integration', 'Research', 'Image Analysis']
    }
  };
  
  return features[tool.id]?.[lang] || tool.features;
}

export const AI_TOOLS: AITool[] = [
  // Technologie & IT
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'Allgemeine Programmierunterstützung, Code-Erklärungen, Debugging-Hilfe',
    category: 'LLM',
    industry: ['tech', 'general'],
    logo: {
      url: '/logos/chatgpt.png',
      alt: 'ChatGPT Logo',
      backgroundColor: '#10a37f',
      textColor: '#ffffff'
    },
    website: 'https://chat.openai.com',
    pricing: 'Freemium',
    automationPotential: 75,
    features: ['Code-Erklärungen', 'Debugging-Hilfe', 'Dokumentation', 'Allgemeine Unterstützung']
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Detaillierte Code-Analysen, Sicherheitsprüfungen, Architektur-Beratung',
    category: 'LLM',
    industry: ['tech', 'general'],
    logo: {
      url: '/logos/claude.png',
      alt: 'Claude Logo',
      backgroundColor: '#CC785C',
      textColor: '#ffffff'
    },
    website: 'https://claude.ai',
    pricing: 'Freemium',
    automationPotential: 80,
    features: ['Code-Analysen', 'Sicherheitsprüfungen', 'Architektur-Beratung', 'Detaillierte Analysen']
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'Code-Vervollständigung, automatische Funktionen, Tests',
    category: 'Code Assistant',
    industry: ['tech'],
    logo: {
      url: '/logos/github-copilot.png',
      alt: 'GitHub Copilot Logo',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    },
    website: 'https://github.com/features/copilot',
    pricing: 'Paid',
    automationPotential: 85,
    features: ['Code-Vervollständigung', 'Automatische Tests', 'Funktionsgenerierung', 'IDE-Integration']
  },
  {
    id: 'code-whisperer',
    name: 'CodeWhisperer',
    description: 'AWS-spezifische Entwicklung, Cloud-Integration',
    category: 'Code Assistant',
    industry: ['tech'],
    logo: {
      url: '/logos/code-whisperer.png',
      alt: 'CodeWhisperer Logo',
      backgroundColor: '#ff9900',
      textColor: '#ffffff'
    },
    website: 'https://aws.amazon.com/codewhisperer',
    pricing: 'Freemium',
    automationPotential: 80,
    features: ['AWS-Integration', 'Cloud-Entwicklung', 'Code-Vervollständigung', 'Sicherheitsanalyse']
  },
  {
    id: 'tabnine',
    name: 'Tabnine',
    description: 'Lokale Code-Vervollständigung, Offline-Entwicklung',
    category: 'Code Assistant',
    industry: ['tech'],
    logo: {
      url: '/logos/tabnine.png',
      alt: 'Tabnine Logo',
      backgroundColor: '#00d4aa',
      textColor: '#ffffff'
    },
    website: 'https://www.tabnine.com',
    pricing: 'Freemium',
    automationPotential: 75,
    features: ['Lokale Ausführung', 'Offline-Entwicklung', 'Code-Vervollständigung', 'Privatsphäre']
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow-Automatisierung, API-Integration, No-Code/Low-Code',
    category: 'Automation',
    industry: ['tech', 'general'],
    logo: {
      url: 'https://logo.clearbit.com/n8n.io',
      alt: 'n8n Logo',
      backgroundColor: '#ff6b6b',
      textColor: '#ffffff'
    },
    website: 'https://n8n.io',
    pricing: 'Freemium',
    automationPotential: 90,
    features: ['Workflow-Automatisierung', 'API-Integration', 'No-Code', 'Templates', 'Webhooks']
  },

  // Gesundheitswesen
  {
    id: 'notion-ai',
    name: 'Notion AI',
    description: 'Patientendaten-Management, Dokumentation, Workflows',
    category: 'Documentation',
    industry: ['healthcare', 'hr', 'education', 'legal', 'general'],
    logo: {
      url: '/logos/notion-ai.png',
      alt: 'Notion AI Logo',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    },
    website: 'https://www.notion.so',
    pricing: 'Freemium',
    automationPotential: 70,
    features: ['Dokumentation', 'Workflows', 'Daten-Management', 'Kollaboration']
  },
  {
    id: 'obsidian-ai',
    name: 'Obsidian AI',
    description: 'Medizinisches Knowledge Management, Fallstudien',
    category: 'Knowledge Management',
    industry: ['healthcare', 'education', 'research'],
    logo: {
      url: '/logos/obsidian-ai.png',
      alt: 'Obsidian Logo',
      backgroundColor: '#7c3aed',
      textColor: '#ffffff'
    },
    website: 'https://obsidian.md',
    pricing: 'Free',
    automationPotential: 65,
    features: ['Knowledge Graph', 'Fallstudien', 'Forschungsnotizen', 'Lokale Speicherung']
  },
  {
    id: 'microsoft-copilot',
    name: 'Microsoft Copilot',
    description: 'Office-Integration für medizinische Berichte',
    category: 'Office Integration',
    industry: ['healthcare', 'hr', 'finance', 'general'],
    logo: {
      url: '/logos/microsoft-copilot.png',
      alt: 'Microsoft Copilot Logo',
      backgroundColor: '#0078d4',
      textColor: '#ffffff'
    },
    website: 'https://copilot.microsoft.com',
    pricing: 'Paid',
    automationPotential: 75,
    features: ['Office-Integration', 'Berichtserstellung', 'Datenanalyse', 'Produktivität']
  },

  // Finanzwesen
  {
    id: 'excel-ai',
    name: 'Excel AI',
    description: 'Automatische Datenverarbeitung, Berichte, Dashboards',
    category: 'Data Analysis',
    industry: ['finance', 'production', 'general'],
    logo: {
      url: '/logos/excel-ai.png',
      alt: 'Excel AI Logo',
      backgroundColor: '#217346',
      textColor: '#ffffff'
    },
    website: 'https://www.microsoft.com/en-us/microsoft-365/excel',
    pricing: 'Paid',
    automationPotential: 85,
    features: ['Datenverarbeitung', 'Automatische Berichte', 'Dashboards', 'Formeln']
  },
  {
    id: 'power-bi-ai',
    name: 'Power BI AI',
    description: 'Finanzdashboards, Trendanalyse, Visualisierung',
    category: 'Business Intelligence',
    industry: ['finance', 'production', 'marketing'],
    logo: {
      url: '/logos/power-bi-ai.png',
      alt: 'Power BI Logo',
      backgroundColor: '#f2c811',
      textColor: '#000000'
    },
    website: 'https://powerbi.microsoft.com',
    pricing: 'Paid',
    automationPotential: 80,
    features: ['Dashboards', 'Trendanalyse', 'Visualisierung', 'Echtzeit-Daten']
  },
  {
    id: 'google-sheets-ai',
    name: 'Google Sheets AI',
    description: 'Kollaborative Finanzanalyse, Automatisierung',
    category: 'Data Analysis',
    industry: ['finance', 'hr', 'general'],
    logo: {
      url: '/logos/google-sheets-ai.png',
      alt: 'Google Sheets Logo',
      backgroundColor: '#34a853',
      textColor: '#ffffff'
    },
    website: 'https://sheets.google.com',
    pricing: 'Freemium',
    automationPotential: 75,
    features: ['Kollaboration', 'Finanzanalyse', 'Automatisierung', 'Cloud-basiert']
  },
  {
    id: 'airtable-ai',
    name: 'Airtable AI',
    description: 'Finanzdaten-Management, Workflows, Automatisierung',
    category: 'Database',
    industry: ['finance', 'hr', 'production', 'general'],
    logo: {
      url: '/logos/airtable-ai.png',
      alt: 'Airtable Logo',
      backgroundColor: '#ff6b35',
      textColor: '#ffffff'
    },
    website: 'https://airtable.com',
    pricing: 'Freemium',
    automationPotential: 80,
    features: ['Daten-Management', 'Workflows', 'Automatisierung', 'Kollaboration']
  },

  // Marketing & Sales
  {
    id: 'jasper',
    name: 'Jasper',
    description: 'Marketing-Content, Werbetexte, Social Media',
    category: 'Content Creation',
    industry: ['marketing'],
    logo: {
      url: '/logos/jasper.png',
      alt: 'Jasper Logo',
      backgroundColor: '#ff6b35',
      textColor: '#ffffff'
    },
    website: 'https://jasper.ai',
    pricing: 'Paid',
    automationPotential: 75,
    features: ['Content-Erstellung', 'Werbetexte', 'Social Media', 'Brand Voice']
  },
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    description: 'Conversion-optimierte Texte, A/B-Testing',
    category: 'Content Creation',
    industry: ['marketing'],
    logo: {
      url: '/logos/copy-ai.png',
      alt: 'Copy.ai Logo',
      backgroundColor: '#6366f1',
      textColor: '#ffffff'
    },
    website: 'https://copy.ai',
    pricing: 'Freemium',
    automationPotential: 70,
    features: ['Conversion-Optimierung', 'A/B-Testing', 'Copywriting', 'Templates']
  },
  {
    id: 'writesonic',
    name: 'Writesonic',
    description: 'E-Commerce-Content, Produktbeschreibungen',
    category: 'Content Creation',
    industry: ['marketing'],
    logo: {
      url: '/logos/writesonic.png',
      alt: 'Writesonic Logo',
      backgroundColor: '#8b5cf6',
      textColor: '#ffffff'
    },
    website: 'https://writesonic.com',
    pricing: 'Freemium',
    automationPotential: 70,
    features: ['E-Commerce-Content', 'Produktbeschreibungen', 'Landing Pages', 'SEO']
  },
  {
    id: 'canva-ai',
    name: 'Canva AI',
    description: 'Design-Templates, Visual Content, Branding',
    category: 'Design',
    industry: ['marketing', 'general'],
    logo: {
      url: '/logos/canva-ai.png',
      alt: 'Canva Logo',
      backgroundColor: '#00c4cc',
      textColor: '#ffffff'
    },
    website: 'https://canva.com',
    pricing: 'Freemium',
    automationPotential: 65,
    features: ['Design-Templates', 'Visual Content', 'Branding', 'Kollaboration']
  },

  // HR & Personal
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Recherche-basiert, Quellenangaben, Faktenprüfung',
    category: 'Research',
    industry: ['healthcare', 'education', 'legal', 'general'],
    logo: {
      url: '/logos/perplexity.png',
      alt: 'Perplexity Logo',
      backgroundColor: '#6366f1',
      textColor: '#ffffff'
    },
    website: 'https://perplexity.ai',
    pricing: 'Freemium',
    automationPotential: 75,
    features: ['Recherche', 'Quellenangaben', 'Faktenprüfung', 'Aktuelle Informationen']
  },

  // Bildung & Forschung
  {
    id: 'grammarly',
    name: 'Grammarly',
    description: 'Grammatik, Stil, Plagiat',
    category: 'Writing Assistant',
    industry: ['education', 'general'],
    logo: {
      url: '/logos/grammarly.png',
      alt: 'Grammarly Logo',
      backgroundColor: '#15c39a',
      textColor: '#ffffff'
    },
    website: 'https://grammarly.com',
    pricing: 'Freemium',
    automationPotential: 70,
    features: ['Grammatik-Korrektur', 'Stil-Verbesserung', 'Plagiat-Erkennung', 'Schreibhilfe']
  },

  // Allgemeine Tools
  {
    id: 'grok',
    name: 'Grok',
    description: 'Echtzeit-Informationen, Innovation, Trendanalyse',
    category: 'LLM',
    industry: ['general'],
    logo: {
      url: '/logos/grok.png',
      alt: 'Grok Logo',
      backgroundColor: '#ff6b35',
      textColor: '#ffffff'
    },
    website: 'https://grok.x.ai',
    pricing: 'Paid',
    automationPotential: 70,
    features: ['Echtzeit-Informationen', 'Innovation', 'Trendanalyse', 'Humor']
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Multimodal, Google-Integration, Recherche',
    category: 'LLM',
    industry: ['general'],
    logo: {
      url: '/logos/gemini.png',
      alt: 'Gemini Logo',
      backgroundColor: '#4285f4',
      textColor: '#ffffff'
    },
    website: 'https://gemini.google.com',
    pricing: 'Freemium',
    automationPotential: 75,
    features: ['Multimodal', 'Google-Integration', 'Recherche', 'Bildanalyse']
  }
];

// Hilfsfunktionen
export function getToolsByIndustry(industry: string): AITool[] {
  return AI_TOOLS.filter(tool => tool.industry.includes(industry));
}

export function getToolsByCategory(category: string): AITool[] {
  return AI_TOOLS.filter(tool => tool.category === category);
}

export function getToolById(id: string): AITool | undefined {
  return AI_TOOLS.find(tool => tool.id === id);
}

export function getTopToolsByIndustry(industry: string, limit: number = 5): AITool[] {
  return getToolsByIndustry(industry)
    .sort((a, b) => b.automationPotential - a.automationPotential)
    .slice(0, limit);
}

export function getToolsByAutomationPotential(minPotential: number): AITool[] {
  return AI_TOOLS.filter(tool => tool.automationPotential >= minPotential);
}
