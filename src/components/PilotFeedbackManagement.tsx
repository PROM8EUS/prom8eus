import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Lightbulb,
  Bug,
  Trophy,
  Target,
  Eye,
  EyeOff,
  Send,
  Save,
  X,
  Plus,
  Minus,
  Timer,
  User,
  Mail,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2,
  Filter,
  Search,
  Download,
  RefreshCw,
  Bot,
  Workflow,
  Tag,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import { 
  PilotFeedbackService, 
  PilotFeedback, 
  PilotFeedbackStats,
  PilotFeedbackAnalytics,
  PilotFeedbackSession
} from '../lib/solutions/pilotFeedbackService';

interface PilotFeedbackManagementProps {
  className?: string;
}

export function PilotFeedbackManagement({ className }: PilotFeedbackManagementProps) {
  const [feedback, setFeedback] = useState<PilotFeedback[]>([]);
  const [sessions, setSessions] = useState<PilotFeedbackSession[]>([]);
  const [analytics, setAnalytics] = useState<PilotFeedbackAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSolution, setSelectedSolution] = useState<string>('__ALL__');
  const [filterType, setFilterType] = useState<'all' | 'workflow' | 'agent'>('all');
  const [filterFeedbackType, setFilterFeedbackType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'rating' | 'solution_id'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [selectedFeedback, setSelectedFeedback] = useState<PilotFeedback | null>(null);

  // Load feedback data
  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      
      // Load analytics for all solutions
      const analyticsData = await PilotFeedbackService.getFeedbackAnalytics();
      setAnalytics(analyticsData);
      
      // Load recent feedback
      const recentFeedback = await PilotFeedbackService.getRecentFeedback('', 50);
      setFeedback(recentFeedback);
      
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load feedback for specific solution
  const loadSolutionFeedback = async (solutionId: string) => {
    try {
      const solutionFeedback = await PilotFeedbackService.getAllFeedback(solutionId);
      setFeedback(solutionFeedback);
      
      const solutionSessions = await PilotFeedbackService.getFeedbackSessions(solutionId);
      setSessions(solutionSessions);
    } catch (error) {
      console.error('Error loading solution feedback:', error);
    }
  };

  // Filter and sort feedback
  const filteredFeedback = feedback
    .filter(item => {
      if (filterType !== 'all' && item.solution_type !== filterType) return false;
      if (filterFeedbackType !== 'all' && item.feedback_type !== filterFeedbackType) return false;
      if (filterRating !== 'all' && item.rating?.toString() !== filterRating) return false;
      if (searchQuery && !item.feedback_text?.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !item.solution_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'solution_id':
          comparison = a.solution_id.localeCompare(b.solution_id);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get unique solutions from feedback
  const uniqueSolutions = Array.from(new Set(feedback.map(item => item.solution_id)));

  // Get feedback type icon
  const getFeedbackTypeIcon = (type: PilotFeedback['feedback_type']) => {
    const icons = {
      'step_quality': '⭐',
      'step_clarity': '💡',
      'step_completeness': '✅',
      'step_accuracy': '🎯',
      'overall_rating': '📊',
      'suggestion': '💭',
      'issue': '⚠️',
      'success_story': '🎉'
    };
    return icons[type] || '📝';
  };

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: PilotFeedback['difficulty_level']) => {
    const colors = {
      'too_easy': 'text-green-600',
      'just_right': 'text-blue-600',
      'too_hard': 'text-red-600'
    };
    return colors[difficulty] || 'text-gray-600';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load data on component mount
  useEffect(() => {
    loadFeedback();
  }, []);

  // Load solution-specific data when solution is selected
  useEffect(() => {
    if (selectedSolution && selectedSolution !== '__ALL__') {
      loadSolutionFeedback(selectedSolution);
    } else {
      loadFeedback();
    }
  }, [selectedSolution]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading pilot feedback...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pilot Feedback Management</h2>
          <p className="text-muted-foreground">
            Monitor and analyze pilot user feedback on implementation steps
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadFeedback}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{feedback.length}</div>
                <div className="text-sm text-muted-foreground">Total Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {feedback.length > 0 
                    ? (feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.filter(item => item.rating).length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {feedback.filter(item => item.is_helpful === true).length}
                </div>
                <div className="text-sm text-muted-foreground">Helpful</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {feedback.filter(item => item.feedback_type === 'issue').length}
                </div>
                <div className="text-sm text-muted-foreground">Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={selectedSolution} onValueChange={setSelectedSolution}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Solutions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All Solutions</SelectItem>
                {uniqueSolutions.map(solutionId => (
                  <SelectItem key={solutionId} value={solutionId}>
                    {solutionId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workflow">Workflows</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterFeedbackType} onValueChange={setFilterFeedbackType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Feedback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="overall_rating">Overall Rating</SelectItem>
                <SelectItem value="step_quality">Step Quality</SelectItem>
                <SelectItem value="step_clarity">Step Clarity</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="success_story">Success Story</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'analytics' ? 'default' : 'outline'}
                onClick={() => setViewMode('analytics')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="list">Feedback List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Feedback List */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback ({filteredFeedback.length})</CardTitle>
              <CardDescription>
                Recent pilot feedback on implementation steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredFeedback.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFeedback?.id === item.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFeedback(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getFeedbackTypeIcon(item.feedback_type)}</span>
                          <Badge variant="secondary">
                            {PilotFeedbackService.getFeedbackTypeDisplayName(item.feedback_type)}
                          </Badge>
                          <Badge variant="outline">
                            {item.solution_type === 'workflow' ? (
                              <Workflow className="h-3 w-3 mr-1" />
                            ) : (
                              <Bot className="h-3 w-3 mr-1" />
                            )}
                            {item.solution_type}
                          </Badge>
                          {item.rating && (
                            <div className={`flex items-center gap-1 ${getRatingColor(item.rating)}`}>
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-sm font-medium">{item.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Solution: {item.solution_id} • {formatDate(item.created_at)}
                        </div>
                        {item.feedback_text && (
                          <p className="text-sm line-clamp-2">{item.feedback_text}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {item.is_helpful !== undefined && (
                            <Badge variant={item.is_helpful ? 'default' : 'secondary'}>
                              {item.is_helpful ? (
                                <ThumbsUp className="h-3 w-3 mr-1" />
                              ) : (
                                <ThumbsDown className="h-3 w-3 mr-1" />
                              )}
                              {item.is_helpful ? 'Helpful' : 'Not Helpful'}
                            </Badge>
                          )}
                          {item.difficulty_level && (
                            <Badge variant="outline" className={getDifficultyColor(item.difficulty_level)}>
                              {PilotFeedbackService.getDifficultyLevelDisplayName(item.difficulty_level)}
                            </Badge>
                          )}
                          {item.completion_status && (
                            <Badge variant="outline">
                              {PilotFeedbackService.getCompletionStatusDisplayName(item.completion_status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredFeedback.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No feedback found matching your filters
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Details */}
          {selectedFeedback && (
            <Card>
              <CardHeader>
                <CardTitle>Feedback Details</CardTitle>
                <CardDescription>
                  Detailed view of selected feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Feedback Type</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFeedbackTypeIcon(selectedFeedback.feedback_type)}</span>
                      <span>{PilotFeedbackService.getFeedbackTypeDisplayName(selectedFeedback.feedback_type)}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Solution</Label>
                    <div className="flex items-center gap-2">
                      {selectedFeedback.solution_type === 'workflow' ? (
                        <Workflow className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span>{selectedFeedback.solution_id}</span>
                    </div>
                  </div>
                </div>
                
                {selectedFeedback.rating && (
                  <div>
                    <Label>Rating</Label>
                    <div className={`flex items-center gap-1 ${getRatingColor(selectedFeedback.rating)}`}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-5 w-5 ${rating <= selectedFeedback.rating! ? 'fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 font-medium">{selectedFeedback.rating}/5</span>
                    </div>
                  </div>
                )}

                {selectedFeedback.feedback_text && (
                  <div>
                    <Label>Feedback Text</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{selectedFeedback.feedback_text}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedFeedback.difficulty_level && (
                    <div>
                      <Label>Difficulty Level</Label>
                      <div className={getDifficultyColor(selectedFeedback.difficulty_level)}>
                        {PilotFeedbackService.getDifficultyLevelDisplayName(selectedFeedback.difficulty_level)}
                      </div>
                    </div>
                  )}
                  {selectedFeedback.time_taken && (
                    <div>
                      <Label>Time Taken</Label>
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        <span>{selectedFeedback.time_taken} minutes</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedFeedback.issues_encountered && selectedFeedback.issues_encountered.length > 0 && (
                  <div>
                    <Label>Issues Encountered</Label>
                    <div className="space-y-1">
                      {selectedFeedback.issues_encountered.map((issue, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded text-sm">
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFeedback.suggestions && selectedFeedback.suggestions.length > 0 && (
                  <div>
                    <Label>Suggestions</Label>
                    <div className="space-y-1">
                      {selectedFeedback.suggestions.map((suggestion, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFeedback.tools_used && selectedFeedback.tools_used.length > 0 && (
                  <div>
                    <Label>Tools Used</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedFeedback.tools_used.map((tool, index) => (
                        <Badge key={index} variant="secondary">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Submitted: {formatDate(selectedFeedback.created_at)}
                  {selectedFeedback.user_email && ` • Email: ${selectedFeedback.user_email}`}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.map((analytic) => (
              <Card key={analytic.solution_id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {analytic.solution_type === 'workflow' ? (
                      <Workflow className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                    {analytic.solution_id}
                  </CardTitle>
                  <CardDescription>
                    {analytic.solution_type === 'workflow' ? 'Workflow' : 'AI Agent'} Analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analytic.total_feedback_count}</div>
                      <div className="text-sm text-muted-foreground">Total Feedback</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analytic.average_rating.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Avg Rating</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="text-sm font-medium">{analytic.completion_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytic.completion_rate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-green-500" />
                      <span>{analytic.helpful_feedback_count} Helpful</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bug className="h-3 w-3 text-red-500" />
                      <span>{analytic.issue_count} Issues</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-yellow-500" />
                      <span>{analytic.suggestion_count} Suggestions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-purple-500" />
                      <span>{analytic.success_story_count} Success Stories</span>
                    </div>
                  </div>

                  {analytic.average_time_taken > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold">{analytic.average_time_taken.toFixed(0)}m</div>
                      <div className="text-sm text-muted-foreground">Avg Time</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
