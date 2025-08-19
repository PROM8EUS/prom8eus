import Header from "@/components/Header";
import MainContent from "@/components/MainContent";
import CatalogGenerator from "@/components/CatalogGenerator";
import CatalogGeneratorSingle from "@/components/CatalogGeneratorSingle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MainContent />
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Role Generator</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generator</TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <CatalogGeneratorSingle />
          </TabsContent>
          <TabsContent value="bulk">
            <CatalogGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
