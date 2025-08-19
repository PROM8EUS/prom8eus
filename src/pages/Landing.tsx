import { Button } from "@/components/ui/button";
import { Bot, User, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LandingScoreCircle from "@/components/LandingScoreCircle";
import InfoCard from "@/components/InfoCard";
import Footer from "@/components/Footer";

const Landing = () => {
  const navigate = useNavigate();

  const handleStartAnalysis = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section with Score */}
          <section className="animate-fade-in">
            <LandingScoreCircle 
              score={80} 
              maxScore={100} 
              jobTitle="Marketing Manager"
            />
          </section>

          {/* Info Cards */}
          <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <InfoCard
                title="Automatisierbar"
                value="65%"
                description="Aufgaben können durch KI und Automatisierung übernommen werden"
                icon={Bot}
                variant="primary"
              />
              
              <InfoCard
                title="Mensch notwendig"
                value="35%"
                description="Aufgaben erfordern menschliche Kreativität und Entscheidungsfindung"
                icon={User}
                variant="destructive"
              />
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">KI-gestützte Analyse</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Entdecken Sie das Automatisierungspotenzial Ihrer Position
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Lassen Sie unsere KI Ihre Stellenbeschreibung oder Aufgabenliste analysieren 
                und erfahren Sie, welche Tätigkeiten automatisiert werden können.
              </p>
              
              <Button
                onClick={handleStartAnalysis}
                size="lg"
                className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200"
              >
                Eigene Analyse starten
              </Button>
            </div>
          </section>

          {/* Additional Benefits */}
          <section className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="bg-muted/20 rounded-2xl p-8 md:p-12 text-center">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                Warum eine Automatisierungs-Analyse?
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="space-y-2">
                  <div className="text-3xl">🎯</div>
                  <h4 className="font-semibold text-foreground">Präzise Einschätzung</h4>
                  <p className="text-sm text-muted-foreground">
                    Erhalten Sie eine detaillierte Bewertung Ihrer Aufgaben
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">⚡</div>
                  <h4 className="font-semibold text-foreground">Effizienz steigern</h4>
                  <p className="text-sm text-muted-foreground">
                    Identifizieren Sie Potenziale für Prozessoptimierung
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl">🚀</div>
                  <h4 className="font-semibold text-foreground">Zukunft gestalten</h4>
                  <p className="text-sm text-muted-foreground">
                    Bereiten Sie sich auf die Arbeitswelt von morgen vor
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;