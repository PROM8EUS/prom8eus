import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PageFooter from "@/components/PageFooter";
import StaticPageTemplate from "@/components/StaticPageTemplate";
import { resolveLang, t } from "@/lib/i18n/i18n";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <StaticPageTemplate title={t(lang, "contact_title")} maxWidth="md">
        {/* Description */}
        <div className="text-center mb-12">
          <p className="text-xl text-foreground max-w-4xl mx-auto leading-relaxed">
            {t(lang, "contact_description")}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 text-left">
          {/* Address Section - First Column */}
          <div>
            <h2 className="text-base font-semibold mb-4">{t(lang, "address")}</h2>
            <div className="space-y-2 text-foreground">
              <p className="font-medium">PROM8EUS GbR</p>
              <p>c/o ABCDATA</p>
              <p>Niehler Straße 44a</p>
              <p>50733 Köln</p>
              <p>Deutschland</p>
            </div>
          </div>

          {/* Contact Info - Second Column */}
          <div className="space-y-6">
            {/* Email Section */}
            <div>
              <h2 className="text-base font-semibold mb-4">{t(lang, "email")}</h2>
              <div className="space-y-2 text-foreground">
                <p>
                  <a 
                    href="mailto:mail@prom8eus.de" 
                    className="text-primary hover:text-primary/80"
                  >
                    mail@prom8eus.de
                  </a>
                </p>
              </div>
            </div>

            {/* Phone Section */}
            <div>
              <h2 className="text-base font-semibold mb-4">{t(lang, "phone")}</h2>
              <div className="space-y-2 text-foreground">
                <p>
                  <a 
                    href="tel:+4922125927541" 
                    className="text-primary hover:text-primary/80"
                  >
                    {t(lang, "phone_number")}
                  </a>
                </p>
              </div>
            </div>
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

export default Contact;