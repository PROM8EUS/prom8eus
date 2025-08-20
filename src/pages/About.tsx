import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import StaticPageTemplate from "@/components/StaticPageTemplate";
import { resolveLang, t } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Target, BookOpen, Users, Lightbulb, Cog } from "lucide-react";

const About = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <StaticPageTemplate title={t(lang, "about_new_page_title")} maxWidth="lg">
          
          {/* Introduction */}
          <div className="text-center mb-16">
            <p className="text-xl text-foreground max-w-4xl mx-auto leading-relaxed">
              {t(lang, "about_intro_main")}
            </p>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed mt-6">
              {t(lang, "about_intro_goal")}
            </p>
          </div>

          {/* Our Approach */}
          <div className="mb-80">
            <div className="flex items-center justify-center space-x-3 mb-12">
              <Target className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">{t(lang, "about_approach_title")}</h2>
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-12 text-center">
              {t(lang, "about_approach_desc")}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center space-y-4 p-6 bg-muted/30 rounded-2xl border border-muted/50">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_approach_input")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_approach_input_desc")}
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 bg-muted/30 rounded-2xl border border-muted/50">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_approach_analysis")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_approach_analysis_desc")}
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 bg-muted/30 rounded-2xl border border-muted/50">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_approach_output")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_approach_output_desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Scientific Background */}
          <div className="mb-20">
            <div className="flex items-center justify-center space-x-3 mb-12 mt-20">
              <Cog className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">{t(lang, "about_scientific_title")}</h2>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t(lang, "about_scientific_hypothesis")}
              </p>
              
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground text-center">{t(lang, "about_scientific_foundations")}</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Wiederholbarkeit */}
                  <div className="bg-muted/30 p-6 rounded-2xl border border-muted/50 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Wiederholbarkeit</h4>
                    <p className="text-sm text-muted-foreground mb-3">Wie oft werden ähnliche Aufgaben ausgeführt?</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded">
                        <span className="font-medium text-green-700 dark:text-green-300">E-Mails beantworten</span>
                        <span className="text-green-600 dark:text-green-400 ml-2">Score: 85</span>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded">
                        <span className="font-medium text-red-700 dark:text-red-300">Kreative Kampagnen</span>
                        <span className="text-red-600 dark:text-red-400 ml-2">Score: 25</span>
                      </div>
                    </div>
                  </div>

                  {/* Standardisierbarkeit */}
                  <div className="bg-muted/30 p-6 rounded-2xl border border-muted/50 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Standardisierbarkeit</h4>
                    <p className="text-sm text-muted-foreground mb-3">Lassen sich Prozesse in feste Regeln fassen?</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded">
                        <span className="font-medium text-green-700 dark:text-green-300">Daten in Excel eintragen</span>
                        <span className="text-green-600 dark:text-green-400 ml-2">Score: 90</span>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded">
                        <span className="font-medium text-red-700 dark:text-red-300">Kunden beraten</span>
                        <span className="text-red-600 dark:text-red-400 ml-2">Score: 30</span>
                      </div>
                    </div>
                  </div>

                  {/* Kognitive Komplexität */}
                  <div className="bg-muted/30 p-6 rounded-2xl border border-muted/50 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Kognitive Komplexität</h4>
                    <p className="text-sm text-muted-foreground mb-3">Erfordert die Aufgabe kreative Entscheidungen?</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded">
                        <span className="font-medium text-green-700 dark:text-green-300">Berichte erstellen</span>
                        <span className="text-green-600 dark:text-green-400 ml-2">Score: 70</span>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded">
                        <span className="font-medium text-red-700 dark:text-red-300">Strategische Entscheidungen</span>
                        <span className="text-red-600 dark:text-red-400 ml-2">Score: 15</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mb-20">
            <div className="flex items-center justify-center space-x-3 mb-12 mt-20">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">{t(lang, "about_usecases_title")}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Unternehmen Use Case */}
              <div className="space-y-6 p-8 bg-muted/30 rounded-2xl border border-muted/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t(lang, "about_usecase_companies_title")}</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t(lang, "about_usecase_companies_desc")}
                </p>
              </div>
              
              {/* Arbeitnehmer/Freelancer Use Case */}
              <div className="space-y-6 p-8 bg-muted/30 rounded-2xl border border-muted/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t(lang, "about_usecase_employees_title")}</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t(lang, "about_usecase_employees_desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="text-center mb-20 py-20 bg-background rounded-3xl relative overflow-hidden mt-20">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-1">
              <div className="absolute top-16 left-20 w-24 h-24 bg-primary/20 rounded-full" style={{
                animation: 'float1 6s ease-in-out infinite',
                animationDelay: '0s'
              }}></div>
              <div className="absolute bottom-20 right-24 w-20 h-20 bg-primary/20 rounded-full" style={{
                animation: 'float2 8s ease-in-out infinite',
                animationDelay: '2s'
              }}></div>
              <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-primary/20 rounded-full" style={{
                animation: 'float3 7s ease-in-out infinite',
                animationDelay: '4s'
              }}></div>
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto px-8">
              {/* Vision Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              
              <h2 className="text-3xl font-bold text-foreground mb-8">{t(lang, "about_vision_title")}</h2>
              
              <div className="space-y-6">
                <p className="text-xl text-foreground leading-relaxed max-w-3xl mx-auto">
                  {t(lang, "about_vision_bridge")}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                  {t(lang, "about_vision_marketplace")}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-20 px-8 md:px-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl mt-20">
            <div className="space-y-8 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground">
                {t(lang, "about_cta_title")}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t(lang, "about_cta_desc")}
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                size="lg"
                className="px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-200"
              >
                {t(lang, "about_cta_button")}
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>
          </div>
        </StaticPageTemplate>
      
      <PageFooter />
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default About;