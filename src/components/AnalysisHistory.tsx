import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BarChart3, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n/i18n";

interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  score: number;
  jobTitle: string;
  taskCount: number;
  summary: string;
}

interface AnalysisHistoryProps {
  lang: "de" | "en";
  isAdminMode?: boolean;
}

const AnalysisHistory = ({ lang, isAdminMode = false }: AnalysisHistoryProps) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const historyData = localStorage.getItem('analysisHistory');
      if (historyData) {
        const parsedHistory: AnalysisHistoryItem[] = JSON.parse(historyData);
        // Sort by timestamp, most recent first
        setHistory(parsedHistory.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const loadAnalysis = (historyItem: AnalysisHistoryItem) => {
    // Load the full analysis data from localStorage
    try {
      const fullData = localStorage.getItem(historyItem.id);
      if (fullData) {
        // Store in sessionStorage for results page
        sessionStorage.setItem('analysisResult', fullData);
        navigate('/results');
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  };

  const deleteAnalysis = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Attempting to delete analysis:', itemId);
    
    try {
      // Remove from history
      const newHistory = history.filter(item => item.id !== itemId);
      console.log('New history length:', newHistory.length);
      setHistory(newHistory);
      localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
      
      // Remove the full analysis data
      localStorage.removeItem(itemId);
      console.log('Analysis deleted successfully');
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `${t(lang, 'history_today')} ${date.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${t(lang, 'history_yesterday')} ${date.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-4xl mx-auto mt-16 px-6 mb-20">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t(lang, 'history_title')}
          </h2>
          <p className="text-muted-foreground">
            {t(lang, 'history_subtitle')}
          </p>
        </div>

        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {history.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
              onClick={() => loadAnalysis(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {item.jobTitle}
                        </h3>
                        <span className="text-sm font-semibold text-primary">
                          {item.score}%
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.timestamp)}</span>
                        </span>
                        <span>
                          {item.taskCount} {t(lang, 'history_tasks')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isAdminMode && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => deleteAnalysis(e, item.id)}
                      className="flex-shrink-0"
                      aria-label={t(lang, 'history_delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {!isAdminMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteAnalysis(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 hover:bg-destructive/20 hover:text-destructive"
                      aria-label={t(lang, 'history_delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnalysisHistory;