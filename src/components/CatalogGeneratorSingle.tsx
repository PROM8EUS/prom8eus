import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ROLES = [
  "Software Engineer",
  "DevOps Engineer", 
  "Data Scientist",
  "Product Manager",
  "UX/UI Designer",
  "Sales Manager",
  "Marketing Manager",
  "Customer Support Specialist",
  "HR Manager",
  "Financial Accountant"
];

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

export default function CatalogGeneratorSingle() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [catalogs, setCatalogs] = useState<GeneratedCatalog[]>([]);
  const { toast } = useToast();

  const generateSingleCatalog = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose a job role to generate tasks for.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setCatalogs([]);

    try {
      console.log(`🚀 Starting catalog generation for: ${selectedRole}`);
      
      const { data, error } = await supabase.functions.invoke('generate-catalog', {
        body: { role: selectedRole }
      });

      if (error) {
        throw error;
      }

      const response = data as GenerationResponse;
      
      if (!response.success) {
        throw new Error(response.error || 'Generation failed');
      }

      setCatalogs(response.catalogs);

      toast({
        title: "Catalog Generated Successfully!",
        description: `Generated ${response.stats.totalTasks} tasks for ${selectedRole}.`,
      });

      console.log(`✅ Catalog generation completed for ${selectedRole}`);

    } catch (error) {
      console.error(`❌ Error generating catalog for ${selectedRole}:`, error);
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
            Single Role Catalog Generator
          </CardTitle>
          <CardDescription>
            Generate a task catalog for a specific job role to avoid rate limits.
            Recommended for testing or generating individual role catalogs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Job Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job role..." />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={generateSingleCatalog} 
            disabled={isGenerating || !selectedRole}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Catalog for {selectedRole}...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Catalog for {selectedRole || 'Selected Role'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {catalogs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Catalog</h3>
          {catalogs.map((catalog) => {
            const autoStats = getAutomationStats(catalog);
            return (
              <Card key={catalog.roleSlug}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        {catalog.role}
                      </CardTitle>
                      <CardDescription>
                        Generated {catalog.items.length} tasks • Version {catalog.version}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{catalog.source}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
                  
                  <div>
                    <div className="font-medium mb-2">Sample Tasks:</div>
                    <div className="space-y-1">
                      {catalog.items.slice(0, 5).map((task) => (
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
                      {catalog.items.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          +{catalog.items.length - 5} more tasks...
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}