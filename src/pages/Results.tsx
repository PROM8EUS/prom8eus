import { Button } from "@/components/ui/button";
import { Share2, BookOpen, ArrowLeft } from "lucide-react";
import ScoreCircle from "@/components/ScoreCircle";
import BarChart from "@/components/BarChart";
import TaskList from "@/components/TaskList";
import { useNavigate } from "react-router-dom";

// Mock data for demonstration
const mockTasks = [
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
  },
  {
    id: '5',
    name: 'Strategische Entscheidungen',
    score: 15,
    category: 'mensch' as const,
    description: 'Komplexe Entscheidungsfindung'
  },
  {
    id: '6',
    name: 'Kreative Konzeption',
    score: 25,
    category: 'mensch' as const,
    description: 'Entwicklung kreativer Lösungsansätze'
  }
];

const Results = () => {
  const navigate = useNavigate();
  
  const automatizableTasks = mockTasks.filter(task => task.category === 'automatisierbar').length;
  const humanTasks = mockTasks.filter(task => task.category === 'mensch').length;

  const handleShare = () => {
    // Navigate to landing page for sharing
    navigate('/landing');
  };

  const handleLearnMore = () => {
    // TODO: Navigate to workflows page
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
          </div>

          {/* Score Section */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ScoreCircle 
              score={72} 
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
            <TaskList tasks={mockTasks} />
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