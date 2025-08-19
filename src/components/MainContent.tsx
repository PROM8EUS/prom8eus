import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { callAnalyzeInput } from "@/lib/supabase";
import { extractJobTextFromUrl } from "@/lib/extractJobText";
import LoadingPage from "./LoadingPage";
import { DebugModal } from "./DebugModal";
import { AlertTriangle, Bug } from "lucide-react";
import { t } from "@/lib/i18n/i18n";

interface MainContentProps {
  buttonText: string;
  headline: string;
  subtitle: string;
  lang: "de" | "en";
}

const MainContent = ({ buttonText, headline, subtitle, lang }: MainContentProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<{
    rawText: string;
    url: string;
    textLength: number;
    wasRendered?: boolean;
    fromCache?: boolean;
    cacheDate?: string;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(60, Math.min(textarea.scrollHeight, 400));
      textarea.style.height = newHeight + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // URL validation regex
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  const isUrl = urlRegex.test(input.trim());
  const hasInput = input.trim() !== "";

  const handleAnalyze = async () => {
    if (!hasInput) return;
    
    setIsLoading(true);
    setAnalysisError(null);
    setDebugData(null);
    
    try {
      console.log('Starting analysis for input:', input.substring(0, 100));
      
      let analysisInput = input.trim();
      let extractedJobText = null;
      
      // If it's a URL, try to extract job text first
      if (isUrl) {
        try {
          console.log('Extracting job text from URL...');
          extractedJobText = await extractJobTextFromUrl(input.trim());
          const composedText = extractedJobText.composeJobText();
          
          // Store debug data
          setDebugData({
            rawText: composedText,
            url: input.trim(),
            textLength: composedText.length,
            wasRendered: false, // This would come from the scraper response
            fromCache: extractedJobText.fromCache,
            cacheDate: extractedJobText.cacheDate
          });
          
          // Check if extracted text is sufficient
          if (composedText.length < 500) {
            setAnalysisError(
              `${t(lang, "page_not_readable")} (nur ${composedText.length} Zeichen extrahiert). ` +
              t(lang, "paste_manually")
            );
            setIsLoading(false);
            return;
          }
          
          analysisInput = composedText;
          console.log(`Job text extracted successfully: ${composedText.length} characters`);
        } catch (extractError) {
          console.error('Job text extraction failed:', extractError);
          setAnalysisError(
            `${t(lang, "page_not_readable")}. ${t(lang, "paste_manually")}`
          );
          setIsLoading(false);
          return;
        }
      }
      
      const result = await callAnalyzeInput(
        isUrl && extractedJobText
          ? { rawText: analysisInput }
          : isUrl 
            ? { url: input.trim() }
            : { rawText: analysisInput }
      );
      
      if (result.success && result.data) {
        console.log('Analysis successful, navigating to results');
        console.log('Analysis result structure:', result.data);
        
        // Handle both old and new data structures
        let analysisData;
        const data = result.data as any; // Type assertion to handle both formats
        
        if (data.totalScore !== undefined) {
          // New unified structure
          analysisData = {
            totalScore: data.totalScore,
            ratio: data.ratio,
            tasks: data.tasks,
            summary: data.summary,
            recommendations: data.recommendations,
            originalText: data.originalText
          };
        } else {
          // Old structure - transform to new format
          const automationScore = data.automationScore || 0;
          const automatedTasks = data.automatedTasks || [];
          const manualTasks = data.manualTasks || [];
          
          // Convert old task arrays to new task objects
          const tasks = [
            ...automatedTasks.map((task: string, index: number) => ({
              text: task,
              score: Math.min(100, automationScore + Math.random() * 20),
              label: "Automatisierbar" as const,
              category: "automatisierbar",
              confidence: 80
            })),
            ...manualTasks.map((task: string, index: number) => ({
              text: task,
              score: Math.max(0, 50 - Math.random() * 30),
              label: "Mensch" as const,
              category: "mensch", 
              confidence: 70
            }))
          ];
          
          analysisData = {
            totalScore: automationScore,
            ratio: {
              automatisierbar: Math.round((automatedTasks.length / (automatedTasks.length + manualTasks.length)) * 100),
              mensch: Math.round((manualTasks.length / (automatedTasks.length + manualTasks.length)) * 100)
            },
            tasks: tasks,
            summary: data.summary || `Analyse mit ${automationScore}% Automatisierungspotenzial`,
            recommendations: data.recommendations || [],
            originalText: data.originalText
          };
        }
        
        // Store the normalized data structure
        sessionStorage.setItem('analysisResult', JSON.stringify(analysisData));
        if (debugData) {
          sessionStorage.setItem('debugData', JSON.stringify(debugData));
        }
        navigate('/results');
      } else {
        console.error('Analysis failed:', result.error);
        setAnalysisError(result.error || t(lang, "analysis_error"));
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setAnalysisError(t(lang, "connection_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const showDebugModal = () => {
    if (debugData) {
      setDebugModalOpen(true);
    }
  };

  // Show loading page when analyzing
  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-16">
          {/* Title and Subtitle */}
          <div className="space-y-12">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight break-words hyphens-auto">
              {headline}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-8">
            {/* Combined Input Field */}
            <div className="relative max-w-2xl mx-auto">
              <Textarea
                ref={textareaRef}
                placeholder={t(lang, "placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[60px] text-lg resize-none focus:ring-2 focus:ring-primary/20 border-2 hover:border-primary/30 transition-colors overflow-hidden"
                rows={1}
              />
              {isUrl && hasInput && !analysisError && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                    {t(lang, "url_detected")}
                  </span>
                </div>
              )}
            </div>

            {/* Error Display */}
            {analysisError && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-left">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p>{analysisError}</p>
                    {debugData && (
                      <Button 
                        onClick={showDebugModal} 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                      >
                        <Bug className="h-4 w-4 mr-2" />
                        {t(lang, "show_debug")}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  <p><strong>{t(lang, "tip")}</strong> {t(lang, "paste_text_tip")}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!hasInput}
              size="lg"
              className="px-16 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200 disabled:hover:scale-100 shadow-lg"
            >
              {buttonText}
            </Button>

            {/* Debug button for successful extractions */}
            {debugData && !analysisError && (
              <Button 
                onClick={showDebugModal} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                {t(lang, "show_debug")}
              </Button>
            )}
          </div>

          {/* Features hint */}
          <div className="text-sm text-muted-foreground max-w-lg mx-auto">
            {isUrl && hasInput && !analysisError ? 
              t(lang, "url_detected_hint") : 
              t(lang, "ai_hint")
            }
          </div>
        </div>
      </main>

      <DebugModal
        isOpen={debugModalOpen}
        onClose={() => setDebugModalOpen(false)}
        rawText={debugData?.rawText || ''}
        url={debugData?.url || ''}
        textLength={debugData?.textLength || 0}
        wasRendered={debugData?.wasRendered}
        fromCache={debugData?.fromCache}
        cacheDate={debugData?.cacheDate}
      />
    </>
  );
};

export default MainContent;