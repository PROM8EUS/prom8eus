import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Timer, 
  ThumbsUp, 
  DollarSign, 
  Check, 
  Users, 
  Send,
  Download,
  Workflow,
  Star,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { WorkflowIndex } from '@/lib/workflowIndexer';

interface WorkflowDetailModalProps {
  workflow: WorkflowIndex | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'de' | 'en';
  isAdmin?: boolean; // New prop to determine if we're in admin area
}

export default function WorkflowDetailModal({
  workflow,
  isOpen,
  onClose,
  lang = 'de',
  isAdmin = false
}: WorkflowDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupForm, setSetupForm] = useState({
    name: '',
    email: '',
    company: '',
    requirements: ''
  });

  if (!workflow) return null;

  const handleSetupRequest = () => {
    const subject = encodeURIComponent(`${lang === 'de' ? 'Einrichtungsanfrage' : 'Setup Request'}: ${workflow.name}`);
    const body = encodeURIComponent(`${lang === 'de' 
      ? `Hallo,\n\nich interessiere mich für die professionelle Einrichtung des Workflows "${workflow.name}".\n\nMeine Details:\n- Name: ${setupForm.name}\n- E-Mail: ${setupForm.email}\n- Firma: ${setupForm.company || 'Nicht angegeben'}\n\nWorkflow-Details:\n- Name: ${workflow.name}\n- Beschreibung: ${workflow.description}\n- Kategorie: ${workflow.category}\n- Nodes: ${workflow.nodeCount}\n- Trigger: ${workflow.triggerType}\n- Komplexität: ${workflow.complexity}\n- Integrationen: ${workflow.integrations.join(', ')}\n\nMeine Anforderungen:\n${setupForm.requirements}\n\nBitte kontaktieren Sie mich für weitere Details.\n\nMit freundlichen Grüßen\n${setupForm.name}`
      : `Hello,\n\nI am interested in the professional setup of the workflow "${workflow.name}".\n\nMy details:\n- Name: ${setupForm.name}\n- Email: ${setupForm.email}\n- Company: ${setupForm.company || 'Not specified'}\n\nWorkflow details:\n- Name: ${workflow.name}\n- Description: ${workflow.description}\n- Category: ${workflow.category}\n- Nodes: ${workflow.nodeCount}\n- Trigger: ${workflow.triggerType}\n- Complexity: ${workflow.complexity}\n- Integrations: ${workflow.integrations.join(', ')}\n\nMy requirements:\n${setupForm.requirements}\n\nPlease contact me for further details.\n\nBest regards\n${setupForm.name}`
    }`);
    window.open(`mailto:setup@prom8eus.com?subject=${subject}&body=${body}`, '_blank');
    setShowSetupForm(false);
    setSetupForm({name: '', email: '', company: '', requirements: ''});
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{workflow.category}</div>
          <div className="text-sm text-muted-foreground">
            {lang === 'de' ? 'Kategorie' : 'Category'}
          </div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">4-6h</div>
          <div className="text-sm text-muted-foreground">
            {lang === 'de' ? 'Zeitersparnis' : 'Time Savings'}
          </div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">200-300%</div>
          <div className="text-sm text-muted-foreground">
            {lang === 'de' ? 'Monatliche Einsparung' : 'Monthly Savings'}
          </div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{workflow.nodeCount}</div>
          <div className="text-sm text-muted-foreground">
            {lang === 'de' ? 'Komplexität' : 'Complexity'}
          </div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">150</div>
          <div className="text-sm text-muted-foreground">
            {lang === 'de' ? 'Verwendungen' : 'Uses'}
          </div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">4.5</div>
          <div className="text-sm text-muted-foreground">
            {lang === 'de' ? 'Bewertung' : 'Rating'}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-muted-foreground leading-relaxed">{workflow.description}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {workflow.tags.map((tag, index) => (
          <Badge key={index} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Use Cases */}
      <div>
        <h4 className="font-medium text-foreground mb-3">
          {lang === 'de' ? 'Anwendungsfälle' : 'Use Cases'}
        </h4>
        <div className="p-4 border rounded-lg">
          <h5 className="font-semibold mb-2">{workflow.name}</h5>
          <p className="text-sm text-muted-foreground mb-3">
            {lang === 'de' ? 'Automatisieren Sie den kompletten Prozess' : 'Automate the complete process'}
          </p>
          <div className="text-sm">
            <span className="font-medium">
              {lang === 'de' ? 'Potenzial: 85% Aufwand: Medium Zeitersparnis: 4-6 hours per employee' : 'Potential: 85% Effort: Medium Time Savings: 4-6 hours per employee'}
            </span>
          </div>
        </div>
      </div>

      {/* Professional Setup Section - Only show in frontend, not admin */}
      {!isAdmin && (
        <div className="p-6 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-3 text-purple-900">
              <Zap className="w-5 h-5 text-purple-600" />
              {lang === 'de' ? 'Professionelle Einrichtung' : 'Professional Setup'}
            </h4>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-700 hover:bg-purple-100 px-4"
              onClick={() => setShowSetupForm(!showSetupForm)}
            >
              {showSetupForm ? (lang === 'de' ? 'Abbrechen' : 'Cancel') : (lang === 'de' ? 'Anfragen' : 'Request')}
            </Button>
          </div>
          
          {!showSetupForm && (
            <div className="space-y-4">
              <p className="text-sm text-purple-700 leading-relaxed">
                {lang === 'de' 
                  ? 'Lassen Sie uns diese Automatisierung für Sie einrichten.'
                  : 'Let us set up this automation for you.'
                }
              </p>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                    <Timer className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">24h Setup</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                    <ThumbsUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {lang === 'de' ? 'Funktionsgarantie' : 'Functionality Guarantee'}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {lang === 'de' ? 'Geld zurück' : 'Money Back'}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {lang === 'de' ? 'Zahlung bei Erfolg' : 'Payment on Success'}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">30d Support</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-purple-100 rounded-xl mb-2 shadow-sm">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {lang === 'de' ? 'Sofort startklar' : 'Ready to Go'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {showSetupForm && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={lang === 'de' ? 'Name' : 'Name'}
                  value={setupForm.name}
                  onChange={(e) => setSetupForm({...setupForm, name: e.target.value})}
                />
                <Input
                  placeholder={lang === 'de' ? 'E-Mail' : 'Email'}
                  type="email"
                  value={setupForm.email}
                  onChange={(e) => setSetupForm({...setupForm, email: e.target.value})}
                />
              </div>
              <Input
                placeholder={lang === 'de' ? 'Firma (optional)' : 'Company (optional)'}
                value={setupForm.company}
                onChange={(e) => setSetupForm({...setupForm, company: e.target.value})}
              />
              <Textarea
                placeholder={lang === 'de' ? 'Ihre Anforderungen und Kontext...' : 'Your requirements and context...'}
                value={setupForm.requirements}
                onChange={(e) => setSetupForm({...setupForm, requirements: e.target.value})}
                rows={3}
              />
              <Button 
                className="w-full"
                onClick={handleSetupRequest}
                disabled={!setupForm.name || !setupForm.email}
              >
                <Send className="w-4 h-4 mr-2" />
                {lang === 'de' ? 'Anfrage senden' : 'Send Request'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderImplementation = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-foreground mb-3">
          {lang === 'de' ? 'Implementierungsschritte' : 'Implementation Steps'}
        </h4>
        <div className="space-y-3">
          {[
            lang === 'de' ? 'Workflow-Anforderungen und Voraussetzungen überprüfen' : 'Review workflow requirements and prerequisites',
            lang === 'de' ? 'Notwendige Integrationen und API-Schlüssel einrichten' : 'Set up necessary integrations and API keys',
            lang === 'de' ? 'Workflow-Parameter und Einstellungen konfigurieren' : 'Configure workflow parameters and settings',
            lang === 'de' ? 'Mit Beispieldaten oder Szenarien testen' : 'Test with sample data or scenarios',
            lang === 'de' ? 'In Produktionsumgebung bereitstellen' : 'Deploy to production environment',
            lang === 'de' ? 'Leistung überwachen und Feedback sammeln' : 'Monitor performance and gather feedback'
          ].map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-foreground mb-3">
          {lang === 'de' ? 'Integrationen' : 'Integrations'}
        </h4>
        <div className="space-y-3">
          {workflow.integrations.map((integration, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{integration}</div>
                  <div className="text-sm text-muted-foreground">
                    {lang === 'de' ? 'API-Integration' : 'API Integration'}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">
                {lang === 'de' ? 'Mittel' : 'Medium'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Workflow className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{workflow.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{workflow.category}</Badge>
                <Badge variant={workflow.complexity === 'High' ? 'default' : 'secondary'}>
                  {workflow.complexity}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">
              {lang === 'de' ? 'Übersicht' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="implementation">
              {lang === 'de' ? 'Implementierung' : 'Implementation'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="implementation" className="space-y-6">
            {renderImplementation()}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {lang === 'de' ? 'Workflow ID' : 'Workflow ID'}: {workflow.id}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href={`https://n8n.io/workflows/${workflow.id}`} target="_blank" rel="noopener noreferrer">
                <Workflow className="w-4 h-4 mr-2" />
                {lang === 'de' ? 'Auf n8n.io anzeigen' : 'View on n8n.io'}
              </a>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {lang === 'de' ? 'Workflow herunterladen' : 'Download Workflow'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
