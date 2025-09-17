import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Loader2, 
  Mail, 
  User, 
  Building, 
  Clock, 
  Euro, 
  Search, 
  Filter, 
  RefreshCw,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  Wrench,
  FileText,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { ImplementationRequestService, ImplementationRequest, ImplementationRequestStats } from '../lib/implementationRequests';

export function ImplementationRequestsManagement() {
  const [requests, setRequests] = useState<ImplementationRequest[]>([]);
  const [stats, setStats] = useState<ImplementationRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ImplementationRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingRequest, setEditingRequest] = useState<ImplementationRequest | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    admin_notes: '',
    admin_assigned_to: '',
    estimated_value: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, statsData] = await Promise.all([
        ImplementationRequestService.getAllRequests(),
        ImplementationRequestService.getStats()
      ]);
      
      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading implementation requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const success = await ImplementationRequestService.updateRequestStatus(
        requestId,
        newStatus,
        editForm.admin_notes,
        editForm.admin_assigned_to,
        editForm.estimated_value ? parseFloat(editForm.estimated_value) : undefined
      );

      if (success) {
        await loadData();
        setEditingRequest(null);
        setEditForm({ status: '', admin_notes: '', admin_assigned_to: '', estimated_value: '' });
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.company && request.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      contacted: { color: 'bg-blue-100 text-blue-800', icon: Mail },
      quoted: { color: 'bg-purple-100 text-purple-800', icon: DollarSign },
      in_progress: { color: 'bg-orange-100 text-orange-800', icon: Wrench },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total_requests}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_requests}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_requests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">€{stats.total_estimated_value.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRequestDetails = (request: ImplementationRequest) => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {request.user_name}
              </CardTitle>
              <CardDescription>{request.user_email}</CardDescription>
            </div>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Company</Label>
              <p className="text-sm text-muted-foreground">{request.company || 'Not provided'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Timeline</Label>
              <p className="text-sm text-muted-foreground">{request.timeline}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Budget Range</Label>
              <p className="text-sm text-muted-foreground">{request.budget_range}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Automation Score</Label>
              <p className="text-sm text-muted-foreground">{request.automation_score || 'N/A'}/100</p>
            </div>
          </div>

          {request.preferred_tools && request.preferred_tools.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Preferred Tools</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {request.preferred_tools.map((tool, index) => (
                  <Badge key={index} variant="outline">{tool}</Badge>
                ))}
              </div>
            </div>
          )}

          {request.task_description && (
            <div>
              <Label className="text-sm font-medium">Task Description</Label>
              <p className="text-sm text-muted-foreground mt-1">{request.task_description}</p>
            </div>
          )}

          {request.subtasks && request.subtasks.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Subtasks</Label>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {request.subtasks.map((subtask, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{subtask}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Selected Workflows</Label>
              <p className="text-sm text-muted-foreground">{request.selected_workflow_ids.length}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Selected Agents</Label>
              <p className="text-sm text-muted-foreground">{request.selected_agent_ids.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(request.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {request.admin_notes && (
            <div>
              <Label className="text-sm font-medium">Admin Notes</Label>
              <p className="text-sm text-muted-foreground mt-1">{request.admin_notes}</p>
            </div>
          )}

          {request.estimated_value && (
            <div>
              <Label className="text-sm font-medium">Estimated Value</Label>
              <p className="text-sm text-muted-foreground">€{request.estimated_value.toLocaleString()}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingRequest(request);
                setEditForm({
                  status: request.status,
                  admin_notes: request.admin_notes || '',
                  admin_assigned_to: request.admin_assigned_to || '',
                  estimated_value: request.estimated_value?.toString() || ''
                });
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEditForm = () => {
    if (!editingRequest) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edit Request</CardTitle>
          <CardDescription>Update the status and details for this implementation request</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estimated_value">Estimated Value (€)</Label>
              <Input
                id="estimated_value"
                type="number"
                value={editForm.estimated_value}
                onChange={(e) => setEditForm(prev => ({ ...prev, estimated_value: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="admin_assigned_to">Assigned To</Label>
            <Input
              id="admin_assigned_to"
              value={editForm.admin_assigned_to}
              onChange={(e) => setEditForm(prev => ({ ...prev, admin_assigned_to: e.target.value }))}
              placeholder="Admin username or email"
            />
          </div>
          
          <div>
            <Label htmlFor="admin_notes">Admin Notes</Label>
            <Textarea
              id="admin_notes"
              value={editForm.admin_notes}
              onChange={(e) => setEditForm(prev => ({ ...prev, admin_notes: e.target.value }))}
              placeholder="Internal notes about this request..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate(editingRequest.id, editForm.status)}
            >
              Update Request
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingRequest(null);
                setEditForm({ status: '', admin_notes: '', admin_assigned_to: '', estimated_value: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading implementation requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Implementation Requests</h2>
          <p className="text-muted-foreground">Manage and track implementation requests from users</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {renderStats()}

      <Card>
        <CardHeader>
          <CardTitle>Request Management</CardTitle>
          <CardDescription>Search and filter implementation requests</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderEditForm()}

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No implementation requests have been submitted yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id}>
              {renderRequestDetails(request)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
