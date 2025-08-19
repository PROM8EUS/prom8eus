import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { callAnalyzeInput } from "@/lib/supabase";
import LoadingPage from "./LoadingPage";

const MainContent = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // URL validation regex
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  const isUrl = urlRegex.test(input.trim());
  const hasInput = input.trim() !== "";

  const handleAnalyze = async () => {
    if (!hasInput) return;
    
    setIsLoading(true);
    
    try {
      const analysisInput = isUrl 
        ? { url: input.trim() }
        : { rawText: input.trim() };
      
      console.log('Calling analysis with:', analysisInput);
      const result = await callAnalyzeInput(analysisInput);
      
      if (result.success && result.data) {
        // Store results in sessionStorage for Results page
        sessionStorage.setItem('analysisResult', JSON.stringify(result.data));
        navigate('/results');
        
        toast({
          title: "Analyse erfolgreich",
          description: result.data.summary,
        });
      } else {
        toast({
          title: "Analyse fehlgeschlagen",
          description: result.error || "Ein unbekannter Fehler ist aufgetreten",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Analysieren",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading page when analyzing
  if (isLoading) {
    return <LoadingPage />;
  }

  return (
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
            {isUrl && hasInput && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                  URL erkannt
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!hasInput}
            size="lg"
            className="px-12 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200 disabled:hover:scale-100"
          >
            Analyse starten
          </Button>
        </div>

        {/* Features hint */}
        <div className="text-sm text-muted-foreground">
          {isUrl && hasInput ? 
            "URL erkannt – der Inhalt wird automatisch analysiert." : 
            "KI-gestützte Analyse für klare Einblicke in Ihre Aufgaben."
          }
        </div>
      </div>
    </main>
  );
};

export default MainContent;