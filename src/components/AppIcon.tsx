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

  // Function to get app logo URL with fallback to company logo
  const getAppLogoUrl = (tool: AITool): string => {
    // Map tool IDs to their app logo URLs using Wikimedia Commons and other reliable sources
    const appLogoMap: Record<string, string> = {
      // Microsoft Office Apps
      'excel-ai': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg',
      'power-bi-ai': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Power_bi_logo_black.svg',
      'microsoft-copilot': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Microsoft_Office_logo_%282019%E2%80%93present%29.svg',
      
      // Google Apps
      'google-sheets-ai': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282020-present%29.svg',
      'gemini': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Gemini_logo.svg',
      
      // AI Tools
      'chatgpt': 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
      'claude': 'https://upload.wikimedia.org/wikipedia/commons/8/86/Anthropic_logo.svg',
      'github-copilot': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
      'code-whisperer': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
      'tabnine': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Tabnine_logo.svg',
      'notion-ai': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
      'obsidian-ai': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Obsidian_logo.svg',
      'jasper': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Jasper_AI_logo.svg',
      'copy-ai': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Copy.ai_logo.svg',
      'writesonic': 'https://upload.wikimedia.org/wikipedia/commons/w/wc/Writesonic_logo.svg',
      'canva-ai': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg',
      'perplexity': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Perplexity_AI_logo.svg',
      'grammarly': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Grammarly_logo.svg',
      'grok': 'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.svg',
      'airtable-ai': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Airtable_logo.svg'
    };

    // Try app logo first, then fallback to original logo
    return appLogoMap[tool.id] || tool.logo.url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // If app logo fails, try the original logo
    const originalLogo = tool.logo.url;
    if (e.currentTarget.src !== originalLogo) {
      e.currentTarget.src = originalLogo;
      return;
    }
    
    // If both fail, show fallback icon
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Logo Image - Try app logo first */}
        <img
          src={getAppLogoUrl(tool)}
          alt={tool.logo.alt}
          className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm`}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb'
          }}
          onError={handleImageError}
        />
        
        {/* Fallback Icon */}
        <div 
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-sm hidden`}
          style={{
            backgroundColor: '#ffffff',
            color: '#374151'
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
