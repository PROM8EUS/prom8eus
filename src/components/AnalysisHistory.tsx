import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BarChart3, Trash2, Users, Eye, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n/i18n";
import ScoreCircle from "./ScoreCircle";
import { generateDemoAnalyses, getDemoAnalysisData } from "@/lib/demoData";

interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  score: number;
  jobTitle: string;
  taskCount: number;
  summary: string;
  isPublic?: boolean;
  views?: number;
  author?: string;
}

interface AnalysisHistoryProps {
  lang: "de" | "en";
  onClearAll?: () => void;
}

const AnalysisHistory = ({ lang }: AnalysisHistoryProps) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [publicAnalyses, setPublicAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [displayedCount, setDisplayedCount] = useState(8);
  const [showPublic, setShowPublic] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
    loadPublicAnalyses();
  }, []);

  const loadHistory = () => {
    try {
      const historyData = localStorage.getItem('analysisHistory');
      if (historyData) {
        const parsedHistory: AnalysisHistoryItem[] = JSON.parse(historyData);
        // Sort by timestamp, most recent first
        const sortedHistory = parsedHistory.sort((a, b) => b.timestamp - a.timestamp);
        
        // Remove duplicates based on content (jobTitle, score, taskCount)
        const uniqueHistory = sortedHistory.filter((item, index, self) => 
          index === self.findIndex(t => 
            t.jobTitle === item.jobTitle && 
            t.score === item.score && 
            t.taskCount === item.taskCount
          )
        );
        
        setHistory(uniqueHistory);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const loadPublicAnalyses = () => {
    try {
      // Load all analysis histories from localStorage
      const allAnalyses: AnalysisHistoryItem[] = [];
      
      // Get all localStorage keys that start with 'analysisHistory'
      const keys = Object.keys(localStorage);
      const historyKeys = keys.filter(key => key === 'analysisHistory' || key.startsWith('analysisHistory_'));
      
      historyKeys.forEach(key => {
        try {
          const historyData = localStorage.getItem(key);
          if (historyData) {
            const parsedHistory: AnalysisHistoryItem[] = JSON.parse(historyData);
            // Filter for public analyses and add metadata
            const publicItems = parsedHistory
              .filter(item => item.isPublic !== false) // Default to public if not specified
              .map(item => ({
                ...item,
                author: key === 'analysisHistory' ? 'Anonymous' : key.replace('analysisHistory_', ''),
                views: item.views || 0,
                isPublic: item.isPublic !== false
              }));
            allAnalyses.push(...publicItems);
          }
        } catch (error) {
          console.error('Error parsing history from key:', key, error);
        }
      });
      
      // Sort by timestamp, most recent first
      let sortedAnalyses = allAnalyses.sort((a, b) => b.timestamp - a.timestamp);
      
      // Remove duplicates based on content (jobTitle, score, taskCount)
      const uniqueAnalyses = sortedAnalyses.filter((item, index, self) => 
        index === self.findIndex(t => 
          t.jobTitle === item.jobTitle && 
          t.score === item.score && 
          t.taskCount === item.taskCount
        )
      );
      
      // If no public analyses found, add demo data
      if (uniqueAnalyses.length === 0) {
        const demoAnalyses = generateDemoAnalyses();
        sortedAnalyses = demoAnalyses;
      } else {
        sortedAnalyses = uniqueAnalyses;
      }
      
      setPublicAnalyses(sortedAnalyses);
    } catch (error) {
      console.error('Error loading public analyses:', error);
    }
  };

  const loadAnalysis = (historyItem: AnalysisHistoryItem) => {
    // Load the full analysis data from localStorage
    try {
      // Try to load the full analysis data from localStorage first
      let fullData = localStorage.getItem(historyItem.id);
      
      // If not found in localStorage, try demo data
      if (!fullData && historyItem.id.startsWith('demo_')) {
        const demoData = getDemoAnalysisData(historyItem.id);
        if (demoData) {
          fullData = JSON.stringify(demoData);
        }
      }
      
      if (fullData) {
        // Store in sessionStorage for results page
        sessionStorage.setItem('analysisResult', fullData);
        
        // Increment view count for public analyses
        if (historyItem.isPublic) {
          incrementViewCount(historyItem.id);
        }
        
        navigate('/results');
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  };

  const incrementViewCount = (analysisId: string) => {
    try {
      // Find and update the view count in the appropriate history
      const keys = Object.keys(localStorage);
      const historyKeys = keys.filter(key => key === 'analysisHistory' || key.startsWith('analysisHistory_'));
      
      historyKeys.forEach(key => {
        try {
          const historyData = localStorage.getItem(key);
          if (historyData) {
            const parsedHistory: AnalysisHistoryItem[] = JSON.parse(historyData);
            const updatedHistory = parsedHistory.map(item => {
              if (item.id === analysisId) {
                return { ...item, views: (item.views || 0) + 1 };
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(updatedHistory));
          }
        } catch (error) {
          console.error('Error updating view count for key:', key, error);
        }
      });
      
      // Update local state
      setPublicAnalyses(prev => prev.map(item => 
        item.id === analysisId 
          ? { ...item, views: (item.views || 0) + 1 }
          : item
      ));
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const clearAllAnalyses = () => {
    if (!window.confirm(lang === 'de' ? 'ALLE Analysen löschen? Diese Aktion kann nicht rückgängig gemacht werden!' : 'Delete ALL analyses? This action cannot be undone!')) {
      return;
    }

    try {
      // Remove all individual analysis data
      history.forEach(analysis => {
        localStorage.removeItem(analysis.id);
      });
      
      // Clear the history
      localStorage.removeItem('analysisHistory');
      setHistory([]);
      
      if (onClearAll) {
        onClearAll();
      }
    } catch (error) {
      console.error('Error clearing all analyses:', error);
    }
  };

  const deleteAnalysis = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!window.confirm(lang === 'de' ? 'Analyse wirklich löschen?' : 'Really delete analysis?')) {
      return;
    }
    
    try {
      // Remove from history
      const newHistory = history.filter(item => item.id !== itemId);
      setHistory(newHistory);
      localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
      
      // Remove the full analysis data
      localStorage.removeItem(itemId);
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const loadMore = () => {
    console.log('Load more clicked. Current:', displayedCount, 'Total:', history.length);
    setDisplayedCount(prev => {
      const newCount = prev + 8;
      console.log('New count will be:', newCount);
      return newCount;
    });
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

  if (history.length === 0 && publicAnalyses.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-4xl mx-auto mt-16 px-6 mb-20">
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {t(lang, 'history_title')}
              </h2>
              <p className="text-muted-foreground">
                {t(lang, 'history_subtitle')}
              </p>
            </div>
          </div>
          
          {/* Tabs for switching between own and public analyses */}
          <div className="flex justify-center mt-6">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setShowPublic(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !showPublic 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(lang, 'my_analyses')} ({history.length})
              </button>
              <button
                onClick={() => setShowPublic(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showPublic 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(lang, 'public_analyses')} ({publicAnalyses.length})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(showPublic ? publicAnalyses : history).slice(0, displayedCount).map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
              onClick={() => loadAnalysis(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <ScoreCircle 
                        score={item.score} 
                        maxScore={100} 
                        label="" 
                        variant="small"
                        lang={lang}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {item.jobTitle}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.timestamp)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>{item.taskCount} {t(lang, 'history_tasks')}</span>
                        </span>
                        {showPublic && item.views !== undefined && (
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{item.views}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Load More Button */}
        {displayedCount < history.length && (
          <div className="flex justify-center mt-6">
            <Button 
              onClick={loadMore}
              variant="outline"
              className="px-8"
            >
              {lang === 'de' ? 'Weitere laden' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AnalysisHistory;