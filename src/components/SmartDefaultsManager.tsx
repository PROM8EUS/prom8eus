/**
 * SmartDefaultsManager Component
 * Manages smart defaults and progressive disclosure across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface SmartDefaultsConfig {
  // Progressive disclosure settings
  autoExpandHighPriority: boolean;
  expandOnContent: boolean;
  collapseOnEmpty: boolean;
  showProgressBars: boolean;
  
  // User preferences
  rememberExpandedState: boolean;
  showAdvancedOptions: boolean;
  compactMode: boolean;
  
  // Smart suggestions
  enableSmartSuggestions: boolean;
  showUsageHints: boolean;
  adaptiveLayout: boolean;
}

interface SmartDefaultsContextType {
  config: SmartDefaultsConfig;
  updateConfig: (updates: Partial<SmartDefaultsConfig>) => void;
  resetToDefaults: () => void;
  getSectionDefaults: (sectionId: string, priority: 'high' | 'medium' | 'low') => SmartDefaultsConfig;
  isExpanded: (sectionId: string) => boolean;
  setExpanded: (sectionId: string, expanded: boolean) => void;
}

const defaultConfig: SmartDefaultsConfig = {
  autoExpandHighPriority: true,
  expandOnContent: true,
  collapseOnEmpty: false,
  showProgressBars: true,
  rememberExpandedState: true,
  showAdvancedOptions: false,
  compactMode: false,
  enableSmartSuggestions: true,
  showUsageHints: true,
  adaptiveLayout: true
};

const SmartDefaultsContext = createContext<SmartDefaultsContextType | null>(null);

export function useSmartDefaults() {
  const context = useContext(SmartDefaultsContext);
  if (!context) {
    throw new Error('useSmartDefaults must be used within a SmartDefaultsProvider');
  }
  return context;
}

interface SmartDefaultsProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<SmartDefaultsConfig>;
}

export function SmartDefaultsProvider({ 
  children, 
  initialConfig = {} 
}: SmartDefaultsProviderProps) {
  const [config, setConfig] = useState<SmartDefaultsConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('smart-defaults-config');
    const savedExpanded = localStorage.getItem('smart-defaults-expanded');
    
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved smart defaults config:', error);
      }
    }
    
    if (savedExpanded && config.rememberExpandedState) {
      try {
        const parsed = JSON.parse(savedExpanded);
        setExpandedSections(parsed);
      } catch (error) {
        console.warn('Failed to parse saved expanded sections:', error);
      }
    }
  }, [config.rememberExpandedState]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('smart-defaults-config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (config.rememberExpandedState) {
      localStorage.setItem('smart-defaults-expanded', JSON.stringify(expandedSections));
    }
  }, [expandedSections, config.rememberExpandedState]);

  const updateConfig = useCallback((updates: Partial<SmartDefaultsConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(defaultConfig);
    setExpandedSections({});
  }, []);

  const getSectionDefaults = useCallback((sectionId: string, priority: 'high' | 'medium' | 'low') => {
    const baseDefaults = {
      autoExpand: config.autoExpandHighPriority && priority === 'high',
      expandOnContent: config.expandOnContent,
      collapseOnEmpty: config.collapseOnEmpty,
      minContentHeight: config.compactMode ? 30 : 50
    };

    // Check if section was previously expanded
    if (config.rememberExpandedState && expandedSections[sectionId] !== undefined) {
      return {
        ...baseDefaults,
        defaultExpanded: expandedSections[sectionId]
      };
    }

    return baseDefaults;
  }, [config, expandedSections]);

  const isExpanded = useCallback((sectionId: string) => {
    return expandedSections[sectionId] || false;
  }, [expandedSections]);

  const setExpanded = useCallback((sectionId: string, expanded: boolean) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: expanded }));
  }, []);

  const contextValue: SmartDefaultsContextType = {
    config,
    updateConfig,
    resetToDefaults,
    getSectionDefaults,
    isExpanded,
    setExpanded
  };

  return (
    <SmartDefaultsContext.Provider value={contextValue}>
      {children}
    </SmartDefaultsContext.Provider>
  );
}

interface SmartDefaultsPanelProps {
  lang?: 'de' | 'en';
  className?: string;
}

export function SmartDefaultsPanel({ lang = 'en', className = '' }: SmartDefaultsPanelProps) {
  const { config, updateConfig, resetToDefaults } = useSmartDefaults();

  const toggleSetting = (key: keyof SmartDefaultsConfig) => {
    updateConfig({ [key]: !config[key] });
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {lang === 'de' ? 'Intelligente Standardeinstellungen' : 'Smart Defaults'}
                </h3>
                <p className="text-sm text-gray-600">
                  {lang === 'de' 
                    ? 'Automatische Anpassungen für bessere Benutzerfreundlichkeit'
                    : 'Automatic adjustments for better user experience'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {lang === 'de' ? 'Zurücksetzen' : 'Reset'}
            </Button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Progressive Disclosure */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {lang === 'de' ? 'Progressive Offenlegung' : 'Progressive Disclosure'}
              </h4>
              
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {lang === 'de' ? 'Hohe Priorität automatisch öffnen' : 'Auto-expand high priority'}
                  </span>
                  <Button
                    variant={config.autoExpandHighPriority ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('autoExpandHighPriority')}
                  >
                    {config.autoExpandHighPriority ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </Button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {lang === 'de' ? 'Bei Inhalt öffnen' : 'Expand on content'}
                  </span>
                  <Button
                    variant={config.expandOnContent ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('expandOnContent')}
                  >
                    {config.expandOnContent ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </Button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {lang === 'de' ? 'Fortschrittsbalken anzeigen' : 'Show progress bars'}
                  </span>
                  <Button
                    variant={config.showProgressBars ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('showProgressBars')}
                  >
                    {config.showProgressBars ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </Button>
                </label>
              </div>
            </div>

            {/* User Preferences */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {lang === 'de' ? 'Benutzereinstellungen' : 'User Preferences'}
              </h4>
              
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {lang === 'de' ? 'Erweiterte Optionen' : 'Advanced options'}
                  </span>
                  <Button
                    variant={config.showAdvancedOptions ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('showAdvancedOptions')}
                  >
                    {config.showAdvancedOptions ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </Button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {lang === 'de' ? 'Kompakter Modus' : 'Compact mode'}
                  </span>
                  <Button
                    variant={config.compactMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('compactMode')}
                  >
                    {config.compactMode ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </Button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {lang === 'de' ? 'Adaptive Layout' : 'Adaptive layout'}
                  </span>
                  <Button
                    variant={config.adaptiveLayout ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('adaptiveLayout')}
                  >
                    {config.adaptiveLayout ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {lang === 'de' ? 'Intelligente Vorschläge' : 'Smart Suggestions'}
            </h4>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {lang === 'de' ? 'Vorschläge aktivieren' : 'Enable suggestions'}
                </span>
                <Button
                  variant={config.enableSmartSuggestions ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('enableSmartSuggestions')}
                >
                  {config.enableSmartSuggestions ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </Button>
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {lang === 'de' ? 'Hilfe-Tipps anzeigen' : 'Show usage hints'}
                </span>
                <Button
                  variant={config.showUsageHints ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('showUsageHints')}
                >
                  {config.showUsageHints ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </Button>
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SmartDefaultsProvider;
