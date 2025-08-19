import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang, t } from "@/lib/i18n/i18n";
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
              {t(lang, "about_page_title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t(lang, "about_mission_text")}
            </p>
          </section>

          {/* What We Do */}
          <section className="text-center space-y-12">
            <div className="flex items-center justify-center space-x-3">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">{t(lang, "about_what_we_do")}</h2>
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t(lang, "about_what_we_do_text")}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-2xl p-8 text-center space-y-4">
                <div className="text-3xl font-bold text-destructive">0–30</div>
                <div className="font-semibold text-foreground">{t(lang, "about_human_centered")}</div>
                <p className="text-sm text-muted-foreground">{t(lang, "about_human_centered_desc")}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-2xl p-8 text-center space-y-4">
                <div className="text-3xl font-bold text-yellow-600">31–70</div>
                <div className="font-semibold text-foreground">{t(lang, "about_mixed")}</div>
                <p className="text-sm text-muted-foreground">{t(lang, "about_mixed_desc")}</p>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 text-center space-y-4">
                <div className="text-3xl font-bold text-primary">71–100</div>
                <div className="font-semibold text-foreground">{t(lang, "about_high_potential")}</div>
                <p className="text-sm text-muted-foreground">{t(lang, "about_high_potential_desc")}</p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-12">
            <h2 className="text-3xl font-bold text-foreground text-center">{t(lang, "about_how_it_works")}</h2>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t(lang, "about_input")}</h3>
                    <p className="text-muted-foreground">{t(lang, "about_input_desc")}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t(lang, "about_analysis")}</h3>
                    <p className="text-muted-foreground">{t(lang, "about_analysis_desc")}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t(lang, "about_scoring")}</h3>
                    <p className="text-muted-foreground">{t(lang, "about_scoring_desc")}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-white">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t(lang, "about_results")}</h3>
                    <p className="text-muted-foreground">{t(lang, "about_results_desc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why PROM8EUS */}
          <section className="text-center space-y-12">
            <h2 className="text-3xl font-bold text-foreground">{t(lang, "about_why_prom8eus")}</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_transparent")}</h3>
                <p className="text-muted-foreground">{t(lang, "about_transparent_desc")}</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_actionable")}</h3>
                <p className="text-muted-foreground">{t(lang, "about_actionable_desc")}</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_balanced")}</h3>
                <p className="text-muted-foreground">{t(lang, "about_balanced_desc")}</p>
              </div>
            </div>
          </section>

          {/* Story */}
          <section className="text-center space-y-6 py-12">
            <p className="text-lg text-muted-foreground italic">
              "{t(lang, "about_story_quote")}"
            </p>
            <p className="text-xl font-semibold text-foreground">
              {t(lang, "about_story_vision")}
            </p>
          </section>

          {/* CTA */}
          <section className="text-center py-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t(lang, "about_cta_title")}
              </h2>
              <Button
                size="lg"
                className="px-8 py-6 font-semibold hover:scale-105 transition-transform duration-200"
                onClick={() => window.location.href = '/'}
              >
                {t(lang, "about_cta_button")}
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