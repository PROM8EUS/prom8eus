import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PageFooter from "@/components/PageFooter";
import StaticPageTemplate from "@/components/StaticPageTemplate";
import { resolveLang, t } from "@/lib/i18n/i18n";
const Legal = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);
  return <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <StaticPageTemplate title={t(lang, "legal_title")} maxWidth="md">
        <div className="space-y-8">
            {lang === "de" ? <div className="space-y-8 text-left">
                {/* TMG Section */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="font-medium text-foreground">PROM8EUS GbR</p>
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
                    <p className="font-medium text-foreground">PROM8EUS GbR
                </p>
                    <p>Niehler Straße 44a
                </p>
                    <p>50733 Köln</p>
                  </div>
                </section>
              </div> : <div className="space-y-6 text-center">
                <p className="text-muted-foreground">
                  This legal notice is only available in German as required by German law.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please switch to German to view the complete legal notice.
                </p>
              </div>}
        </div>
      </StaticPageTemplate>
      
      <PageFooter />
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>;
};
export default Legal;