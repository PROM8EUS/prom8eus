import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Zap, Users } from "lucide-react";

const About = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 px-6 py-24">
        <div className="max-w-4xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              About <span className="text-primary">PROM8EUS</span>
            </h1>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
          </section>

          {/* Mission Section */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PROM8EUS, we bring clarity to a crucial question: Should a task be handled by humans or machines?
                We believe that automation is not just a buzzword – it's a strategic necessity for businesses facing 
                talent shortages, rising costs, and the demand for efficiency.
              </p>
            </div>
          </section>

          {/* What We Do Section */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">What We Do</h2>
            </div>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                PROM8EUS is a platform where companies can submit job descriptions or tasks.
                Our system analyzes the content and delivers a PROM8EUS Score – a single, transparent metric that 
                shows how automatable a role or task really is.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-muted/30 rounded-xl p-6 text-center space-y-3">
                  <div className="text-2xl font-bold text-destructive">0–30</div>
                  <div className="font-semibold text-foreground">Human-centered</div>
                  <p className="text-sm text-muted-foreground">Little potential for automation</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-6 text-center space-y-3">
                  <div className="text-2xl font-bold text-warning">31–70</div>
                  <div className="font-semibold text-foreground">Mixed</div>
                  <p className="text-sm text-muted-foreground">Automation and human work in balance</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-6 text-center space-y-3">
                  <div className="text-2xl font-bold text-primary">71–100</div>
                  <div className="font-semibold text-foreground">High automation potential</div>
                  <p className="text-sm text-muted-foreground">Machines can handle most parts</p>
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                This score helps organizations decide whether to invest in automation workflows or hire the right people.
              </p>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Input</h3>
                <p className="text-muted-foreground">
                  Upload a job description or paste a URL. Our parser extracts tasks, requirements, and responsibilities.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Analysis</h3>
                <p className="text-muted-foreground">
                  Using Natural Language Processing (NLP) and structured rules, each task is broken down and classified 
                  into categories like Data Processing, Communication, Quality & Security, Strategy.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Scoring</h3>
                <p className="text-muted-foreground">
                  Each task is assessed for its automation potential. Routine, repetitive work scores high, while 
                  creative, interpersonal, or judgment-based tasks score low.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">4</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Output</h3>
                <p className="text-muted-foreground">
                  Tasks are aggregated into the PROM8EUS Score, displayed on a clear dashboard. You'll instantly see 
                  which parts can be automated – and which still require human expertise.
                </p>
              </div>
            </div>
          </section>

          {/* Why PROM8EUS Section */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Why PROM8EUS?</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Transparency</h3>
                <p className="text-muted-foreground">
                  No buzzwords, just a clear number that tells you exactly what you need to know.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Actionability</h3>
                <p className="text-muted-foreground">
                  We don't just show potential, we offer automation blueprints and recruiting options.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Hybrid Thinking</h3>
                <p className="text-muted-foreground">
                  We know that the future of work is not humans vs. machines, but humans and machines working together.
                </p>
              </div>
            </div>
          </section>

          {/* Our Story Section */}
          <section className="space-y-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">Our Story</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Like Prometheus brought fire to mankind, PROM8EUS delivers the modern fire of automation.
              </p>
              <p className="text-xl font-semibold text-foreground">
                Our vision is to empower businesses with clarity: machine or human – what's the right choice for each task?
              </p>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center py-16 bg-muted/20 rounded-3xl">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Ready to discover your automation potential?
              </h2>
              <p className="text-lg text-muted-foreground">
                Get your PROM8EUS Score and make informed decisions about your workforce.
              </p>
              <Button
                size="lg"
                className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200"
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