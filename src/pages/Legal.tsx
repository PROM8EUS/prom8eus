import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang, t } from "@/lib/i18n/i18n";

const Legal = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t(lang, "legal_title")}
            </h1>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <div className="space-y-6">
              <p className="text-muted-foreground text-center">
                {lang === "de" 
                  ? "Die Inhalte für das Impressum werden in Kürze hinzugefügt." 
                  : "Legal notice content will be added shortly."
                }
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default Legal;