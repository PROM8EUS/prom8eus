import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, Eye, EyeOff } from "lucide-react";

// Geheimer Admin-Schlüssel - in Produktion über Environment Variable setzen
const ADMIN_SECRET = "admin123"; // Ändern Sie diesen Wert!

interface AdminPanelProps {
  lang: "de" | "en";
  onAdminModeChange: (isAdmin: boolean) => void;
}

const AdminPanel = ({ lang, onAdminModeChange }: AdminPanelProps) => {
  const [adminKey, setAdminKey] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);

  const checkAdminKey = () => {
    if (adminKey === ADMIN_SECRET) {
      setIsAdmin(true);
      onAdminModeChange(true);
      loadAllAnalyses();
    } else {
      alert(lang === 'de' ? 'Falscher Admin-Schlüssel!' : 'Wrong admin key!');
    }
  };

  const loadAllAnalyses = () => {
    try {
      const historyData = localStorage.getItem('analysisHistory');
      if (historyData) {
        const parsedHistory = JSON.parse(historyData);
        setAnalyses(parsedHistory.sort((a: any, b: any) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const deleteAnalysis = (analysisId: string) => {
    if (!window.confirm(lang === 'de' ? 'Analyse wirklich löschen?' : 'Really delete analysis?')) {
      return;
    }

    try {
      // Remove from history
      const newAnalyses = analyses.filter(item => item.id !== analysisId);
      setAnalyses(newAnalyses);
      localStorage.setItem('analysisHistory', JSON.stringify(newAnalyses));
      
      // Remove the full analysis data
      localStorage.removeItem(analysisId);
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const clearAllAnalyses = () => {
    if (!window.confirm(lang === 'de' ? 'ALLE Analysen löschen? Diese Aktion kann nicht rückgängig gemacht werden!' : 'Delete ALL analyses? This action cannot be undone!')) {
      return;
    }

    try {
      // Remove all individual analysis data
      analyses.forEach(analysis => {
        localStorage.removeItem(analysis.id);
      });
      
      // Clear the history
      localStorage.removeItem('analysisHistory');
      setAnalyses([]);
    } catch (error) {
      console.error('Error clearing all analyses:', error);
    }
  };

  const exitAdminMode = () => {
    setIsAdmin(false);
    setAdminKey("");
    onAdminModeChange(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {lang === 'de' ? 'Admin-Zugang' : 'Admin Access'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={lang === 'de' ? 'Admin-Schlüssel eingeben...' : 'Enter admin key...'}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAdminKey()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Button onClick={checkAdminKey} className="w-full">
              {lang === 'de' ? 'Anmelden' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>{lang === 'de' ? 'Admin-Panel' : 'Admin Panel'}</CardTitle>
              <Badge variant="destructive">{lang === 'de' ? 'Admin-Modus' : 'Admin Mode'}</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={clearAllAnalyses}
                disabled={analyses.length === 0}
              >
                {lang === 'de' ? 'Alle löschen' : 'Delete All'}
              </Button>
              <Button variant="outline" onClick={exitAdminMode}>
                {lang === 'de' ? 'Beenden' : 'Exit'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {lang === 'de' 
                ? `${analyses.length} Analysen gefunden`
                : `${analyses.length} analyses found`
              }
            </div>
            
            {analyses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {lang === 'de' ? 'Keine Analysen vorhanden' : 'No analyses found'}
              </p>
            ) : (
              analyses.map((analysis) => (
                <Card key={analysis.id} className="border border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{analysis.jobTitle}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatDate(analysis.timestamp)}</span>
                          <span>{analysis.score}% {lang === 'de' ? 'Automatisierung' : 'Automation'}</span>
                          <span>{analysis.taskCount} {lang === 'de' ? 'Aufgaben' : 'Tasks'}</span>
                        </div>
                        {analysis.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {analysis.summary}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAnalysis(analysis.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;