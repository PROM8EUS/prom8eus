import { useSearchParams } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";

interface FooterProps {
  onAdminTrigger?: () => void;
}

const Footer = ({ onAdminTrigger }: FooterProps = {}) => {
  const currentYear = new Date().getFullYear();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <footer className="bg-muted/30 border-t border-border py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo with secret admin trigger */}
          <div className="text-2xl font-bold text-primary">
            PROM
            <span 
              className="cursor-pointer hover:text-primary/80 transition-colors"
              onClick={onAdminTrigger}
              title="Admin"
            >
              8
            </span>
            EUS
          </div>
          
          {/* Copyright and Attribution */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div>© {currentYear} PROM8EUS. {t(lang, "copyright")}</div>
            <div>
              <a 
                href="https://logo.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Logos provided by Logo.dev
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;