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

  // Mapping of tool IDs to logo.dev domains
  const logoDevDomains: Record<string, string> = {
    'excel-ai': 'microsoft.com',
    'power-bi-ai': 'powerbi.com',
    'microsoft-copilot': 'microsoft.com',
    'google-sheets-ai': 'sheets.google.com',
    'chatgpt': 'chat.openai.com',
    'claude': 'claude.ai',
    'grok': 'x.com',
    'github-copilot': 'github.com',
    'code-whisperer': 'aws.amazon.com',
    'tabnine': 'tabnine.com',
    'canva-ai': 'canva.com',
    'copy-ai': 'copy.ai',
    'writesonic': 'writesonic.com',
    'jasper': 'jasper.ai',
    'grammarly': 'grammarly.com',
    'notion-ai': 'notion.so',
    'obsidian-ai': 'obsidian.md',
    'airtable-ai': 'airtable.com',
    'perplexity': 'perplexity.ai',
    'gemini': 'gemini.google.com',
    'n8n': 'n8n.io'
  };

  // Prefer cached data URL → local asset → logo.dev fetch
  const [logoUrl, setLogoUrl] = React.useState<string>('');
  const [showFallback, setShowFallback] = React.useState<boolean>(false);

  const localAssetPath = `/logos/${tool.id}.png`;
  const storageKey = `logo_cache_${tool.id}`;
  const LOGO_DEV_API_KEY = (import.meta as any)?.env?.VITE_LOGO_DEV_API_KEY;

  const fetchAndCacheLogoDev = async (): Promise<string | null> => {
    try {
      const domain = logoDevDomains[tool.id];
      if (!domain || !LOGO_DEV_API_KEY) return null;
      const url = `https://img.logo.dev/${domain}?token=${LOGO_DEV_API_KEY}&size=128&format=png`;
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      try {
        localStorage.setItem(storageKey, dataUrl);
      } catch (_) {
        // ignore quota errors
      }
      return dataUrl;
    } catch (_err) {
      return null;
    }
  };

  const fetchAndCacheClearbit = async (): Promise<string | null> => {
    try {
      const domain = logoDevDomains[tool.id];
      if (!domain) return null;
      const url = `https://logo.clearbit.com/${domain}`;
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      try {
        localStorage.setItem(storageKey, dataUrl);
      } catch (_) {
        // ignore quota errors
      }
      return dataUrl;
    } catch {
      return null;
    }
  };

  React.useEffect(() => {
    // 1) Use cached data URL if present
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      setLogoUrl(cached);
      setShowFallback(false);
      return;
    }
    // 2) Try local asset first; if it fails, we'll fetch from logo.dev
    setLogoUrl(localAssetPath);
    setShowFallback(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.id]);

  const handleImageError = async () => {
    // If local asset failed, try fetching from logo.dev, then clearbit
    let dataUrl = await fetchAndCacheLogoDev();
    if (!dataUrl) {
      dataUrl = await fetchAndCacheClearbit();
    }
    if (dataUrl) {
      setLogoUrl(dataUrl);
      setShowFallback(false);
    } else {
      setShowFallback(true);
    }
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
  lang?: 'de' | 'en';
  showMeta?: boolean;
}

const AppIconCard: React.FC<AppIconCardProps> = ({
  tool,
  onClick,
  className = '',
  lang = 'de',
  showMeta = true
}) => {
  const features = (getToolFeatures as any)(tool, lang) || [];
  const description = (getToolDescription as any)(tool, lang) || '';

  return (
    <div
      className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={() => onClick?.(tool)}
    >
      <div className="flex items-start gap-3">
        <AppIcon tool={tool} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>

          {showMeta && (
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                tool.pricing === 'Free' ? 'bg-green-100 text-green-800' :
                tool.pricing === 'Freemium' ? 'bg-blue-100 text-blue-800' :
                tool.pricing === 'Paid' ? 'bg-orange-100 text-orange-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {tool.pricing}
              </span>
              {typeof tool.automationPotential === 'number' && (
                <span className="text-xs text-gray-500">
                  {tool.automationPotential}% {lang === 'de' ? 'Automatisierung' : 'Automation'}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {(features || []).slice(0, 3).map((feature: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {feature}
              </span>
            ))}
            {(features || []).length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{(features || []).length - 3} mehr
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