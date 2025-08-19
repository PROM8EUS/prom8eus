import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, Zap, User } from 'lucide-react';

interface TermCategory {
  description_de: string;
  description_en: string;
  keywords_de: string[];
  keywords_en: string[];
  weight: number;
  examples: string[];
}

interface TermCatalog {
  automation_signals: Record<string, TermCategory>;
  human_signals: Record<string, TermCategory>;
}

interface CatalogResponse {
  success: boolean;
  catalog: TermCatalog;
  generated_at: string;
  category_filter: string;
  error?: string;
}

const TermCatalog: React.FC = () => {
  const [catalog, setCatalog] = useState<TermCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();

  const generateCatalog = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-term-catalog', {
        body: { 
          category: categoryFilter === 'all' ? null : categoryFilter 
        }
      });

      if (error) throw error;

      const response: CatalogResponse = data;
      
      if (response.success) {
        setCatalog(response.catalog);
        toast({
          title: "Katalog generiert",
          description: `Begriffskatalog erfolgreich erstellt (${response.category_filter})`,
        });
      } else {
        throw new Error(response.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Error generating catalog:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : 'Katalog konnte nicht generiert werden',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryCard = (categoryKey: string, category: TermCategory, type: 'automation' | 'human') => (
    <Card key={categoryKey} className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'automation' ? <Zap className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-orange-500" />}
          <span className="capitalize">{categoryKey.replace('_', ' ')}</span>
          <Badge variant="secondary">{category.weight}</Badge>
        </CardTitle>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{category.description_de}</p>
          <p className="text-xs text-muted-foreground italic">{category.description_en}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Deutsche Keywords */}
          <div>
            <h4 className="font-medium text-sm mb-2">Deutsche Begriffe:</h4>
            <div className="flex flex-wrap gap-1">
              {category.keywords_de.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Englische Keywords */}
          <div>
            <h4 className="font-medium text-sm mb-2">English Terms:</h4>
            <div className="flex flex-wrap gap-1">
              {category.keywords_en.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Beispiele */}
          {category.examples && category.examples.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Beispiele:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {category.examples.map((example, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Begriffskatalog</h1>
            <p className="text-muted-foreground">
              KI-generierte Begriffe zur Aufgabenklassifizierung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Kategorie wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="data_processing">Datenverarbeitung</SelectItem>
              <SelectItem value="communication">Kommunikation</SelectItem>
              <SelectItem value="physical_work">Körperliche Arbeit</SelectItem>
              <SelectItem value="creative">Kreativität</SelectItem>
              <SelectItem value="leadership">Führung</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={generateCatalog} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            Katalog generieren
          </Button>
        </div>
      </div>

      {catalog && (
        <Tabs defaultValue="automation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automatisierbare Aufgaben
            </TabsTrigger>
            <TabsTrigger value="human" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Menschlich erforderlich
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(catalog.automation_signals).map(([key, category]) =>
                renderCategoryCard(key, category, 'automation')
              )}
            </div>
          </TabsContent>

          <TabsContent value="human" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(catalog.human_signals).map(([key, category]) =>
                renderCategoryCard(key, category, 'human')
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!catalog && !isLoading && (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Noch kein Katalog generiert</h3>
          <p className="text-muted-foreground mb-4">
            Generiere einen umfassenden Begriffskatalog zur Aufgabenklassifizierung
          </p>
          <Button onClick={generateCatalog} className="mx-auto">
            Jetzt generieren
          </Button>
        </Card>
      )}
    </div>
  );
};

export default TermCatalog;