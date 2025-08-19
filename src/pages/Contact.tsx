import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PageFooter from "@/components/PageFooter";
import { resolveLang, t } from "@/lib/i18n/i18n";

const Contact = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="bg-background">
      <Header />
      
      <main className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t(lang, "contact_title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t(lang, "contact_subtitle")}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="space-y-6 text-center">
              {/* Address */}
              <div>
                <h3 className="font-semibold mb-2">{t(lang, "address")}</h3>
                <div className="text-muted-foreground space-y-1">
                  <p>Niehler Straße 44a</p>
                  <p>50733 {t(lang, "city")}</p>
                  <p>{t(lang, "country")}</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <h3 className="font-semibold mb-2">{t(lang, "email")}</h3>
                <a 
                  href="mailto:mail@prom8eus.de" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  mail@prom8eus.de
                </a>
              </div>

              {/* Phone */}
              <div>
                <h3 className="font-semibold mb-2">{t(lang, "phone")}</h3>
                <a 
                  href="tel:+4922125927541" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {t(lang, "phone_number")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <PageFooter />
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default Contact;