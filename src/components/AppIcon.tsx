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

  // Get logo.dev API key from environment variables
  const LOGO_DEV_API_KEY = import.meta.env.VITE_LOGO_DEV_API_KEY || 'pk_RlxzoJ1YTPivN8xYILyQTw';
  
  // Map tool IDs to their logo.dev URLs
  const getLogoUrl = (tool: AITool): string => {
    const logoMap: Record<string, string> = {
      // Microsoft Office Apps
      'excel-ai': `https://img.logo.dev/microsoft.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'power-bi-ai': `https://img.logo.dev/powerbi.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'microsoft-copilot': `https://img.logo.dev/microsoft.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      
      // Google Apps
      'google-sheets-ai': `https://img.logo.dev/sheets.google.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'google-docs-ai': `https://img.logo.dev/docs.google.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'gemini': `https://img.logo.dev/gemini.google.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      
      // AI Tools
      'chatgpt': `https://img.logo.dev/chat.openai.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'claude': `https://img.logo.dev/claude.ai?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'grok': `https://img.logo.dev/x.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      
      // Development Tools
      'github-copilot': `https://img.logo.dev/github.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'code-whisperer': `https://img.logo.dev/aws.amazon.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'tabnine': `https://img.logo.dev/tabnine.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      
      // Content Creation
      'canva-ai': `https://img.logo.dev/canva.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'copy-ai': `https://img.logo.dev/copy.ai?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'writesonic': `https://img.logo.dev/writesonic.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'jasper': `https://img.logo.dev/jasper.ai?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      
      // Productivity
      'notion-ai': `https://img.logo.dev/notion.so?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'obsidian-ai': `https://img.logo.dev/obsidian.md?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'airtable-ai': `https://img.logo.dev/airtable.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      
      // Communication
      'grammarly': `https://img.logo.dev/grammarly.com?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      'perplexity': `https://img.logo.dev/perplexity.ai?token=${LOGO_DEV_API_KEY}&size=64&format=png`,
      
      // Workflow Automation
      'n8n': `https://img.logo.dev/n8n.io?token=${LOGO_DEV_API_KEY}&size=64&format=png`
    };

    return logoMap[tool.id] || '';
  };

  const [logoUrl, setLogoUrl] = React.useState<string>('');
  const [showFallback, setShowFallback] = React.useState<boolean>(false);

  React.useEffect(() => {
    const url = getLogoUrl(tool);
    if (url) {
      setLogoUrl(url);
      setShowFallback(false);
    } else {
      setShowFallback(true);
    }
  }, [tool]);

  const handleImageError = () => {
    setShowFallback(true);
  };

  const handleImageLoad = () => {
    setShowFallback(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Logo Image from logo.dev */}
        {!showFallback && logoUrl && (
          <img
            src={logoUrl}
            alt={tool.logo.alt}
            className={`${sizeClasses[size]} rounded-lg object-contain shadow-sm`}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb'
            }}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
        
        {/* Fallback Icon */}
        {showFallback && (
          <div 
            className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-sm`}
            style={{
              backgroundColor: tool.logo.backgroundColor || '#6366f1',
              color: '#ffffff',
              border: '1px solid #e5e7eb'
            }}
          >
            <span className={`font-bold ${textSizes[size]}`}>
              {tool.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
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
}

const AppIconGrid: React.FC<AppIconGridProps> = ({
  tools,
  columns = 3,
  className = ''
}) => {
  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {tools.map((tool) => (
        <AppIconCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
};

export { AppIcon, AppIconList, AppIconCard, AppIconGrid };
export default AppIcon;