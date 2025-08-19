import { Button } from "@/components/ui/button";
import { Share2, BookOpen, ArrowLeft } from "lucide-react";
import ScoreCircle from "@/components/ScoreCircle";
import BarChart from "@/components/BarChart";
import TaskList from "@/components/TaskList";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface AnalysisTask {
  text: string;
  score: number;
  label: "Automatisierbar" | "Mensch";
  category: string;
  confidence: number;
}

interface AnalysisResult {
  totalScore: number;
  ratio: {
    automatisierbar: number;
    mensch: number;
  };
  tasks: AnalysisTask[];
  summary: string;
  recommendations: string[];
  originalText?: string;
}

interface TaskForDisplay {
  id: string;
  name: string;
  score: number;
  category: 'automatisierbar' | 'mensch';
  description: string;
}

// Fallback mock data
const mockTasks: TaskForDisplay[] = [
  {
    id: '1',
    name: 'Datenerfassung und -eingabe',
    score: 95,
    category: 'automatisierbar' as const,
    description: 'Strukturierte Dateneingabe in Systeme'
  },
  {
    id: '2',
    name: 'Berichtserstellung',
    score: 88,
    category: 'automatisierbar' as const,
    description: 'Automatische Generierung von Standardberichten'
  },
  {
    id: '3',
    name: 'Terminplanung',
    score: 82,
    category: 'automatisierbar' as const,
    description: 'Koordination und Verwaltung von Terminen'
  },
  {
    id: '4',
    name: 'Kundenberatung',
    score: 35,
    category: 'mensch' as const,
    description: 'Persönliche Beratung und Problemlösung'
  }
];

const Results = () => {
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [displayTasks, setDisplayTasks] = useState<TaskForDisplay[]>(mockTasks);

  useEffect(() => {
    // Try to load real analysis results from sessionStorage
    try {
      const storedResult = sessionStorage.getItem('analysisResult');
      console.log('Stored analysis result:', storedResult);
      
      if (storedResult) {
        const parsedResult: AnalysisResult = JSON.parse(storedResult);
        console.log('Parsed analysis result:', parsedResult);
        setAnalysisData(parsedResult);

        // Transform backend tasks to display format
        if (parsedResult.tasks && parsedResult.tasks.length > 0) {
          const transformedTasks: TaskForDisplay[] = parsedResult.tasks.map((task, index) => ({
            id: String(index + 1),
            name: task.text.length > 60 ? task.text.substring(0, 60) + '...' : task.text,
            score: Math.round(task.score),
            category: task.label === 'Automatisierbar' ? 'automatisierbar' : 'mensch',
            description: `${task.category} (Confidence: ${Math.round(task.confidence)}%)`
          }));
          
          console.log('Transformed tasks:', transformedTasks);
          setDisplayTasks(transformedTasks);
        }
      } else {
        console.log('No stored analysis result found, using mock data');
      }
    } catch (error) {
      console.error('Error loading analysis results:', error);
      // Keep using mock data as fallback
    }
  }, []);
  
  const automatizableTasks = displayTasks.filter(task => task.category === 'automatisierbar').length;
  const humanTasks = displayTasks.filter(task => task.category === 'mensch').length;
  const totalScore = analysisData?.totalScore || 72;

  const handleShare = () => {
    navigate('/landing');
  };

  const handleLearnMore = () => {
    console.log('Learn more about workflows...');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-6 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </Button>
          
          <div className="text-xl font-bold text-primary">PROM8EUS</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Title */}
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Ihre Automatisierungs-Analyse
            </h1>
            <p className="text-xl text-muted-foreground">
              Detaillierte Auswertung Ihrer Aufgabenbeschreibung
            </p>
            {analysisData && (
              <p className="text-sm text-muted-foreground mt-2">
                {analysisData.summary}
              </p>
            )}
          </div>

          {/* Score Section */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ScoreCircle 
              score={totalScore} 
              maxScore={100} 
              label="Automatisierungspotenzial" 
            />
          </div>

          {/* Bar Chart */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <BarChart 
              automatizable={automatizableTasks} 
              humanRequired={humanTasks} 
            />
          </div>

          {/* Task List */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <TaskList tasks={displayTasks} />
          </div>


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <Button 
              onClick={handleShare}
              size="lg"
              className="flex items-center space-x-2 px-8"
            >
              <Share2 className="w-5 h-5" />
              <span>Landingpage teilen</span>
            </Button>
            
            <Button 
              variant="secondary"
              onClick={handleLearnMore}
              size="lg"
              className="flex items-center space-x-2 px-8"
            >
              <BookOpen className="w-5 h-5" />
              <span>Mehr über Workflows erfahren</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;