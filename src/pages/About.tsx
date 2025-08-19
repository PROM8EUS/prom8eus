import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import PageFooter from "@/components/PageFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import StaticPageTemplate from "@/components/StaticPageTemplate";
import { resolveLang, t } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Target, BookOpen, Users, Lightbulb } from "lucide-react";

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
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/30">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_approach_input")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_approach_input_desc")}
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 rounded-2xl border border-green-200/50 dark:border-green-800/30">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_approach_analysis")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_approach_analysis_desc")}
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl border border-purple-200/50 dark:border-purple-800/30">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <BookOpen className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">{t(lang, "about_scientific_title")}</h2>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t(lang, "about_scientific_hypothesis")}
              </p>
              
              <div className="bg-gradient-to-r from-muted/30 to-transparent p-6 rounded-2xl border border-muted/50">
                <h3 className="text-xl font-semibold text-foreground mb-4">{t(lang, "about_scientific_foundations")}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start space-x-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>{t(lang, "about_scientific_research")}</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>{t(lang, "about_scientific_theory")}</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>{t(lang, "about_scientific_models")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Application and Benefits */}
          <div className="mb-20">
            <div className="flex items-center justify-center space-x-3 mb-12">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">{t(lang, "about_application_title")}</h2>
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-12 text-center">
              {t(lang, "about_application_desc")}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/30">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_application_transparency")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_application_transparency_desc")}
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 rounded-2xl border border-green-200/50 dark:border-green-800/30">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_application_actionable")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_application_actionable_desc")}
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl border border-purple-200/50 dark:border-purple-800/30">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{t(lang, "about_application_scientific")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(lang, "about_application_scientific_desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="text-center mb-20 py-20 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-20 h-20 bg-primary rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-16 h-16 bg-primary rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-primary rounded-full"></div>
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
          <div className="text-center py-20 px-8 md:px-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl">
            <div className="space-y-8 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground">
                {t(lang, "about_cta_title")}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t(lang, "about_cta_desc")}
              </p>
              <Button
                size="lg"
                className="px-10 py-8 text-lg font-semibold hover:scale-105 transition-transform duration-200"
                onClick={() => window.location.href = '/'}
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