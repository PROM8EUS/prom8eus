import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";

interface HeaderProps {
  showBack?: boolean;
}

const Header = ({ showBack = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <header className="absolute lg:fixed top-0 left-0 right-0 z-50 px-6 py-6 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Back button or Logo */}
        {showBack ? (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors pointer-events-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </Button>
        ) : (
          <a href="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors pointer-events-auto">
            PROM8EUS
          </a>
        )}

        {/* Right side - Logo (when showing back) or Navigation */}
        {showBack ? (
          <div className="text-2xl font-bold text-primary user-select-none">
            PROM8EUS
          </div>
        ) : (
          <nav className="flex items-center space-x-8 pointer-events-auto">

            <a 
              href="/about" 
              className="text-foreground hover:text-primary transition-colors duration-200"
            >
              {t(lang, "about")}
            </a>
            <a 
              href="/contact" 
              className="text-foreground hover:text-primary transition-colors duration-200"
            >
              {t(lang, "contact")}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;