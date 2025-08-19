import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User } from "lucide-react";

interface Task {
  id: string;
  name: string;
  score: number;
  category: 'automatisierbar' | 'mensch';
  description?: string;
}

interface TaskListProps {
  tasks: Task[];
}

const TaskList = ({ tasks }: TaskListProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">
        Identifizierte Aufgaben
      </h3>
      
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <Card 
            key={task.id} 
            className="hover:shadow-md transition-shadow duration-200"
            style={{ 
              animation: `fade-in 0.5s ease-out forwards`,
              animationDelay: `${index * 0.1}s`,
              opacity: 0
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Icon based on category */}
                  <div className={`p-2 rounded-full ${
                    task.category === 'automatisierbar' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {task.category === 'automatisierbar' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Task info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{task.name}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Score */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{task.score}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  
                  {/* Category badge */}
                  <Badge 
                    variant={task.category === 'automatisierbar' ? 'default' : 'destructive'}
                    className="capitalize"
                  >
                    {task.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskList;