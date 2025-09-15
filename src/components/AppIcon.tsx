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

  // Map tool IDs to their local logo files
  const getLogoUrl = (tool: AITool): string => {
    const logoMap: Record<string, string> = {
      'excel-ai': '/logos/excel-ai.png',
      'power-bi-ai': '/logos/power-bi-ai.png',
      'microsoft-copilot': '/logos/microsoft-copilot.png',
      'google-sheets-ai': '/logos/google-sheets-ai.png',
      'chatgpt': '/logos/chatgpt.png',
      'claude': '/logos/claude.png',
      'grok': '/logos/grok.png',
      'github-copilot': '/logos/github-copilot.png',
      'code-whisperer': '/logos/code-whisperer.png',
      'tabnine': '/logos/tabnine.png',
      'canva-ai': '/logos/canva-ai.png',
      'copy-ai': '/logos/copy-ai.png',
      'writesonic': '/logos/writesonic.png',
      'jasper': '/logos/jasper.png',
      'grammarly': '/logos/grammarly.png',
      'notion-ai': '/logos/notion-ai.png',
      'obsidian-ai': '/logos/obsidian-ai.png',
      'airtable-ai': '/logos/airtable-ai.png',
      'perplexity': '/logos/perplexity.png',
      'gemini': '/logos/gemini.png'
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
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        {!showFallback && logoUrl ? (
          <img
            src={logoUrl}
            alt={`${tool.name} logo`}
            className={`${sizeClasses[size]} object-contain rounded`}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className={`${sizeClasses[size]} bg-gray-200 rounded flex items-center justify-center`}>
            <span className={`${textSizes[size]} font-semibold text-gray-600`}>
              {tool.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      {showName && (
        <span className={`${textSizes[size]} font-medium text-gray-900`}>
          {tool.name}
        </span>
      )}
    </div>
  );
};

interface AppIconListProps {
  tools: AITool[];
  size?: 'sm' | 'md' | 'lg';
  showNames?: boolean;
  className?: string;
}

const AppIconList: React.FC<AppIconListProps> = ({
  tools,
  size = 'md',
  showNames = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tools.map((tool) => (
        <AppIcon
          key={tool.id}
          tool={tool}
          size={size}
          showName={showNames}
        />
      ))}
    </div>
  );
};

interface AppIconCardProps {
  tool: AITool;
  onClick?: (tool: AITool) => void;
  className?: string;
}

const AppIconCard: React.FC<AppIconCardProps> = ({
  tool,
  onClick,
  className = ''
}) => {
  const features = getToolFeatures(tool.id);
  const description = getToolDescription(tool.id);

  return (
    <div
      className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={() => onClick?.(tool)}
    >
      <div className="flex items-start gap-3">
        <AppIcon tool={tool} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          <div className="flex flex-wrap gap-1">
            {features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {feature}
              </span>
            ))}
            {features.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{features.length - 3} mehr
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AppIconGridProps {
  tools: AITool[];
  onToolClick?: (tool: AITool) => void;
  className?: string;
}

const AppIconGrid: React.FC<AppIconGridProps> = ({
  tools,
  onToolClick,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {tools.map((tool) => (
        <AppIconCard key={tool.id} tool={tool} onClick={onToolClick} />
      ))}
    </div>
  );
};

export { AppIcon, AppIconList, AppIconCard, AppIconGrid };
export default AppIcon;