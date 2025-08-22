import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  DollarSign,
  Zap,
  TrendingUp,
  Settings,
  Users
} from 'lucide-react';
import { SubtaskItem, Subtask } from './SubtaskItem';

interface SubtaskListProps {
  subtasks: Subtask[];
  lang?: 'de' | 'en';
  title?: string;
  compact?: boolean;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  lang = 'de',
  title,
  compact = false
}) => {
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);

  const getTotalAutomationPotential = () => {
    if (subtasks.length === 0) return 0;
    return Math.round(subtasks.reduce((sum, subtask) => sum + subtask.automationPotential, 0) / subtasks.length);
  };

  const getTotalTimeReduction = () => {
    return subtasks.reduce((sum, subtask) => sum + subtask.estimatedTimeReduction, 0);
  };

  const getHighPriorityCount = () => {
    return subtasks.filter(subtask => subtask.priority === 'high').length;
  };

  if (subtasks.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-muted-foreground">
        {lang === 'de' ? 'Keine Teilaufgaben verfügbar' : 'No subtasks available'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with metrics */}
      {title && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <h3 className={compact ? "text-sm font-medium" : "text-lg font-semibold"}>
              {title}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {subtasks.length}
            </Badge>
          </div>
          
          {!compact && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-100">
                <Zap className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-900">{getTotalAutomationPotential()}%</div>
                  <div className="text-xs text-green-600">{lang === 'de' ? 'Durchschnitt' : 'Average'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">-{getTotalTimeReduction()}h</div>
                  <div className="text-xs text-blue-600">{lang === 'de' ? 'Gesamt' : 'Total'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-100">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-red-900">{getHighPriorityCount()}</div>
                  <div className="text-xs text-red-600">{lang === 'de' ? 'Hoch' : 'High'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtask Items */}
      <div className="space-y-3">
        {subtasks.map((subtask, index) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            index={index}
            lang={lang}
            onSelect={compact ? undefined : setSelectedSubtask}
          />
        ))}
      </div>

      {/* Subtask Details Modal */}
      <Dialog open={!!selectedSubtask} onOpenChange={() => setSelectedSubtask(null)}>
        <DialogContent className="max-w-2xl">
          {selectedSubtask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  {selectedSubtask.title}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">
                    {lang === 'de' ? 'Übersicht' : 'Overview'}
                  </TabsTrigger>
                  <TabsTrigger value="automation">
                    {lang === 'de' ? 'Automatisierung' : 'Automation'}
                  </TabsTrigger>
                  <TabsTrigger value="implementation">
                    {lang === 'de' ? 'Umsetzung' : 'Implementation'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{lang === 'de' ? 'Beschreibung' : 'Description'}</h4>
                    <p className="text-sm text-muted-foreground">{selectedSubtask.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Kategorie' : 'Category'}</h4>
                      <Badge variant="outline">{selectedSubtask.category}</Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{lang === 'de' ? 'Priorität' : 'Priority'}</h4>
                      <Badge variant={selectedSubtask.priority === 'high' ? 'destructive' : 
                                    selectedSubtask.priority === 'medium' ? 'default' : 'secondary'}>
                        {selectedSubtask.priority === 'high' ? (lang === 'de' ? 'Hoch' : 'High') :
                         selectedSubtask.priority === 'medium' ? (lang === 'de' ? 'Mittel' : 'Medium') :
                         (lang === 'de' ? 'Niedrig' : 'Low')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{selectedSubtask.automationPotential}%</div>
                      <div className="text-xs text-green-600">
                        {lang === 'de' ? 'Automatisierbar' : 'Automatable'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{selectedSubtask.estimatedTimeReduction}h</div>
                      <div className="text-xs text-blue-600">
                        {lang === 'de' ? 'Zeitersparnis' : 'Time Saved'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        {selectedSubtask.complexity === 'low' ? (lang === 'de' ? 'Niedrig' : 'Low') :
                         selectedSubtask.complexity === 'medium' ? (lang === 'de' ? 'Mittel' : 'Medium') :
                         (lang === 'de' ? 'Hoch' : 'High')}
                      </div>
                      <div className="text-xs text-purple-600">
                        {lang === 'de' ? 'Komplexität' : 'Complexity'}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="automation" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{lang === 'de' ? 'Empfohlene Tools' : 'Recommended Tools'}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubtask.tools.map((tool) => (
                        <Badge key={tool} variant="secondary">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">{lang === 'de' ? 'Automatisierungsschritte' : 'Automation Steps'}</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>{lang === 'de' ? 'Aktuelle Prozesse dokumentieren' : 'Document current processes'}</li>
                      <li>{lang === 'de' ? 'Tools auswählen und konfigurieren' : 'Select and configure tools'}</li>
                      <li>{lang === 'de' ? 'Automatisierung testen' : 'Test automation'}</li>
                      <li>{lang === 'de' ? 'Workflow aktivieren' : 'Activate workflow'}</li>
                    </ol>
                  </div>
                </TabsContent>

                <TabsContent value="implementation" className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {lang === 'de' ? 'Implementierungshinweise' : 'Implementation Notes'}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                      <li>{lang === 'de' ? 'Beginnen Sie mit einer Testumgebung' : 'Start with a test environment'}</li>
                      <li>{lang === 'de' ? 'Schulen Sie das Team vor der Einführung' : 'Train the team before deployment'}</li>
                      <li>{lang === 'de' ? 'Überwachen Sie die Leistung regelmäßig' : 'Monitor performance regularly'}</li>
                      <li>{lang === 'de' ? 'Dokumentieren Sie alle Änderungen' : 'Document all changes'}</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">{lang === 'de' ? 'Geschätzter Aufwand' : 'Estimated Effort'}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{lang === 'de' ? 'Einrichtungszeit:' : 'Setup time:'}</span>
                        <span className="ml-2">{selectedSubtask.estimatedTimeReduction * 0.5}h</span>
                      </div>
                      <div>
                        <span className="font-medium">{lang === 'de' ? 'Testphase:' : 'Testing phase:'}</span>
                        <span className="ml-2">{selectedSubtask.estimatedTimeReduction * 0.3}h</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
