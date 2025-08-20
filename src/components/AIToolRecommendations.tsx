import React, { useState } from 'react';
import { AppIcon, AppIconList, AppIconCard, AppIconGrid } from './AppIcon';
import { AITool, getToolsByIndustry, getTopToolsByIndustry, getToolDescription, getToolFeatures } from '../lib/catalog/aiTools';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface AIToolRecommendationsProps {
  industry: string;
  tasks: Array<{ text: string; aiTools?: string[] }>;
  className?: string;
  lang?: 'de' | 'en';
}

const AIToolRecommendations: React.FC<AIToolRecommendationsProps> = ({
  industry,
  tasks,
  className = '',
  lang = 'de'
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {lang === 'de' ? 'Empfohlene AI-Tools für ' : 'Recommended AI-Tools for '}
            {industry === 'tech' ? (lang === 'de' ? 'Technologie & IT' : 'Technology & IT') :
             industry === 'healthcare' ? (lang === 'de' ? 'Gesundheitswesen' : 'Healthcare') :
             industry === 'finance' ? (lang === 'de' ? 'Finanzwesen' : 'Finance') :
             industry === 'marketing' ? (lang === 'de' ? 'Marketing & Sales' : 'Marketing & Sales') :
             industry === 'hr' ? (lang === 'de' ? 'HR & Personal' : 'HR & Personnel') :
             industry === 'production' ? (lang === 'de' ? 'Produktion & Logistik' : 'Production & Logistics') :
             industry === 'education' ? (lang === 'de' ? 'Bildung & Forschung' : 'Education & Research') :
             industry === 'legal' ? (lang === 'de' ? 'Recht & Compliance' : 'Legal & Compliance') :
             (lang === 'de' ? 'Ihre Branche' : 'Your Industry')}
          </h3>
          <p className="text-sm text-gray-600">
            {recommendedTools.length > 0 
              ? (lang === 'de' 
                  ? `${recommendedTools.length} Tools basierend auf Ihrer Aufgabenanalyse`
                  : `${recommendedTools.length} Tools based on your task analysis`)
              : (lang === 'de'
                  ? `${fallbackTools.length} Top-Tools für Ihre Branche`
                  : `${fallbackTools.length} Top-Tools for your industry`)
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
              lang={lang}
            />
          ))}
        </div>
      </div>

      {/* AI Tool Detail Modal */}
      <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedTool && <AppIcon tool={selectedTool} size="md" />}
              <span>{selectedTool?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTool && (
            <div className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Beschreibung' : 'Description'}</h4>
                <p className="text-sm text-muted-foreground">{getToolDescription(selectedTool, lang || 'de')}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Kategorie' : 'Category'}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTool.category}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Branchen' : 'Industries'}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTool.industry.join(', ')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Preismodell' : 'Pricing'}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTool.pricing}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Automatisierungspotenzial' : 'Automation Potential'}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedTool.automationPotential}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{selectedTool.automationPotential}%</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-medium text-foreground mb-2">{lang === 'de' ? 'Features' : 'Features'}</h4>
                <div className="flex flex-wrap gap-2">
                  {getToolFeatures(selectedTool, lang || 'de').map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Website Link */}
              <div className="flex justify-end">
                <a 
                  href={selectedTool.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span>{lang === 'de' ? 'Website besuchen' : 'Visit Website'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Branchen-spezifische Tipps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 {lang === 'de' ? 'Branchen-Tipp' : 'Industry Tip'}</h4>
        <p className="text-sm text-blue-800">
          {industry === 'tech' && (lang === 'de' 
            ? "Kombinieren Sie GitHub Copilot mit Claude für optimale Code-Qualität und Sicherheit."
            : "Combine GitHub Copilot with Claude for optimal code quality and security.")}
          {industry === 'healthcare' && (lang === 'de'
            ? "Nutzen Sie Notion AI für strukturierte Patientendaten und Microsoft Copilot für medizinische Berichte."
            : "Use Notion AI for structured patient data and Microsoft Copilot for medical reports.")}
          {industry === 'finance' && (lang === 'de'
            ? "Excel AI und Power BI AI bieten die beste Kombination für Finanzanalyse und Reporting."
            : "Excel AI and Power BI AI offer the best combination for financial analysis and reporting.")}
          {industry === 'marketing' && (lang === 'de'
            ? "Jasper für Content-Erstellung und Canva AI für visuelle Elemente sind eine starke Kombination."
            : "Jasper for content creation and Canva AI for visual elements are a powerful combination.")}
          {industry === 'hr' && (lang === 'de'
            ? "Airtable AI für Bewerber-Management und Notion AI für HR-Dokumentation optimieren Ihre Prozesse."
            : "Airtable AI for applicant management and Notion AI for HR documentation optimize your processes.")}
          {industry === 'production' && (lang === 'de'
            ? "Excel AI für Produktionsdaten und Power BI AI für Performance-Monitoring bieten umfassende Einblicke."
            : "Excel AI for production data and Power BI AI for performance monitoring provide comprehensive insights.")}
          {industry === 'education' && (lang === 'de'
            ? "Notion AI für Kurs-Management und Obsidian AI für Forschungsnotizen unterstützen Ihre akademische Arbeit."
            : "Notion AI for course management and Obsidian AI for research notes support your academic work.")}
          {industry === 'legal' && (lang === 'de'
            ? "Claude für Rechtsanalysen und Perplexity für aktuelle Gesetze sind unverzichtbar für Ihre Arbeit."
            : "Claude for legal analysis and Perplexity for current laws are essential for your work.")}
          {!['tech', 'healthcare', 'finance', 'marketing', 'hr', 'production', 'education', 'legal'].includes(industry) && 
            (lang === 'de'
              ? "ChatGPT und Claude bieten eine solide Grundlage für allgemeine Aufgaben in Ihrer Branche."
              : "ChatGPT and Claude provide a solid foundation for general tasks in your industry.")}
        </p>
      </div>
    </div>
  );
};

export { AIToolRecommendations };
