import React, { useState } from 'react';
import { AppIcon, AppIconList, AppIconCard, AppIconGrid } from './AppIcon';
import { AITool, getToolsByIndustry, getTopToolsByIndustry, getToolDescription, getToolFeatures } from '../lib/catalog/aiTools';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Lightbulb } from 'lucide-react';

// Helper function to get industry display name
const getIndustryDisplayName = (industry: string): string => {
  const industryNames: Record<string, string> = {
    'tech': 'Technologie & IT',
    'healthcare': 'Gesundheitswesen',
    'finance': 'Finanzwesen',
    'marketing': 'Marketing & Sales',
    'hr': 'HR & Personal',
    'production': 'Produktion & Logistik',
    'education': 'Bildung & Forschung',
    'legal': 'Recht & Compliance',
    'general': 'Allgemein'
  };
  return industryNames[industry] || industry;
};

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
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {lang === 'de' 
              ? `Tools für die ${getIndustryDisplayName(industry)} Branche`
              : `Tools for the ${getIndustryDisplayName(industry)} Industry`
            }
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
            <div 
              key={tool.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleToolClick(tool)}
            >
              <div className="flex items-start gap-3">
                <AppIcon tool={tool} size="lg" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{getToolDescription(tool, lang)}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tool.pricing === 'Free' ? 'bg-green-100 text-green-800' :
                      tool.pricing === 'Freemium' ? 'bg-blue-100 text-blue-800' :
                      tool.pricing === 'Paid' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {tool.pricing}
                    </span>
                    
                    <span className="text-xs text-gray-500">
                      {tool.automationPotential}% {lang === 'de' ? 'Automatisierung' : 'Automation'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {getToolFeatures(tool, lang).slice(0, 3).map((feature, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {getToolFeatures(tool, lang).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{getToolFeatures(tool, lang).length - 3} {lang === 'de' ? 'mehr' : 'more'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
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

      {/* Industry Tips - Compact */}
      <div className="bg-muted/30 border border-muted/40 rounded-lg p-4">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          {lang === 'de' ? 'Branchen-Tipps für Automatisierung' : 'Industry Tips for Automation'}
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h5 className="font-medium text-foreground text-sm">
                {lang === 'de' ? 'Starte mit einfachen Automatisierungen' : 'Start with simple automations'}
              </h5>
              <p className="text-xs text-muted-foreground">
                {lang === 'de' 
                  ? 'Wiederkehrende, strukturierte Aufgaben bieten das höchste Automatisierungspotenzial.'
                  : 'Repetitive, structured tasks offer the highest automation potential.'
                }
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h5 className="font-medium text-foreground text-sm">
                {lang === 'de' ? 'Kombiniere AI-Tools strategisch' : 'Combine AI tools strategically'}
              </h5>
              <p className="text-xs text-muted-foreground">
                {lang === 'de' 
                  ? 'Verwenden Sie verschiedene AI-Tools für verschiedene Aufgabenbereiche.'
                  : 'Use different AI tools for different task areas.'
                }
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h5 className="font-medium text-foreground text-sm">
                {lang === 'de' ? 'Messe und optimiere kontinuierlich' : 'Measure and optimize continuously'}
              </h5>
              <p className="text-xs text-muted-foreground">
                {lang === 'de' 
                  ? 'Tracken Sie Zeitersparnis und optimieren Sie basierend auf Daten.'
                  : 'Track time savings and optimize based on data.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AIToolRecommendations };
