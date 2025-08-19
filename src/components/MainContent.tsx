import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { callAnalyzeInput } from "@/lib/supabase";
import { extractJobTextFromUrl } from "@/lib/extractJobText";
import LoadingPage from "./LoadingPage";
import { DebugModal } from "./DebugModal";
import { AlertTriangle, Bug } from "lucide-react";

const MainContent = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<{
    rawText: string;
    url: string;
    textLength: number;
    wasRendered?: boolean;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
            wasRendered: false // This would come from the scraper response
          });
          
          // Check if extracted text is sufficient
          if (composedText.length < 500) {
            setAnalysisError(
              `Die Seite konnte nicht automatisch gelesen werden (nur ${composedText.length} Zeichen extrahiert). ` +
              "Bitte fügen Sie den Text manuell ein oder prüfen Sie den Debug-Modus."
            );
            setIsLoading(false);
            return;
          }
          
          analysisInput = composedText;
          console.log(`Job text extracted successfully: ${composedText.length} characters`);
        } catch (extractError) {
          console.error('Job text extraction failed:', extractError);
          setAnalysisError(
            "Die Seite konnte nicht automatisch gelesen werden. " +
            "Bitte fügen Sie den Stellentext manuell ein."
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
        // Store results in sessionStorage for Results page
        sessionStorage.setItem('analysisResult', JSON.stringify(result.data));
        if (debugData) {
          sessionStorage.setItem('debugData', JSON.stringify(debugData));
        }
        navigate('/results');
        
        toast({
          title: "Analyse erfolgreich",
          description: result.data.summary,
        });
      } else {
        console.error('Analysis failed:', result.error);
        setAnalysisError(result.error || "Ein unbekannter Fehler ist bei der Analyse aufgetreten");
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setAnalysisError("Verbindungsfehler: Die Analyse konnte nicht durchgeführt werden");
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
      <main className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-4xl mx-auto text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              Automatisierungspotenzial sofort erkennen
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fügen Sie Ihre Aufgabenbeschreibung oder Stellenanzeige ein – unsere KI zeigt Ihnen, welche Teile automatisierbar sind.
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-6">
            {/* Combined Input Field */}
            <div className="relative">
              <Textarea
                placeholder="URL oder Aufgabenbeschreibung hier einfügen …"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[300px] text-lg resize-none focus:ring-2 focus:ring-primary/20 border-2 hover:border-primary/30 transition-colors"
              />
              {isUrl && hasInput && !analysisError && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                    URL erkannt
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
                        Rohtext anzeigen (Debug)
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  <p><strong>Tipp:</strong> Kopieren Sie den Stellentext manuell von der Website und fügen Sie ihn direkt hier ein.</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!hasInput}
              size="lg"
              className="px-12 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200 disabled:hover:scale-100"
            >
              Analyse starten
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
                Rohtext anzeigen (Debug)
              </Button>
            )}
          </div>

          {/* Features hint */}
          <div className="text-sm text-muted-foreground">
            {isUrl && hasInput && !analysisError ? 
              "URL erkannt – der Inhalt wird automatisch analysiert." : 
              "KI-gestützte Analyse für klare Einblicke in Ihre Aufgaben."
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
      />
    </>
  );
};

export default MainContent;