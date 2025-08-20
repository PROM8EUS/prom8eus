import React from 'react';
import { AITool } from '../lib/catalog/aiTools';

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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Fallback zu einem generischen Icon wenn das Logo nicht geladen werden kann
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Logo Image */}
        <img
          src={tool.logo.url}
          alt={tool.logo.alt}
          className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm`}
          style={{
            backgroundColor: tool.logo.backgroundColor || '#f3f4f6',
            border: '1px solid #e5e7eb'
          }}
          onError={handleImageError}
        />
        
        {/* Fallback Icon */}
        <div 
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-sm hidden`}
          style={{
            backgroundColor: tool.logo.backgroundColor || '#f3f4f6',
            color: tool.logo.textColor || '#374151'
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
}

const AppIconCard: React.FC<AppIconCardProps> = ({
  tool,
  className = '',
  onClick
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
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{tool.description}</p>
          
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
              {tool.automationPotential}% Automatisierung
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {tool.features.slice(0, 3).map((feature, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {feature}
              </span>
            ))}
            {tool.features.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{tool.features.length - 3} mehr
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
