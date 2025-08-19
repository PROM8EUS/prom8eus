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
            {lang === "de" ? (
              <div className="space-y-8 text-left">
                {/* TMG Section */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="font-medium text-foreground">prom8eus GbR</p>
                    <p>vertreten durch Thomas Fritsch und André Sheydin</p>
                    <p>c/o ABCDATA</p>
                    <p>Niehler Straße 44a</p>
                    <p>50733 Köln</p>
                    <p>Deutschland</p>
                  </div>
                </section>

                {/* Contact Section */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Telefon: <a href="tel:+4922125927541" className="text-primary hover:text-primary/80">0221 2592 7541</a></p>
                    <p>E-Mail: <a href="mailto:mail@prom8eus.de" className="text-primary hover:text-primary/80">mail@prom8eus.de</a></p>
                  </div>
                </section>

                {/* Responsibility Section */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="font-medium text-foreground">André Sheydin & Thomas Fritsch</p>
                    <p>Niehler Straße 44a</p>
                    <p>50733 Köln</p>
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <p className="text-muted-foreground">
                  This legal notice is only available in German as required by German law.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please switch to German to view the complete legal notice.
                </p>
              </div>
            )}
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