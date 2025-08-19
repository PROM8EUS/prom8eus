import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import LoadingPage from "./LoadingPage";

const MainContent = () => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = () => {
    if (text.trim()) {
      setIsLoading(true);
      
      // Simulate analysis process
      setTimeout(() => {
        console.log("Analysis complete:", text);
        setIsLoading(false);
        // Navigate to results page
        navigate('/results');
      }, 4000);
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
          <div className="relative">
            <Textarea
              placeholder="Aufgabenbeschreibung oder Stellenanzeige hier einfügen …"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px] text-lg resize-none focus:ring-2 focus:ring-primary/20 border-2 hover:border-primary/30 transition-colors"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!text.trim()}
            size="lg"
            className="px-12 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200 disabled:hover:scale-100"
          >
            Analyse starten
          </Button>
        </div>

        {/* Features hint */}
        <div className="text-sm text-muted-foreground">
          KI-gestützte Analyse für klare Einblicke in Ihre Aufgaben.
        </div>
      </div>
    </main>
  );
};

export default MainContent;