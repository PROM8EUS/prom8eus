/**
 * Admin Catalog Management Page
 * 
 * TODO: Implement the following features:
 * - List all roles from catalog/index.json with task counts
 * - "Regenerate" button for individual roles (POST to API route)
 * - Bulk regeneration option
 * - Display catalog statistics and metadata
 * - Preview individual task items
 * - Manual task editing interface
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CatalogRole {
  role: string;
  roleSlug: string;
  file: string;
  items: number;
  version: number;
}

interface CatalogIndex {
  generatedAt: string;
  roles: CatalogRole[];
}

export default function CatalogAdmin() {
  const [catalogIndex, setCatalogIndex] = useState<CatalogIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCatalogIndex();
  }, []);

  const loadCatalogIndex = async () => {
    try {
      setLoading(true);
      // TODO: Implement API endpoint to fetch catalog/index.json
      // const response = await fetch('/api/catalog/index');
      // const data = await response.json();
      // setCatalogIndex(data);
      
      // Mock data for now
      setCatalogIndex({
        generatedAt: new Date().toISOString(),
        roles: [
          { role: "Software Engineer", roleSlug: "software-engineer", file: "software-engineer.json", items: 24, version: 1 },
          { role: "Data Scientist", roleSlug: "data-scientist", file: "data-scientist.json", items: 22, version: 1 }
        ]
      });
    } catch (error) {
      console.error('Failed to load catalog index:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateRole = async (roleSlug: string) => {
    try {
      setRegenerating(prev => new Set([...prev, roleSlug]));
      
      // TODO: Implement API endpoint to regenerate specific role
      // const response = await fetch(`/api/catalog/regenerate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ roleSlug })
      // });
      
      // if (!response.ok) {
      //   throw new Error('Regeneration failed');
      // }
      
      // Simulate regeneration delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Reload index after regeneration
      await loadCatalogIndex();
    } catch (error) {
      console.error(`Failed to regenerate ${roleSlug}:`, error);
    } finally {
      setRegenerating(prev => {
        const newSet = new Set(prev);
        newSet.delete(roleSlug);
        return newSet;
      });
    }
  };

  const regenerateAll = async () => {
    // TODO: Implement bulk regeneration
    console.log('TODO: Implement bulk regeneration');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catalog Administration</h1>
        <p className="text-muted-foreground">
          Manage job task catalogs and regenerate role-specific data using OpenAI GPT-5.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {catalogIndex?.roles.length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {catalogIndex?.roles.reduce((sum, role) => sum + role.items, 0) || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {catalogIndex?.generatedAt 
                    ? new Date(catalogIndex.generatedAt).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Regenerate all catalogs or manage individual roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={regenerateAll} className="mr-4">
                Regenerate All Catalogs
              </Button>
              <Button variant="outline" onClick={loadCatalogIndex}>
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Role Catalogs</h2>
            <Button onClick={regenerateAll} size="sm">
              Regenerate All
            </Button>
          </div>

          <div className="grid gap-4">
            {catalogIndex?.roles.map(role => (
              <Card key={role.roleSlug}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{role.role}</CardTitle>
                      <CardDescription>
                        {role.items} tasks • Version {role.version} • {role.file}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{role.items} tasks</Badge>
                      <Button
                        size="sm"
                        onClick={() => regenerateRole(role.roleSlug)}
                        disabled={regenerating.has(role.roleSlug)}
                      >
                        {regenerating.has(role.roleSlug) ? 'Regenerating...' : 'Regenerate'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Settings and configuration options for catalog generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                TODO: Implement configuration settings for:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>OpenAI API settings and model selection</li>
                <li>Task generation parameters (count, categories)</li>
                <li>Automatic regeneration schedules</li>
                <li>Export/import catalog data</li>
                <li>Role management and custom additions</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}