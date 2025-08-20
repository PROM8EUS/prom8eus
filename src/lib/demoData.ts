// Demo data for public analyses
export const generateDemoAnalyses = () => {
  const demoAnalyses = [
    {
      id: 'demo_1',
      timestamp: Date.now() - 3600000, // 1 hour ago
      score: 85,
      jobTitle: 'Data Scientist',
      taskCount: 12,
      summary: 'Analyse zeigt hohes Automatisierungspotenzial für Datenverarbeitung und Modellierung',
      isPublic: true,
      views: 24,
      author: 'Demo User 1'
    },
    {
      id: 'demo_2',
      timestamp: Date.now() - 7200000, // 2 hours ago
      score: 72,
      jobTitle: 'Marketing Manager',
      taskCount: 15,
      summary: 'Gute Automatisierungsmöglichkeiten für Content-Erstellung und Kampagnen-Management',
      isPublic: true,
      views: 18,
      author: 'Demo User 2'
    },
    {
      id: 'demo_3',
      timestamp: Date.now() - 10800000, // 3 hours ago
      score: 91,
      jobTitle: 'DevOps Engineer',
      taskCount: 8,
      summary: 'Sehr hohes Automatisierungspotenzial für CI/CD und Infrastructure Management',
      isPublic: true,
      views: 31,
      author: 'Demo User 3'
    },
    {
      id: 'demo_4',
      timestamp: Date.now() - 14400000, // 4 hours ago
      score: 45,
      jobTitle: 'HR Manager',
      taskCount: 10,
      summary: 'Moderate Automatisierung für administrative Aufgaben, menschliche Expertise erforderlich',
      isPublic: true,
      views: 12,
      author: 'Demo User 4'
    },
    {
      id: 'demo_5',
      timestamp: Date.now() - 18000000, // 5 hours ago
      score: 78,
      jobTitle: 'Financial Analyst',
      taskCount: 14,
      summary: 'Hohe Automatisierung für Datenanalyse und Reporting möglich',
      isPublic: true,
      views: 22,
      author: 'Demo User 5'
    },
    {
      id: 'demo_6',
      timestamp: Date.now() - 21600000, // 6 hours ago
      score: 35,
      jobTitle: 'Sales Representative',
      taskCount: 9,
      summary: 'Begrenzte Automatisierung, menschliche Interaktion wichtig',
      isPublic: true,
      views: 8,
      author: 'Demo User 6'
    },
    {
      id: 'demo_7',
      timestamp: Date.now() - 25200000, // 7 hours ago
      score: 68,
      jobTitle: 'Software Engineer',
      taskCount: 11,
      summary: 'Hohe Automatisierung für Entwicklungsaufgaben und Code-Reviews',
      isPublic: true,
      views: 15,
      author: 'Demo User 7'
    },
    {
      id: 'demo_8',
      timestamp: Date.now() - 28800000, // 8 hours ago
      score: 55,
      jobTitle: 'Product Manager',
      taskCount: 13,
      summary: 'Moderate Automatisierung für administrative Aufgaben, strategische Entscheidungen bleiben menschlich',
      isPublic: true,
      views: 9,
      author: 'Demo User 8'
    }
  ];

  return demoAnalyses;
};

// Demo analysis data for full results
export const getDemoAnalysisData = (id: string) => {
  const demoData = {
    'demo_1': {
      totalScore: 85,
      ratio: { automatisierbar: 85, mensch: 15 },
      tasks: [
        {
          text: 'Datenaufbereitung und -bereinigung',
          score: 95,
          label: 'Automatisierbar',
          category: 'data_processing',
          confidence: 90,
          complexity: 'medium',
          automationTrend: 'increasing'
        },
        {
          text: 'Statistische Modellierung',
          score: 88,
          label: 'Automatisierbar',
          category: 'analytical',
          confidence: 85,
          complexity: 'high',
          automationTrend: 'increasing'
        },
        {
          text: 'Kundenberatung und Präsentation',
          score: 25,
          label: 'Mensch',
          category: 'consultation',
          confidence: 80,
          complexity: 'medium',
          automationTrend: 'stable'
        }
      ],
      summary: 'Analyse zeigt hohes Automatisierungspotenzial für Datenverarbeitung und Modellierung',
      recommendations: [
        'Implementierung von automatisierten Datenpipelines',
        'Verwendung von AutoML-Tools für Modellierung',
        'Beibehaltung menschlicher Expertise für Kundenberatung'
      ],
      originalText: 'Data Scientist Position mit Fokus auf Datenanalyse und Modellierung'
    },
    'demo_2': {
      totalScore: 72,
      ratio: { automatisierbar: 72, mensch: 28 },
      tasks: [
        {
          text: 'Content-Erstellung für Social Media',
          score: 75,
          label: 'Automatisierbar',
          category: 'content',
          confidence: 70,
          complexity: 'medium',
          automationTrend: 'increasing'
        },
        {
          text: 'Kampagnen-Performance-Analyse',
          score: 85,
          label: 'Automatisierbar',
          category: 'analytics',
          confidence: 80,
          complexity: 'low',
          automationTrend: 'increasing'
        },
        {
          text: 'Strategische Marketingplanung',
          score: 45,
          label: 'Mensch',
          category: 'strategy',
          confidence: 75,
          complexity: 'high',
          automationTrend: 'stable'
        }
      ],
      summary: 'Gute Automatisierungsmöglichkeiten für Content-Erstellung und Kampagnen-Management',
      recommendations: [
        'AI-gestützte Content-Generierung implementieren',
        'Automatisierte Reporting-Tools einsetzen',
        'Menschliche Expertise für strategische Entscheidungen beibehalten'
      ],
      originalText: 'Marketing Manager mit Verantwortung für digitale Kampagnen und Content-Strategie'
    }
  };

  return demoData[id as keyof typeof demoData];
};
