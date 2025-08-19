import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="text-2xl font-bold text-primary">
          PROM8EUS
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          <a 
            href="#about" 
            className="text-foreground hover:text-primary transition-colors duration-200"
          >
            Über uns
          </a>
          <a 
            href="#contact" 
            className="text-foreground hover:text-primary transition-colors duration-200"
          >
            Kontakt
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;