import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang, t } from "@/lib/i18n/i18n";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t(lang, "contact_title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t(lang, "contact_subtitle")}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <div className="space-y-6">
              {/* Company */}
              <div className="text-center pb-6 border-b border-border">
                <h2 className="text-2xl font-bold text-primary mb-2">PROM8EUS GbR</h2>
                <p className="text-muted-foreground">c/o ABCDATA</p>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t(lang, "address")}</h3>
                    <div className="text-muted-foreground">
                      <p>Niehler Straße 44a</p>
                      <p>50733 {t(lang, "city")}</p>
                      <p>{t(lang, "country")}</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-Mail</h3>
                    <a 
                      href="mailto:mail@prom8eus.de" 
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      mail@prom8eus.de
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t(lang, "phone")}</h3>
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
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default Contact;