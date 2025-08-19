import { useSearchParams } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";

interface PageFooterProps {
  onAdminTrigger?: () => void;
}

const PageFooter = ({ onAdminTrigger }: PageFooterProps) => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            PROM
            <span 
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={onAdminTrigger}
              title="Admin"
            >
              8
            </span>
            EUS © 2025 · <a 
              href="/legal" 
              className="hover:text-primary transition-colors"
            >
              {t(lang, "legal_notice")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;