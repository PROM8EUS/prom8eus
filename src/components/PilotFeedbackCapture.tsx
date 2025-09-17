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
import { Checkbox } from './ui/checkbox';
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
  Loader2
} from 'lucide-react';
import { 
  PilotFeedbackService, 
  SubmitFeedbackData, 
  PilotFeedback, 
  PilotFeedbackStats 
} from '../lib/solutions/pilotFeedbackService';

interface PilotFeedbackCaptureProps {
  solutionId: string;
  solutionType: 'workflow' | 'agent';
  solutionTitle: string;
  stepId?: string;
  stepTitle?: string;
  onFeedbackSubmitted?: (feedbackId: string) => void;
  className?: string;
}

export function PilotFeedbackCapture({
  solutionId,
  solutionType,
  solutionTitle,
  stepId,
  stepTitle,
  onFeedbackSubmitted,
  className
}: PilotFeedbackCaptureProps) {
  const [feedbackData, setFeedbackData] = useState<SubmitFeedbackData>({
    solution_id: solutionId,
    solution_type: solutionType,
    step_id: stepId,
    feedback_type: 'overall_rating',
    rating: undefined,
    feedback_text: '',
    is_helpful: undefined,
    difficulty_level: undefined,
    time_taken: undefined,
    completion_status: undefined,
    issues_encountered: [],
    suggestions: [],
    tools_used: [],
    additional_resources: []
  });

  const [userEmail, setUserEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentIssue, setCurrentIssue] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [currentTool, setCurrentTool] = useState('');
  const [currentResource, setCurrentResource] = useState('');
  const [stats, setStats] = useState<PilotFeedbackStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Initialize session
  useEffect(() => {
    const newSessionId = PilotFeedbackService.generateSessionId();
    setSessionId(newSessionId);
    
    // Start feedback session
    PilotFeedbackService.startFeedbackSession(newSessionId, solutionId, solutionType, userEmail)
      .catch(error => console.error('Error starting feedback session:', error));
  }, [solutionId, solutionType, userEmail]);

  // Load stats
  useEffect(() => {
    loadStats();
  }, [solutionId]);

  const loadStats = async () => {
    try {
      const feedbackStats = await PilotFeedbackService.getFeedbackStats(solutionId);
      setStats(feedbackStats);
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFeedbackData(prev => ({ ...prev, rating }));
  };

  const handleFeedbackTypeChange = (feedbackType: SubmitFeedbackData['feedback_type']) => {
    setFeedbackData(prev => ({ ...prev, feedback_type: feedbackType }));
  };

  const handleDifficultyChange = (difficulty: SubmitFeedbackData['difficulty_level']) => {
    setFeedbackData(prev => ({ ...prev, difficulty_level: difficulty }));
  };

  const handleCompletionStatusChange = (status: SubmitFeedbackData['completion_status']) => {
    setFeedbackData(prev => ({ ...prev, completion_status: status }));
  };

  const addIssue = () => {
    if (currentIssue.trim()) {
      setFeedbackData(prev => ({
        ...prev,
        issues_encountered: [...(prev.issues_encountered || []), currentIssue.trim()]
      }));
      setCurrentIssue('');
    }
  };

  const removeIssue = (index: number) => {
    setFeedbackData(prev => ({
      ...prev,
      issues_encountered: prev.issues_encountered?.filter((_, i) => i !== index) || []
    }));
  };

  const addSuggestion = () => {
    if (currentSuggestion.trim()) {
      setFeedbackData(prev => ({
        ...prev,
        suggestions: [...(prev.suggestions || []), currentSuggestion.trim()]
      }));
      setCurrentSuggestion('');
    }
  };

  const removeSuggestion = (index: number) => {
    setFeedbackData(prev => ({
      ...prev,
      suggestions: prev.suggestions?.filter((_, i) => i !== index) || []
    }));
  };

  const addTool = () => {
    if (currentTool.trim()) {
      setFeedbackData(prev => ({
        ...prev,
        tools_used: [...(prev.tools_used || []), currentTool.trim()]
      }));
      setCurrentTool('');
    }
  };

  const removeTool = (index: number) => {
    setFeedbackData(prev => ({
      ...prev,
      tools_used: prev.tools_used?.filter((_, i) => i !== index) || []
    }));
  };

  const addResource = () => {
    if (currentResource.trim()) {
      setFeedbackData(prev => ({
        ...prev,
        additional_resources: [...(prev.additional_resources || []), currentResource.trim()]
      }));
      setCurrentResource('');
    }
  };

  const removeResource = (index: number) => {
    setFeedbackData(prev => ({
      ...prev,
      additional_resources: prev.additional_resources?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const feedbackId = await PilotFeedbackService.submitFeedback({
        ...feedbackData,
        user_email: userEmail || undefined,
        session_id: sessionId
      });

      setIsSubmitted(true);
      onFeedbackSubmitted?.(feedbackId);
      
      // Reload stats
      await loadStats();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: SubmitFeedbackData['feedback_type']) => {
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

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Thank you for your feedback!</h3>
          <p className="text-muted-foreground mb-4">
            Your feedback has been submitted and will help us improve the implementation steps.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Submit Another Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Pilot Feedback
            </CardTitle>
            <CardDescription>
              Help us improve by sharing your experience with {stepTitle ? `"${stepTitle}"` : `"${solutionTitle}"`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showStats ? 'Hide' : 'Show'} Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics */}
        {showStats && stats && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">{stats.total_feedback_count}</div>
                  <div className="text-muted-foreground">Total Feedback</div>
                </div>
                <div>
                  <div className="font-medium">{stats.average_rating.toFixed(1)}</div>
                  <div className="text-muted-foreground">Avg Rating</div>
                </div>
                <div>
                  <div className="font-medium">{stats.completion_rate.toFixed(1)}%</div>
                  <div className="text-muted-foreground">Completion Rate</div>
                </div>
                <div>
                  <div className="font-medium">{stats.helpful_feedback_count}</div>
                  <div className="text-muted-foreground">Helpful</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* User Email */}
        <div className="space-y-2">
          <Label htmlFor="user-email">Email (Optional)</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="your@email.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
        </div>

        {/* Feedback Type */}
        <div className="space-y-2">
          <Label>Feedback Type</Label>
          <Select
            value={feedbackData.feedback_type}
            onValueChange={(value: any) => handleFeedbackTypeChange(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall_rating">📊 Overall Rating</SelectItem>
              <SelectItem value="step_quality">⭐ Step Quality</SelectItem>
              <SelectItem value="step_clarity">💡 Step Clarity</SelectItem>
              <SelectItem value="step_completeness">✅ Step Completeness</SelectItem>
              <SelectItem value="step_accuracy">🎯 Step Accuracy</SelectItem>
              <SelectItem value="suggestion">💭 Suggestion</SelectItem>
              <SelectItem value="issue">⚠️ Issue</SelectItem>
              <SelectItem value="success_story">🎉 Success Story</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <Label>Rating (1-5 stars)</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleRatingChange(rating)}
                className={`p-1 rounded transition-colors ${
                  feedbackData.rating && feedbackData.rating >= rating
                    ? 'text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Text */}
        <div className="space-y-2">
          <Label htmlFor="feedback-text">Feedback</Label>
          <Textarea
            id="feedback-text"
            placeholder="Share your experience, suggestions, or any issues you encountered..."
            value={feedbackData.feedback_text}
            onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback_text: e.target.value }))}
            rows={4}
          />
        </div>

        {/* Helpful */}
        <div className="space-y-2">
          <Label>Was this helpful?</Label>
          <div className="flex gap-4">
            <Button
              variant={feedbackData.is_helpful === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackData(prev => ({ ...prev, is_helpful: true }))}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Yes
            </Button>
            <Button
              variant={feedbackData.is_helpful === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackData(prev => ({ ...prev, is_helpful: false }))}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              No
            </Button>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4">
            <Separator />
            <h4 className="font-medium">Advanced Options</h4>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select
                value={feedbackData.difficulty_level || ''}
                onValueChange={(value: any) => handleDifficultyChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="too_easy">Too Easy</SelectItem>
                  <SelectItem value="just_right">Just Right</SelectItem>
                  <SelectItem value="too_hard">Too Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Taken */}
            <div className="space-y-2">
              <Label htmlFor="time-taken">Time Taken (minutes)</Label>
              <Input
                id="time-taken"
                type="number"
                placeholder="30"
                value={feedbackData.time_taken || ''}
                onChange={(e) => setFeedbackData(prev => ({ 
                  ...prev, 
                  time_taken: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
            </div>

            {/* Completion Status */}
            <div className="space-y-2">
              <Label>Completion Status</Label>
              <Select
                value={feedbackData.completion_status || ''}
                onValueChange={(value: any) => handleCompletionStatusChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select completion status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="partial">Partially Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="not_attempted">Not Attempted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Issues Encountered */}
            <div className="space-y-2">
              <Label>Issues Encountered</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe an issue..."
                  value={currentIssue}
                  onChange={(e) => setCurrentIssue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIssue()}
                />
                <Button onClick={addIssue} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {feedbackData.issues_encountered?.map((issue, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <span className="text-sm flex-1">{issue}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIssue(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <Label>Suggestions</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Share a suggestion..."
                  value={currentSuggestion}
                  onChange={(e) => setCurrentSuggestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSuggestion()}
                />
                <Button onClick={addSuggestion} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {feedbackData.suggestions?.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <span className="text-sm flex-1">{suggestion}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSuggestion(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools Used */}
            <div className="space-y-2">
              <Label>Tools Used</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tool you used..."
                  value={currentTool}
                  onChange={(e) => setCurrentTool(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTool()}
                />
                <Button onClick={addTool} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {feedbackData.tools_used?.map((tool, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <span className="text-sm flex-1">{tool}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTool(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Resources */}
            <div className="space-y-2">
              <Label>Additional Resources</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a resource you needed..."
                  value={currentResource}
                  onChange={(e) => setCurrentResource(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addResource()}
                />
                <Button onClick={addResource} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {feedbackData.additional_resources?.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <span className="text-sm flex-1">{resource}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeResource(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !feedbackData.rating}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
