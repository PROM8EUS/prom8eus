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
      <MainContent 
        buttonText={t(lang, "start")}
        headline={t(lang, "headline")}
        subtitle={t(lang, "sub")}
        lang={lang}
      />
      <div className="fixed bottom-6 right-6">
        <LanguageSwitcher current={lang} />
      </div>
    </div>
  );
};

export default Index;
