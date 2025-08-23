import { useEffect, useState } from 'react';
import { SharedAnalysisService } from '@/lib/sharedAnalysis';
import { runAnalysis } from '@/lib/runAnalysis';

interface SharedAnalysisLoaderProps {
  shareId: string;
  lang: 'de' | 'en';
  onAnalysisLoaded: (analysisData: any) => void;
  onError: (error: string) => void;
}

export const SharedAnalysisLoader = ({ 
  shareId, 
  lang, 
  onAnalysisLoaded, 
  onError 
}: SharedAnalysisLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSharedAnalysis = async () => {
      try {
        setIsLoading(true);
        
        // Try server first
        const serverResult = await SharedAnalysisService.getAnalysis(shareId);
        if (serverResult.success && serverResult.data) {
          console.log('Loaded shared analysis from server:', shareId);
          
          // Use the original text to regenerate the analysis
          const originalText = serverResult.data.originalText;
          if (originalText) {
            // Run new analysis with the original text
            const newAnalysis = await runAnalysis(originalText, lang);
            onAnalysisLoaded(newAnalysis);
            return;
          }
        }
        
        // If server fails, try localStorage as fallback
        console.log('Server analysis not found, trying localStorage fallback');
        const localData = localStorage.getItem(`analysis_${shareId}`);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            console.log('Loaded shared analysis from localStorage:', shareId);
            onAnalysisLoaded(parsedData);
            return;
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
          }
        }
        
        // If both server and localStorage fail, show error message
        console.log('Shared analysis not found or expired');
        const errorMessage = lang === 'de' 
          ? 'Die geteilte Analyse ist nicht mehr verfügbar oder abgelaufen. Bitte führen Sie eine neue Analyse durch.'
          : 'The shared analysis is no longer available or has expired. Please perform a new analysis.';
        
        onError(errorMessage);
        
      } catch (error) {
        console.error('Error loading shared analysis:', error);
        onError('Fehler beim Laden der geteilten Analyse');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSharedAnalysis();
  }, [shareId, lang, onAnalysisLoaded, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {lang === 'de' ? 'Lade geteilte Analyse...' : 'Loading shared analysis...'}
          </p>
        </div>
      </div>
    );
  }

  return null;
};
