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
import { Plus, Edit, Save, X, RefreshCw, Tag } from 'lucide-react';
import { WorkflowIndexer } from '@/lib/workflowIndexer';
import { CapabilityChip } from './CapabilityChip';

interface CapabilityTag {
  id: number;
  tag: string;
  display_name: string;
  description: string;
  category: string;
  display_order: number;
  is_core: boolean;
}

interface CapabilityStats {
  total_tags: number;
  core_tags: number;
  category_counts: Record<string, number>;
}

export function CapabilityManagement() {
  const [capabilityTags, setCapabilityTags] = useState<CapabilityTag[]>([]);
  const [coreTags, setCoreTags] = useState<CapabilityTag[]>([]);
  const [stats, setStats] = useState<CapabilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<CapabilityTag | null>(null);
  const [newTag, setNewTag] = useState({
    tag: '',
    display_name: '',
    description: '',
    category: 'data_access',
    display_order: 0,
    is_core: false
  });
  const [saving, setSaving] = useState(false);

  const categories = [
    'data_access',
    'data_processing', 
    'communication',
    'content_creation',
    'content_processing',
    'automation',
    'productivity',
    'development',
    'security',
    'business',
    'specialized'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTags, coreTagsData] = await Promise.all([
        WorkflowIndexer.getAgentCapabilityTags(),
        WorkflowIndexer.getCoreCapabilityTags()
      ]);

      setCapabilityTags(allTags);
      setCoreTags(coreTagsData);

      // Calculate stats
      const categoryCounts: Record<string, number> = {};
      allTags.forEach(tag => {
        categoryCounts[tag.category] = (categoryCounts[tag.category] || 0) + 1;
      });

      setStats({
        total_tags: allTags.length,
        core_tags: coreTagsData.length,
        category_counts: categoryCounts
      });
    } catch (error) {
      console.error('Failed to load capability management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTag = (tag: CapabilityTag) => {
    setEditingTag(tag);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const handleSaveTag = async () => {
    if (!editingTag) return;

    setSaving(true);
    try {
      // TODO: Implement update capability tag functionality
      console.log('Saving tag:', editingTag);
      await loadData();
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to save tag:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.tag || !newTag.display_name) return;

    setSaving(true);
    try {
      // TODO: Implement add capability tag functionality
      console.log('Adding tag:', newTag);
      setNewTag({
        tag: '',
        display_name: '',
        description: '',
        category: 'data_access',
        display_order: 0,
        is_core: false
      });
      await loadData();
    } catch (error) {
      console.error('Failed to add tag:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading capability management data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Capability Tag Management</h2>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_tags}</div>
              <p className="text-sm text-muted-foreground">Total Capability Tags</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.core_tags}</div>
              <p className="text-sm text-muted-foreground">Core Tags</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{Object.keys(stats.category_counts).length}</div>
              <p className="text-sm text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tags">All Tags</TabsTrigger>
          <TabsTrigger value="core">Core Tags</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="add">Add Tag</TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Capability Tags ({capabilityTags.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capabilityTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CapabilityChip capability={tag.tag} size="sm" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tag.display_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tag.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tag.is_core ? 'default' : 'secondary'}>
                          {tag.is_core ? 'Core' : 'Extended'}
                        </Badge>
                      </TableCell>
                      <TableCell>{tag.display_order}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTag(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="core" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Capability Tags ({coreTags.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {coreTags.map((tag) => (
                  <div key={tag.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CapabilityChip capability={tag.tag} size="sm" />
                      <Badge variant="default" className="text-xs">Core</Badge>
                    </div>
                    <h3 className="font-medium mb-1">{tag.display_name}</h3>
                    <p className="text-sm text-muted-foreground">{tag.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories ({Object.keys(stats?.category_counts || {}).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats?.category_counts || {}).map(([category, count]) => (
                  <div key={category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                    <div className="space-y-1">
                      {capabilityTags
                        .filter(tag => tag.category === category)
                        .slice(0, 3)
                        .map(tag => (
                          <CapabilityChip key={tag.id} capability={tag.tag} size="sm" />
                        ))}
                      {capabilityTags.filter(tag => tag.category === category).length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{capabilityTags.filter(tag => tag.category === category).length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Capability Tag</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tag ID</Label>
                  <Input
                    value={newTag.tag}
                    onChange={(e) => setNewTag({ ...newTag, tag: e.target.value })}
                    placeholder="e.g., new_capability"
                  />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={newTag.display_name}
                    onChange={(e) => setNewTag({ ...newTag, display_name: e.target.value })}
                    placeholder="e.g., New Capability"
                  />
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  placeholder="Describe what this capability does..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newTag.category} onValueChange={(value) => setNewTag({ ...newTag, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={newTag.display_order}
                    onChange={(e) => setNewTag({ ...newTag, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_core"
                    checked={newTag.is_core}
                    onChange={(e) => setNewTag({ ...newTag, is_core: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_core">Core Tag</Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAddTag} disabled={saving || !newTag.tag || !newTag.display_name}>
                  <Plus className="h-4 w-4 mr-1" />
                  {saving ? 'Adding...' : 'Add Tag'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Tag Modal */}
      {editingTag && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Edit Capability Tag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Capability tag editing is not yet implemented. This is a placeholder for future functionality.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
