import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { resolveLang, t } from "@/lib/i18n/i18n";

const Header = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
          PROM8EUS
        </a>

        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          <a 
            href="/about" 
            className="text-foreground hover:text-primary transition-colors duration-200"
          >
            About
          </a>
          <a 
            href="/contact" 
            className="text-foreground hover:text-primary transition-colors duration-200"
          >
            {t(lang, "contact")}
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;