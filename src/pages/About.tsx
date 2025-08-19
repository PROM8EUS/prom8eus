import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

const About = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 px-6 py-24">
        <div className="max-w-3xl mx-auto space-y-16">
          
          {/* Hero Section */}
          <section className="text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              About <span className="text-primary">PROM8EUS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We bring clarity to a crucial question: Should a task be handled by humans or machines?
            </p>
          </section>

          {/* What We Do */}
          <section className="text-center space-y-12">
            <div className="flex items-center justify-center space-x-3">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">What We Do</h2>
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              PROM8EUS analyzes job descriptions and delivers a clear score showing how automatable each task really is.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-2xl p-8 text-center space-y-4">
                <div className="text-3xl font-bold text-destructive">0–30</div>
                <div className="font-semibold text-foreground">Human-centered</div>
                <p className="text-sm text-muted-foreground">Little automation potential</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-2xl p-8 text-center space-y-4">
                <div className="text-3xl font-bold text-yellow-600">31–70</div>
                <div className="font-semibold text-foreground">Mixed</div>
                <p className="text-sm text-muted-foreground">Balance of both</p>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 text-center space-y-4">
                <div className="text-3xl font-bold text-primary">71–100</div>
                <div className="font-semibold text-foreground">High potential</div>
                <p className="text-sm text-muted-foreground">Machines can handle most</p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-12">
            <h2 className="text-3xl font-bold text-foreground text-center">How It Works</h2>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Input</h3>
                    <p className="text-muted-foreground">Upload a job description or paste text</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Analysis</h3>
                    <p className="text-muted-foreground">AI breaks down tasks and categories</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Scoring</h3>
                    <p className="text-muted-foreground">Each task gets an automation score</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Results</h3>
                    <p className="text-muted-foreground">Clear dashboard with actionable insights</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why PROM8EUS */}
          <section className="text-center space-y-12">
            <h2 className="text-3xl font-bold text-foreground">Why PROM8EUS?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Transparent</h3>
                <p className="text-muted-foreground">Clear numbers, no buzzwords</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Actionable</h3>
                <p className="text-muted-foreground">Practical recommendations</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Balanced</h3>
                <p className="text-muted-foreground">Humans and machines together</p>
              </div>
            </div>
          </section>

          {/* Story */}
          <section className="text-center space-y-6 py-12">
            <p className="text-lg text-muted-foreground italic">
              "Like Prometheus brought fire to mankind, PROM8EUS delivers the modern fire of automation."
            </p>
            <p className="text-xl font-semibold text-foreground">
              Machine or human – what's the right choice for each task?
            </p>
          </section>

          {/* CTA */}
          <section className="text-center py-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                Ready to get your score?
              </h2>
              <Button
                size="lg"
                className="px-8 py-6 font-semibold hover:scale-105 transition-transform duration-200"
                onClick={() => window.location.href = '/'}
              >
                Start Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </section>
        </div>
      </main>

      <PageFooter />
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default About;