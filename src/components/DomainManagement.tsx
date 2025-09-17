import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Save, X, Plus, RefreshCw } from 'lucide-react';
import { WorkflowIndexer } from '@/lib/workflowIndexer';
import { supabase } from '../lib/supabase';

interface DomainOverride {
  id: number;
  content_hash: string;
  title: string;
  summary: string;
  source_id: string;
  domains: string[];
  domain_confidences: number[];
  domain_origin: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

interface DomainStats {
  total_classifications: number;
  llm_classifications: number;
  admin_overrides: number;
  mixed_classifications: number;
  unique_domains: number;
  avg_confidence: number;
}

interface OntologyDomain {
  id: number;
  label: string;
  display_order: number;
  is_fallback: boolean;
  description: string;
}

export function DomainManagement() {
  const [overrides, setOverrides] = useState<DomainOverride[]>([]);
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [ontologyDomains, setOntologyDomains] = useState<OntologyDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOverride, setEditingOverride] = useState<DomainOverride | null>(null);
  const [newDomains, setNewDomains] = useState<string[]>([]);
  const [newConfidences, setNewConfidences] = useState<number[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overridesData, statsData, domainsData] = await Promise.all([
        WorkflowIndexer.prototype.getAdminOverrides(),
        WorkflowIndexer.prototype.getDomainClassificationStats(),
        supabase.rpc('get_ontology_domains')
      ]);

      setOverrides(overridesData);
      setStats(statsData);
      setOntologyDomains(domainsData.data || []);
    } catch (error) {
      console.error('Failed to load domain management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOverride = (override: DomainOverride) => {
    setEditingOverride(override);
    setNewDomains([...override.domains]);
    setNewConfidences([...override.domain_confidences]);
    setAdminNotes(override.admin_notes || '');
  };

  const handleCancelEdit = () => {
    setEditingOverride(null);
    setNewDomains([]);
    setNewConfidences([]);
    setAdminNotes('');
  };

  const handleSaveOverride = async () => {
    if (!editingOverride) return;

    setSaving(true);
    try {
      const success = await WorkflowIndexer.prototype.adminOverrideDomainClassification(
        editingOverride.title,
        editingOverride.summary,
        editingOverride.source_id,
        newDomains,
        newConfidences,
        adminNotes
      );

      if (success) {
        await loadData();
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Failed to save override:', error);
    } finally {
      setSaving(false);
    }
  };

  const addDomain = () => {
    if (newDomains.length < 3) {
      setNewDomains([...newDomains, 'Other']);
      setNewConfidences([...newConfidences, 0.5]);
    }
  };

  const removeDomain = (index: number) => {
    if (newDomains.length > 1) {
      setNewDomains(newDomains.filter((_, i) => i !== index));
      setNewConfidences(newConfidences.filter((_, i) => i !== index));
    }
  };

  const updateDomain = (index: number, domain: string) => {
    const updated = [...newDomains];
    updated[index] = domain;
    setNewDomains(updated);
  };

  const updateConfidence = (index: number, confidence: number) => {
    const updated = [...newConfidences];
    updated[index] = Math.max(0, Math.min(1, confidence));
    setNewConfidences(updated);
  };

  const normalizeConfidences = () => {
    const total = newConfidences.reduce((sum, conf) => sum + conf, 0);
    if (total > 0) {
      const normalized = newConfidences.map(conf => conf / total);
      setNewConfidences(normalized);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading domain management data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Domain Classification Management</h2>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_classifications}</div>
              <p className="text-sm text-muted-foreground">Total Classifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.llm_classifications}</div>
              <p className="text-sm text-muted-foreground">LLM Generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.admin_overrides}</div>
              <p className="text-sm text-muted-foreground">Admin Overrides</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.mixed_classifications}</div>
              <p className="text-sm text-muted-foreground">Mixed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.unique_domains}</div>
              <p className="text-sm text-muted-foreground">Unique Domains</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{(stats.avg_confidence * 100).toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overrides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overrides">Admin Overrides</TabsTrigger>
          <TabsTrigger value="ontology">Domain Ontology</TabsTrigger>
        </TabsList>

        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Overrides ({overrides.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {overrides.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No admin overrides found. Domain classifications are currently using LLM-generated results.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Domains</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overrides.map((override) => (
                      <TableRow key={override.id}>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={override.title}>
                            {override.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{override.source_id}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {override.domains.map((domain, index) => (
                              <Badge key={index} variant="secondary">
                                {domain} ({(override.domain_confidences[index] * 100).toFixed(0)}%)
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={override.domain_origin === 'admin' ? 'default' : 'secondary'}>
                            {override.domain_origin}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(override.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOverride(override)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ontology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Ontology ({ontologyDomains.length} domains)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ontologyDomains.map((domain) => (
                  <div key={domain.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{domain.label}</h3>
                      {domain.is_fallback && (
                        <Badge variant="outline">Fallback</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {domain.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Override Modal */}
      {editingOverride && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Edit Domain Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={editingOverride.title} disabled />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea value={editingOverride.summary} disabled rows={3} />
            </div>
            <div>
              <Label>Source</Label>
              <Input value={editingOverride.source_id} disabled />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Domains</Label>
                {newDomains.length < 3 && (
                  <Button size="sm" onClick={addDomain}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Domain
                  </Button>
                )}
              </div>
              {newDomains.map((domain, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Select value={domain} onValueChange={(value) => updateDomain(index, value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ontologyDomains.map((d) => (
                        <SelectItem key={d.id} value={d.label}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newConfidences[index]}
                    onChange={(e) => updateConfidence(index, parseFloat(e.target.value))}
                    className="w-20"
                  />
                  {newDomains.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeDomain(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={normalizeConfidences}>
                Normalize Confidences
              </Button>
            </div>

            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Optional notes about this override..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSaveOverride} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Override'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
