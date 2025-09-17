import { useLocation, useSearchParams, Link } from "react-router-dom";
import { useEffect } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  useEffect(() => {
    // Log 404 error for analytics (without console.error in production)
    if (import.meta.env.DEV) {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-muted-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">
            {lang === 'en' ? 'Page Not Found' : 'Seite nicht gefunden'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {lang === 'en' 
              ? 'The page you are looking for does not exist or has been moved.'
              : 'Die gesuchte Seite existiert nicht oder wurde verschoben.'
            }
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              {lang === 'en' ? 'Go to Homepage' : 'Zur Startseite'}
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {lang === 'en' ? 'Go Back' : 'Zurück'}
          </Button>
        </div>
      </div>
      
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default NotFound;
