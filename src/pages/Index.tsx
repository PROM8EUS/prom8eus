import Header from "@/components/Header";
import MainContent from "@/components/MainContent";
import CatalogGenerator from "@/components/CatalogGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MainContent />
      <div className="container mx-auto px-4 py-8">
        <CatalogGenerator />
      </div>
    </div>
  );
};

export default Index;
