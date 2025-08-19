import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import MainContent from "@/components/MainContent";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { resolveLang, t } from "@/lib/i18n/i18n";

const Index = () => {
  const [searchParams] = useSearchParams();
  const lang = resolveLang(searchParams.get("lang") || undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="container mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {t(lang, "headline")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
          {t(lang, "sub")}
        </p>
      </div>
      <MainContent buttonText={t(lang, "start")} />
      <LanguageSwitcher current={lang} />
    </div>
  );
};

export default Index;
