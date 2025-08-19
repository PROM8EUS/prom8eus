import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PageFooter from "@/components/PageFooter";
import { resolveLang, t } from "@/lib/i18n/i18n";

const Contact = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t(lang, "contact_title")}
            </h1>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <div className="space-y-8 text-left">
              {/* Address Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">{t(lang, "address")}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>Niehler Straße 44a</p>
                  <p>50733 {t(lang, "city")}</p>
                  <p>{t(lang, "country")}</p>
                </div>
              </section>

              {/* Email Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">{t(lang, "email")}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <a 
                      href="mailto:mail@prom8eus.de" 
                      className="text-primary hover:text-primary/80"
                    >
                      mail@prom8eus.de
                    </a>
                  </p>
                </div>
              </section>

              {/* Phone Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">{t(lang, "phone")}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <a 
                      href="tel:+4922125927541" 
                      className="text-primary hover:text-primary/80"
                    >
                      {t(lang, "phone_number")}
                    </a>
                  </p>
                </div>
              </section>
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