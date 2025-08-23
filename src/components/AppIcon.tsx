import React from 'react';
import { AITool, getToolDescription, getToolFeatures } from '../lib/catalog/aiTools';

interface AppIconProps {
  tool: AITool;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ 
  tool, 
  size = 'md', 
  showName = false, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Function to get app logo URL with proper fallback hierarchy
  const getAppLogoUrl = (tool: AITool): { primary: string; fallback: string } => {
    // Map tool IDs to their app logo URLs with fallbacks
    const appLogoMap: Record<string, { primary: string; fallback: string }> = {
      // Microsoft Office Apps
      'excel-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg',
        fallback: 'https://logo.clearbit.com/excel.microsoft.com?size=32&format=png'
      },
      'power-bi-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/New_Power_BI_Logo.svg',
        fallback: 'https://logo.clearbit.com/powerbi.microsoft.com?size=32&format=png'
      },
      'microsoft-copilot': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Microsoft_Office_logo_%282019%E2%80%93present%29.svg',
        fallback: 'https://logo.clearbit.com/copilot.microsoft.com?size=32&format=png'
      },
      
      // Google Apps
      'google-sheets-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282020-present%29.svg',
        fallback: 'https://logo.clearbit.com/sheets.google.com?size=32&format=png'
      },
      'google-docs-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282020%29.svg',
        fallback: 'https://logo.clearbit.com/docs.google.com?size=32&format=png'
      },
      'gemini': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Gemini_logo.svg',
        fallback: 'https://logo.clearbit.com/gemini.google.com?size=32&format=png'
      },
      
      // AI Tools
      'chatgpt': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
        fallback: 'https://logo.clearbit.com/chat.openai.com?size=32&format=png'
      },
      'claude': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Anthropic_logo.svg',
        fallback: 'https://logo.clearbit.com/claude.ai?size=32&format=png'
      },
      'github-copilot': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
        fallback: 'https://logo.clearbit.com/github.com?size=32&format=png'
      },
      'code-whisperer': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
        fallback: 'https://logo.clearbit.com/aws.amazon.com?size=32&format=png'
      },
      'tabnine': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Tabnine_logo.svg',
        fallback: 'https://logo.clearbit.com/tabnine.com?size=32&format=png'
      },
      'notion-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
        fallback: 'https://logo.clearbit.com/notion.so?size=32&format=png'
      },
      'obsidian-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Obsidian_logo.svg',
        fallback: 'https://logo.clearbit.com/obsidian.md?size=32&format=png'
      },
      'jasper': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Jasper_AI_logo.svg',
        fallback: 'https://logo.clearbit.com/jasper.ai?size=32&format=png'
      },
      'copy-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Copy.ai_logo.svg',
        fallback: 'https://logo.clearbit.com/copy.ai?size=32&format=png'
      },
      'writesonic': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/w/wc/Writesonic_logo.svg',
        fallback: 'https://logo.clearbit.com/writesonic.com?size=32&format=png'
      },
      'canva-ai': { 
        primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/canva.svg',
        fallback: 'https://logo.clearbit.com/canva.com?size=32&format=png'
      },
      'perplexity': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Perplexity_AI_logo.svg',
        fallback: 'https://logo.clearbit.com/perplexity.ai?size=32&format=png'
      },
      'grammarly': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Grammarly_logo.svg',
        fallback: 'https://logo.clearbit.com/grammarly.com?size=32&format=png'
      },
      'grok': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.svg',
        fallback: 'https://logo.clearbit.com/x.ai?size=32&format=png'
      },
      'airtable-ai': { 
        primary: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Airtable_logo.svg',
        fallback: 'https://logo.clearbit.com/airtable.com?size=32&format=png'
      },
      'zoom': { 
        primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/zoom.svg',
        fallback: 'https://logo.clearbit.com/zoom.us?size=32&format=png'
      },
      'dropbox': { 
        primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/dropbox.svg',
        fallback: 'https://logo.clearbit.com/dropbox.com?size=32&format=png'
      }
    };

    // Return app logo with fallback, or use original logo as fallback
    const logoData = appLogoMap[tool.id];
    if (logoData) {
      return {
        primary: logoData.primary,
        fallback: logoData.fallback
      };
    }

    // If no app logo mapping, use original logo as primary and company logo as fallback
    return {
      primary: tool.logo.url,
      fallback: tool.logo.url
    };
  };

  const [currentLogoUrl, setCurrentLogoUrl] = React.useState<string>('');
  const [logoState, setLogoState] = React.useState<'loading' | 'primary' | 'fallback' | 'error'>('loading');

  React.useEffect(() => {
    const logoData = getAppLogoUrl(tool);
    setCurrentLogoUrl(logoData.primary);
    setLogoState('loading');
  }, [tool]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const logoData = getAppLogoUrl(tool);
    
    if (logoState === 'loading' || logoState === 'primary') {
      // Try fallback logo
      setCurrentLogoUrl(logoData.fallback);
      setLogoState('fallback');
      return;
    }
    
    // If fallback also fails, show error state
    setLogoState('error');
  };

  const handleImageLoad = () => {
    setLogoState(logoState === 'loading' ? 'primary' : 'fallback');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Logo Image - Try app logo first */}
        <img
          src={currentLogoUrl}
          alt={tool.logo.alt}
          className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm`}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb'
          }}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Fallback Icon */}
        <div 
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-sm ${logoState === 'error' ? 'flex' : 'hidden'}`}
          style={{
            backgroundColor: '#ffffff',
            color: '#374151',
            border: '1px solid #e5e7eb'
          }}
        >
          <span className={`font-bold ${textSizes[size]}`}>
            {tool.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <span className={`font-medium ${textSizes[size]} text-gray-900`}>
            {tool.name}
          </span>
          <span className={`text-xs text-gray-500`}>
            {tool.pricing}
          </span>
        </div>
      )}
    </div>
  );
};

// Komponente für eine Liste von AI-Tools
interface AppIconListProps {
  tools: AITool[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  showNames?: boolean;
  className?: string;
}

const AppIconList: React.FC<AppIconListProps> = ({
  tools,
  size = 'md',
  maxDisplay = 5,
  showNames = false,
  className = ''
}) => {
  const displayTools = tools.slice(0, maxDisplay);
  const remainingCount = tools.length - maxDisplay;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {displayTools.map((tool) => (
        <AppIcon
          key={tool.id}
          tool={tool}
          size={size}
          showName={showNames}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className={`flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 font-medium ${size === 'sm' ? 'w-6 h-6 text-xs' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-base'}`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// Komponente für Tool-Karten mit Details
interface AppIconCardProps {
  tool: AITool;
  className?: string;
  onClick?: () => void;
  lang?: 'de' | 'en';
}

const AppIconCard: React.FC<AppIconCardProps> = ({
  tool,
  className = '',
  onClick,
  lang = 'de'
}) => {
  return (
    <div 
      className={`p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer ${className}`}
      onClick={onClick}
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
  );
};

// Komponente für Tool-Grid
interface AppIconGridProps {
  tools: AITool[];
  columns?: number;
  className?: string;
  onToolClick?: (tool: AITool) => void;
}

const AppIconGrid: React.FC<AppIconGridProps> = ({
  tools,
  columns = 3,
  className = '',
  onToolClick
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols]} ${className}`}>
      {tools.map((tool) => (
        <AppIconCard
          key={tool.id}
          tool={tool}
          onClick={() => onToolClick?.(tool)}
        />
      ))}
    </div>
  );
};

export { AppIcon, AppIconList, AppIconCard, AppIconGrid };
