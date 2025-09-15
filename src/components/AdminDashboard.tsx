import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Bot,
  Settings,
  RefreshCw,
  Database
} from 'lucide-react';
import AITestModal from './AITestModal';

interface AdminDashboardProps {
  lang: 'de' | 'en';
}

export default function AdminDashboard({ lang }: AdminDashboardProps) {
  const [showAITest, setShowAITest] = useState(false);

  // Mock data - in production, this would come from an API
  const stats = {
    totalUsers: 1247,
    totalAnalyses: 8934,
    activeWorkflows: 156,
    systemHealth: 'healthy'
  };

  const recentActivity = [
    {
      id: 1,
      type: 'analysis',
      description: lang === 'de' ? 'Neue Stellenbeschreibung analysiert' : 'New job description analyzed',
      timestamp: '2 Minuten',
      status: 'success'
    },
    {
      id: 2,
      type: 'user',
      description: lang === 'de' ? 'Neuer Benutzer registriert' : 'New user registered',
      timestamp: '5 Minuten',
      status: 'success'
    },
    {
      id: 3,
      type: 'workflow',
      description: lang === 'de' ? 'Workflow-Automatisierung erstellt' : 'Workflow automation created',
      timestamp: '12 Minuten',
      status: 'success'
    },
    {
      id: 4,
      type: 'error',
      description: lang === 'de' ? 'API-Fehler behoben' : 'API error resolved',
      timestamp: '1 Stunde',
      status: 'warning'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {lang === 'de' ? 'Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-600">
            {lang === 'de' 
              ? 'Übersicht über System-Statistiken und Verwaltung' 
              : 'System statistics and management overview'
            }
          </p>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="space-y-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {lang === 'de' ? 'Willkommen im Admin Panel' : 'Welcome to Admin Panel'}
            </h2>
            <p className="text-gray-600">
              {lang === 'de' 
                ? 'Verwalten Sie Ihre Prom8eus-Anwendung und überwachen Sie die Systemleistung.'
                : 'Manage your Prom8eus application and monitor system performance.'
              }
            </p>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === 'de' ? 'Benutzer' : 'Users'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% {lang === 'de' ? 'von letztem Monat' : 'from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === 'de' ? 'Analysen' : 'Analyses'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +8% {lang === 'de' ? 'von letztem Monat' : 'from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === 'de' ? 'Aktive Workflows' : 'Active Workflows'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +3 {lang === 'de' ? 'diese Woche' : 'this week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === 'de' ? 'System Status' : 'System Status'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
              {lang === 'de' ? 'Alle Systeme funktionieren' : 'All systems operational'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            {lang === 'de' ? 'Letzte Aktivitäten' : 'Recent Activity'}
          </CardTitle>
          <CardDescription>
            {lang === 'de' 
              ? 'Übersicht der letzten Systemaktivitäten'
              : 'Overview of recent system activities'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(activity.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lang === 'de' ? 'vor' : 'ago'} {activity.timestamp}
                    </p>
                  </div>
                </div>
                <StatusBadge status={activity.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {lang === 'de' ? 'Schnellaktionen' : 'Quick Actions'}
          </CardTitle>
          <CardDescription>
            {lang === 'de' 
              ? 'Häufig verwendete Verwaltungsfunktionen'
              : 'Frequently used administrative functions'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium mb-2">
                {lang === 'de' ? 'System-Logs' : 'System Logs'}
              </h4>
              <p className="text-sm text-gray-600">
                {lang === 'de' 
                  ? 'Fehler und Warnungen überprüfen'
                  : 'Check errors and warnings'
                }
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium mb-2">
                {lang === 'de' ? 'Daten-Backup' : 'Data Backup'}
              </h4>
              <p className="text-sm text-gray-600">
                {lang === 'de' 
                  ? 'Sicherungskopie erstellen'
                  : 'Create backup copy'
                }
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium mb-2">
                {lang === 'de' ? 'API-Status' : 'API Status'}
              </h4>
              <p className="text-sm text-gray-600">
                {lang === 'de' 
                  ? 'Externe Services prüfen'
                  : 'Check external services'
                }
              </p>
            </div>
            <div 
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => setShowAITest(true)}
            >
              <h4 className="font-medium mb-2 flex items-center">
                <Bot className="w-4 h-4 mr-2" />
                {lang === 'de' ? 'AI-Test' : 'AI Test'}
              </h4>
              <p className="text-sm text-gray-600">
                {lang === 'de' 
                  ? 'OpenAI-Verbindung testen'
                  : 'Test OpenAI connection'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* System Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {lang === 'de' ? 'System-Verwaltung' : 'System Management'}
            </CardTitle>
            <CardDescription>
              {lang === 'de' 
                ? 'Verwalten Sie System-Quellen und AI-Integrationen'
                : 'Manage system sources and AI integrations'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-medium mb-2 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  {lang === 'de' ? 'Datenquellen' : 'Data Sources'}
                </h4>
                <p className="text-sm text-gray-600">
                  {lang === 'de' 
                    ? 'Workflow- und AI-Agent-Quellen verwalten'
                    : 'Manage workflow and AI agent sources'
                  }
                </p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h4 className="font-medium mb-2 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {lang === 'de' ? 'System-Status' : 'System Status'}
                </h4>
                <p className="text-sm text-gray-600">
                  {lang === 'de' 
                    ? 'API-Verbindungen und Services prüfen'
                    : 'Check API connections and services'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Test Modal */}
      {showAITest && (
        <AITestModal 
          lang={lang} 
          onClose={() => setShowAITest(false)}
        />
      )}
    </div>
  );
}
