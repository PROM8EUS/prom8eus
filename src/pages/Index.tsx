import Header from "@/components/Header";
import MainContent from "@/components/MainContent";
import CatalogPrompts from "@/components/CatalogPrompts";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MainContent />
      <CatalogPrompts />
    </div>
  );
};

export default Index;
