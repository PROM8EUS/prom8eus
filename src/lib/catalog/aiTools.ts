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
      backgroundColor: '#000000',
      textColor: '#ffffff'
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
      backgroundColor: '#000000',
      textColor: '#ffffff'
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
