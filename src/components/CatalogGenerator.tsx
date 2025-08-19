import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedCatalog {
  role: string;
  roleSlug: string;
  version: number;
  generatedAt: string;
  source: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    defaultAutomation: 'Automatable' | 'Human';
  }>;
}

interface GenerationResponse {
  success: boolean;
  catalogs: GeneratedCatalog[];
  index: {
    generatedAt: string;
    roles: Array<{
      role: string;
      roleSlug: string;
      file: string;
      items: number;
      version: number;
    }>;
  };
  stats: {
    rolesGenerated: number;
    totalTasks: number;
    generatedAt: string;
  };
  error?: string;
}

export default function CatalogGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [catalogs, setCatalogs] = useState<GeneratedCatalog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const generateCatalogs = async () => {
    setIsGenerating(true);
    setCatalogs([]);
    setStats(null);

    try {
      console.log('🚀 Starting catalog generation...');
      
      const { data, error } = await supabase.functions.invoke('generate-catalog', {
        body: {}
      });

      if (error) {
        throw error;
      }

      const response = data as GenerationResponse;
      
      if (!response.success) {
        throw new Error(response.error || 'Generation failed');
      }

      setCatalogs(response.catalogs);
      setStats(response.stats);

      toast({
        title: "Catalogs Generated Successfully!",
        description: `Generated ${response.stats.rolesGenerated} role catalogs with ${response.stats.totalTasks} total tasks.`,
      });

      console.log('✅ Catalog generation completed successfully');

    } catch (error) {
      console.error('❌ Error generating catalogs:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getAutomationStats = (catalog: GeneratedCatalog) => {
    const automatable = catalog.items.filter(item => item.defaultAutomation === 'Automatable').length;
    const human = catalog.items.filter(item => item.defaultAutomation === 'Human').length;
    return { automatable, human, total: catalog.items.length };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Job Task Catalog Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive task catalogs for various job roles using OpenAI GPT-5.
            Each catalog contains 18-30 categorized tasks with automation classifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateCatalogs} 
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Catalogs...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate All Role Catalogs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generation Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.rolesGenerated}</div>
                <div className="text-sm text-muted-foreground">Roles Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalTasks}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(stats.totalTasks / stats.rolesGenerated)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Tasks/Role</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {catalogs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Catalogs</h3>
          <div className="grid gap-4">
            {catalogs.map((catalog) => {
              const autoStats = getAutomationStats(catalog);
              return (
                <Card key={catalog.roleSlug}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{catalog.role}</CardTitle>
                        <CardDescription>
                          Generated {catalog.items.length} tasks • Version {catalog.version}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{catalog.source}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Total Tasks</div>
                        <div className="text-2xl font-bold">{autoStats.total}</div>
                      </div>
                      <div>
                        <div className="font-medium text-blue-600">Automatable</div>
                        <div className="text-2xl font-bold text-blue-600">{autoStats.automatable}</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-600">Human</div>
                        <div className="text-2xl font-bold text-purple-600">{autoStats.human}</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-600">Automation %</div>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((autoStats.automatable / autoStats.total) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-medium mb-2">Sample Tasks:</div>
                      <div className="space-y-1">
                        {catalog.items.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            <Badge 
                              variant={task.defaultAutomation === 'Automatable' ? 'default' : 'secondary'}
                            >
                              {task.defaultAutomation}
                            </Badge>
                            <span className="font-medium">{task.title}</span>
                            <span className="text-muted-foreground">• {task.category}</span>
                          </div>
                        ))}
                        {catalog.items.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{catalog.items.length - 3} more tasks...
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!isGenerating && catalogs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No catalogs generated yet. Click the button above to start generating task catalogs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}