import React, { useState } from 'react';
import { AppIcon, AppIconList, AppIconCard, AppIconGrid } from './AppIcon';
import { AITool, getToolsByIndustry, getTopToolsByIndustry } from '../lib/catalog/aiTools';

interface AIToolRecommendationsProps {
  industry: string;
  tasks: Array<{ text: string; aiTools?: string[] }>;
  className?: string;
}

const AIToolRecommendations: React.FC<AIToolRecommendationsProps> = ({
  industry,
  tasks,
  className = ''
}) => {
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'cards'>('cards');

  // Sammle alle empfohlenen AI-Tools aus den Aufgaben
  const recommendedToolIds = tasks
    .flatMap(task => task.aiTools || [])
    .filter((id, index, arr) => arr.indexOf(id) === index); // Deduplizieren

  // Hole die Tool-Objekte basierend auf den IDs
  const recommendedTools = recommendedToolIds
    .map(id => getToolsByIndustry(industry).find(tool => tool.id === id))
    .filter(Boolean) as AITool[];

  // Fallback: Top-Tools für die Branche wenn keine spezifischen Empfehlungen
  const fallbackTools = getTopToolsByIndustry(industry, 5);
  const displayTools = recommendedTools.length > 0 ? recommendedTools : fallbackTools;

  const handleToolClick = (tool: AITool) => {
    setSelectedTool(tool);
  };

  const handleCloseModal = () => {
    setSelectedTool(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Empfohlene AI-Tools für {industry === 'tech' ? 'Technologie & IT' :
                                   industry === 'healthcare' ? 'Gesundheitswesen' :
                                   industry === 'finance' ? 'Finanzwesen' :
                                   industry === 'marketing' ? 'Marketing & Sales' :
                                   industry === 'hr' ? 'HR & Personal' :
                                   industry === 'production' ? 'Produktion & Logistik' :
                                   industry === 'education' ? 'Bildung & Forschung' :
                                   industry === 'legal' ? 'Recht & Compliance' :
                                   'Ihre Branche'}
          </h3>
          <p className="text-sm text-gray-600">
            {recommendedTools.length > 0 
              ? `${recommendedTools.length} Tools basierend auf Ihrer Aufgabenanalyse`
              : `${fallbackTools.length} Top-Tools für Ihre Branche`
            }
          </p>
        </div>


      </div>

      {/* Tools Display */}
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {displayTools.map((tool) => (
            <AppIconCard
              key={tool.id}
              tool={tool}
              onClick={() => handleToolClick(tool)}
            />
          ))}
        </div>
      </div>

      {/* Tool Details Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AppIcon tool={selectedTool} size="lg" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTool.name}</h2>
                    <p className="text-sm text-gray-600">{selectedTool.category}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Beschreibung</h3>
                  <p className="text-gray-600">{selectedTool.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTool.pricing === 'Free' ? 'bg-green-100 text-green-800' :
                      selectedTool.pricing === 'Freemium' ? 'bg-blue-100 text-blue-800' :
                      selectedTool.pricing === 'Paid' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedTool.pricing}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      <span className="font-medium">{selectedTool.automationPotential}%</span> Automatisierungspotenzial
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTool.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <a
                    href={selectedTool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
                  >
                    Website besuchen
                  </a>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branchen-spezifische Tipps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Branchen-Tipp</h4>
        <p className="text-sm text-blue-800">
          {industry === 'tech' && "Kombinieren Sie GitHub Copilot mit Claude für optimale Code-Qualität und Sicherheit."}
          {industry === 'healthcare' && "Nutzen Sie Notion AI für strukturierte Patientendaten und Microsoft Copilot für medizinische Berichte."}
          {industry === 'finance' && "Excel AI und Power BI AI bieten die beste Kombination für Finanzanalyse und Reporting."}
          {industry === 'marketing' && "Jasper für Content-Erstellung und Canva AI für visuelle Elemente sind eine starke Kombination."}
          {industry === 'hr' && "Airtable AI für Bewerber-Management und Notion AI für HR-Dokumentation optimieren Ihre Prozesse."}
          {industry === 'production' && "Excel AI für Produktionsdaten und Power BI AI für Performance-Monitoring bieten umfassende Einblicke."}
          {industry === 'education' && "Notion AI für Kurs-Management und Obsidian AI für Forschungsnotizen unterstützen Ihre akademische Arbeit."}
          {industry === 'legal' && "Claude für Rechtsanalysen und Perplexity für aktuelle Gesetze sind unverzichtbar für Ihre Arbeit."}
          {!['tech', 'healthcare', 'finance', 'marketing', 'hr', 'production', 'education', 'legal'].includes(industry) && 
            "ChatGPT und Claude bieten eine solide Grundlage für allgemeine Aufgaben in Ihrer Branche."}
        </p>
      </div>
    </div>
  );
};

export { AIToolRecommendations };
