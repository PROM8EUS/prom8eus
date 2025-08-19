import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, FileText, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

const SYSTEM_PROMPT = `You are a precise catalog builder for job tasks. Return ONLY valid JSON matching the provided schema. Avoid duplicates and vague items. Use imperative titles. Keep each description to one sentence. Classify into the provided categories and infer defaultAutomation as 'Automatable' for operational/technical repeatable tasks and 'Human' for judgment-heavy, creative, advisory or leadership tasks.`;

const getUserPrompt = (role: string) => `
ROLE: ${role}

TAXONOMY:
• Data Processing
• Reporting & Analytics
• Communication & Scheduling
• Integration & DevOps
• Quality & Security
• Customer & Advisory
• Creative & Strategy

Produce an array of 18–30 task objects with fields:
{ title, description, category, tags }

Rules:
• title: imperative, 3–7 words (e.g., "Build CI/CD pipeline")
• description: one concise sentence
• category: one of the taxonomy values
• tags: up to 5 lowercased keywords
• do not include ids or defaultAutomation; those are derived

Output: JSON array only.
`;

export default function CatalogPrompts() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [jsonInput, setJsonInput] = useState('');
  const [processedCatalog, setProcessedCatalog] = useState<any>(null);
  const { toast } = useToast();

  const copySystemPrompt = () => {
    navigator.clipboard.writeText(SYSTEM_PROMPT);
    toast({ title: "Copied!", description: "System prompt copied to clipboard." });
  };

  const copyUserPrompt = () => {
    if (!selectedRole) {
      toast({ title: "Select a role first", variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(getUserPrompt(selectedRole));
    toast({ title: "Copied!", description: `User prompt for ${selectedRole} copied to clipboard.` });
  };

  const slugify = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const processJsonResponse = () => {
    if (!jsonInput.trim()) {
      toast({ title: "Paste JSON first", variant: "destructive" });
      return;
    }

    if (!selectedRole) {
      toast({ title: "Select a role first", variant: "destructive" });
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      let tasks = Array.isArray(parsed) ? parsed : parsed.tasks || parsed.items || Object.values(parsed)[0];
      
      if (!Array.isArray(tasks)) {
        throw new Error('No valid task array found');
      }

      // Process and normalize tasks
      const processedTasks = tasks.map(task => ({
        id: slugify(task.title),
        title: task.title,
        description: task.description,
        category: task.category,
        tags: (task.tags || []).slice(0, 5).map((tag: string) => tag.toLowerCase()),
        defaultAutomation: getDefaultAutomation(task.category)
      }));

      const catalog = {
        role: selectedRole,
        roleSlug: slugify(selectedRole),
        version: 1,
        generatedAt: new Date().toISOString(),
        source: 'manual',
        items: processedTasks
      };

      setProcessedCatalog(catalog);
      toast({ title: "Success!", description: `Processed ${processedTasks.length} tasks for ${selectedRole}` });

    } catch (error) {
      toast({ 
        title: "Invalid JSON", 
        description: error instanceof Error ? error.message : "Could not parse JSON",
        variant: "destructive" 
      });
    }
  };

  const getDefaultAutomation = (category: string) => {
    const automationTendency: Record<string, string> = {
      "Data Processing": "Automatable",
      "Reporting & Analytics": "Automatable", 
      "Communication & Scheduling": "Automatable",
      "Integration & DevOps": "Automatable",
      "Quality & Security": "Automatable",
      "Customer & Advisory": "Human",
      "Creative & Strategy": "Human"
    };
    return automationTendency[category] || "Human";
  };

  const downloadCatalog = () => {
    if (!processedCatalog) return;
    
    const dataStr = JSON.stringify(processedCatalog, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${processedCatalog.roleSlug}-catalog.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Downloaded!", description: "Catalog saved as JSON file." });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Manual Catalog Creator</h1>
        <p className="text-muted-foreground">Copy prompts for GPT-5, paste responses, and generate catalogs</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Prompts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Step 1: System Prompt
              </CardTitle>
              <CardDescription>Copy this system prompt for GPT-5</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg text-sm font-mono mb-4 max-h-32 overflow-y-auto">
                {SYSTEM_PROMPT}
              </div>
              <Button onClick={copySystemPrompt} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy System Prompt
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Step 2: User Prompt
              </CardTitle>
              <CardDescription>Select a role and copy the user prompt</CardDescription>
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

              {selectedRole && (
                <div className="bg-muted p-4 rounded-lg text-sm font-mono max-h-40 overflow-y-auto">
                  {getUserPrompt(selectedRole)}
                </div>
              )}

              <Button onClick={copyUserPrompt} disabled={!selectedRole} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy User Prompt for {selectedRole || 'Selected Role'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Response Processing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Step 3: Paste GPT-5 Response
              </CardTitle>
              <CardDescription>Paste the JSON array response from GPT-5</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste the JSON array response here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-32 font-mono text-sm"
              />
              <Button onClick={processJsonResponse} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Process JSON Response
              </Button>
            </CardContent>
          </Card>

          {processedCatalog && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generated Catalog
                </CardTitle>
                <CardDescription>
                  {processedCatalog.items.length} tasks for {processedCatalog.role}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Total Tasks</div>
                    <div className="text-2xl font-bold">{processedCatalog.items.length}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">Automation %</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((processedCatalog.items.filter((item: any) => item.defaultAutomation === 'Automatable').length / processedCatalog.items.length) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">Sample Tasks:</div>
                  {processedCatalog.items.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <Badge variant={task.defaultAutomation === 'Automatable' ? 'default' : 'secondary'}>
                        {task.defaultAutomation}
                      </Badge>
                      <span className="font-medium">{task.title}</span>
                    </div>
                  ))}
                </div>

                <Button onClick={downloadCatalog} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Catalog JSON
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}