import { useSearchParams } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <footer className="bg-muted/30 border-t border-border py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo */}
          <div className="text-2xl font-bold text-primary">
            PROM8EUS
          </div>
          
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} PROM8EUS. {t(lang, "copyright")}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;