import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppIcon } from './AppIcon';
import ScoreCircle from './ScoreCircle';
import { ChevronRight } from 'lucide-react';
import { DynamicSubtask } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ListItemProps {
  subtask: DynamicSubtask;
  index: number;
  lang?: 'de' | 'en';
  isSelected?: boolean;
  onClick?: () => void;
  isLast?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  subtask,
  index,
  lang = 'de',
  isSelected = false,
  onClick,
  isLast = false
}) => {
  // Get typical applications for this subtask
  const getTypicalApplications = (subtask: DynamicSubtask) => {
    const applications = [
      { id: 'chatgpt', name: 'ChatGPT', logoKey: 'chatgpt', category: 'ai' },
      { id: 'claude', name: 'Claude', logoKey: 'claude', category: 'ai' },
      { id: 'gemini', name: 'Gemini', logoKey: 'gemini', category: 'ai' },
      { id: 'grok', name: 'Grok', logoKey: 'grok', category: 'ai' },
      { id: 'perplexity', name: 'Perplexity', logoKey: 'perplexity', category: 'ai' },
      { id: 'github-copilot', name: 'GitHub Copilot', logoKey: 'github-copilot', category: 'development' },
      { id: 'code-whisperer', name: 'Code Whisperer', logoKey: 'code-whisperer', category: 'development' },
      { id: 'tabnine', name: 'Tabnine', logoKey: 'tabnine', category: 'development' },
      { id: 'copy-ai', name: 'Copy.ai', logoKey: 'copy-ai', category: 'content' },
      { id: 'writesonic', name: 'Writesonic', logoKey: 'writesonic', category: 'content' },
      { id: 'jasper', name: 'Jasper', logoKey: 'jasper', category: 'content' },
      { id: 'grammarly', name: 'Grammarly', logoKey: 'grammarly', category: 'content' },
      { id: 'canva-ai', name: 'Canva AI', logoKey: 'canva-ai', category: 'design' },
      { id: 'notion-ai', name: 'Notion AI', logoKey: 'notion-ai', category: 'productivity' },
      { id: 'excel-ai', name: 'Excel AI', logoKey: 'excel-ai', category: 'data' },
      { id: 'power-bi-ai', name: 'Power BI AI', logoKey: 'power-bi-ai', category: 'data' },
      { id: 'google-sheets-ai', name: 'Google Sheets AI', logoKey: 'google-sheets-ai', category: 'data' },
      { id: 'microsoft-copilot', name: 'Microsoft Copilot', logoKey: 'microsoft-copilot', category: 'ai' },
      { id: 'obsidian-ai', name: 'Obsidian AI', logoKey: 'obsidian-ai', category: 'documentation' },
      { id: 'airtable-ai', name: 'Airtable AI', logoKey: 'airtable-ai', category: 'data' }
    ];

    // Filter applications based on subtask title/content
    const lowerTitle = subtask.title.toLowerCase();
    
    if (lowerTitle.includes('daten') || lowerTitle.includes('data') || lowerTitle.includes('analyse') || lowerTitle.includes('report')) {
      return applications.filter(app => ['excel-ai', 'power-bi-ai', 'google-sheets-ai', 'airtable-ai'].includes(app.id));
    }
    
    if (lowerTitle.includes('präsentation') || lowerTitle.includes('presentation') || lowerTitle.includes('meeting')) {
      return applications.filter(app => ['canva-ai', 'notion-ai', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('dokument') || lowerTitle.includes('document') || lowerTitle.includes('bericht')) {
      return applications.filter(app => ['notion-ai', 'obsidian-ai', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('kommunikation') || lowerTitle.includes('communication') || lowerTitle.includes('email')) {
      return applications.filter(app => ['microsoft-copilot', 'chatgpt', 'claude'].includes(app.id));
    }
    
    if (lowerTitle.includes('projekt') || lowerTitle.includes('project') || lowerTitle.includes('task')) {
      return applications.filter(app => ['notion-ai', 'airtable-ai', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('design') || lowerTitle.includes('visual') || lowerTitle.includes('grafik')) {
      return applications.filter(app => ['canva-ai', 'chatgpt', 'claude'].includes(app.id));
    }
    
    if (lowerTitle.includes('entwicklung') || lowerTitle.includes('development') || lowerTitle.includes('programmierung') || lowerTitle.includes('coding')) {
      return applications.filter(app => ['github-copilot', 'code-whisperer', 'tabnine', 'microsoft-copilot'].includes(app.id));
    }
    
    if (lowerTitle.includes('content') || lowerTitle.includes('text') || lowerTitle.includes('schreiben') || lowerTitle.includes('writing')) {
      return applications.filter(app => ['copy-ai', 'writesonic', 'jasper', 'grammarly', 'chatgpt'].includes(app.id));
    }
    
    if (lowerTitle.includes('ai') || lowerTitle.includes('automatisierung') || lowerTitle.includes('automation')) {
      return applications.filter(app => ['chatgpt', 'claude', 'gemini', 'grok', 'perplexity', 'microsoft-copilot'].includes(app.id));
    }
    
    // Default: return common applications
    return applications.slice(0, 6);
  };

  return (
    <div className="relative">
      {/* Main content */}
      <div
        className={cn(
          'cursor-pointer transition-all duration-200 p-4 hover:bg-gray-50',
          isSelected && 'bg-primary/5'
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <ScoreCircle 
                  score={Math.round(subtask.automationPotential * 100)} 
                  maxScore={100} 
                  variant="xsmall" 
                  lang={lang}
                  animate={false}
                  label=""
                  showPercentage={false}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 flex-1">
                {subtask.title}
              </span>
            </div>

            {/* Systems */}
            {subtask.systems && subtask.systems.length > 0 && (
              <div className="flex items-center gap-1 mb-2 overflow-hidden">
                {subtask.systems.slice(0, 2).map((system) => (
                  <Badge key={system} variant="secondary" className="text-xs flex-shrink-0">
                    {system}
                  </Badge>
                ))}
                {subtask.systems.length > 2 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs flex-shrink-0 cursor-help">
                          +{subtask.systems.length - 2}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          {subtask.systems.slice(2).join(', ')}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Applications */}
            <div className="flex items-center gap-1">
              {getTypicalApplications(subtask).slice(0, 4).map((app) => (
                <TooltipProvider key={app.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-5 h-5 rounded-sm overflow-hidden bg-gray-100 flex items-center justify-center">
                        <AppIcon tool={app} size="sm" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{app.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
        </div>
      </div>
      
      {/* Separator line - only show if not last item */}
      {!isLast && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
      )}
    </div>
  );
};
