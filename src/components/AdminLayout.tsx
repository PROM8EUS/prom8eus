import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LogOut,
  Settings,
  Users,
  Shield,
  RefreshCw,
  TestTube,
  Tag,
  Zap,
  ListTodo,
  Mail,
  CheckSquare,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  lang: 'de' | 'en';
  onLogout: () => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export default function AdminLayout({ children, lang, onLogout, currentView = 'dashboard', onViewChange }: AdminLayoutProps) {
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_login_time');
    onLogout();
  };

  const adminMenuItems = {
    core: [
      {
        id: 'dashboard',
        title: lang === 'de' ? 'Dashboard' : 'Dashboard',
        description: lang === 'de' ? 'Übersicht und Statistiken' : 'Overview & metrics',
        icon: LayoutDashboard,
        href: '/admin'
      },
      {
        id: 'sources',
        title: lang === 'de' ? 'Quellen' : 'Sources',
        description: lang === 'de' ? 'Workflows & Agenten verwalten' : 'Manage workflows & agents',
        icon: RefreshCw,
        href: '/admin/sources'
      },
      {
        id: 'validation-queue',
        title: lang === 'de' ? 'Validierung' : 'Validation',
        description: lang === 'de' ? 'LLM-Ausgaben prüfen' : 'Review LLM output',
        icon: CheckSquare,
        href: '/admin/validation-queue'
      },
      {
        id: 'pilot-feedback',
        title: lang === 'de' ? 'Pilot-Feedback' : 'Pilot Feedback',
        description: lang === 'de' ? 'Erkenntnisse aus Tests' : 'Insights from pilots',
        icon: MessageSquare,
        href: '/admin/pilot-feedback'
      }
    ],
    catalog: [
      {
        id: 'domains',
        title: lang === 'de' ? 'Domänen' : 'Domains',
        description: lang === 'de' ? 'Ontologien & Zuordnung' : 'Ontologies & mapping',
        icon: Tag,
        href: '/admin/domains'
      },
      {
        id: 'capabilities',
        title: lang === 'de' ? 'Fähigkeiten' : 'Capabilities',
        description: lang === 'de' ? 'Agent-Fähigkeiten pflegen' : 'Maintain agent capabilities',
        icon: Zap,
        href: '/admin/capabilities'
      },
      {
        id: 'implementation-steps',
        title: lang === 'de' ? 'Implementierungsschritte' : 'Implementation Steps',
        description: lang === 'de' ? 'Step-Extraktionen verwalten' : 'Manage extracted steps',
        icon: ListTodo,
        href: '/admin/implementation-steps'
      },
      {
        id: 'implementation-requests',
        title: lang === 'de' ? 'Implementierungsanfragen' : 'Implementation Requests',
        description: lang === 'de' ? 'Eingehende Wünsche' : 'Incoming requests',
        icon: Mail,
        href: '/admin/implementation-requests'
      }
    ],
    tools: [
      {
        id: 'test',
        title: lang === 'de' ? 'Workflow Test' : 'Workflow Test',
        description: lang === 'de' ? 'Playground & Simulation' : 'Playground & simulation',
        icon: TestTube,
        href: '/admin/test'
      },
      {
        id: 'users',
        title: lang === 'de' ? 'Benutzer' : 'Users',
        description: lang === 'de' ? 'Zugriff & Rollen' : 'Access & roles',
        icon: Users,
        href: '/admin/users'
      },
      {
        id: 'settings',
        title: lang === 'de' ? 'Einstellungen' : 'Settings',
        description: lang === 'de' ? 'Systemkonfiguration' : 'System configuration',
        icon: Settings,
        href: '/admin/settings'
      }
    ]
  } as const;

  const renderNavGroup = (
    title: string,
    description: string,
    items: typeof adminMenuItems.core
  ) => (
    <div className="space-y-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <p className="text-[11px] text-gray-400">{description}</p>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange?.(item.id)}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-3',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md',
                  isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <div className="font-medium leading-tight">{item.title}</div>
                <p className={cn('text-[11px] leading-tight', isActive ? 'text-white/80' : 'text-gray-400')}>
                  {item.description}
                </p>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {lang === 'de' ? 'Admin Panel' : 'Admin Panel'}
                </h1>
                <p className="text-sm text-gray-500">
                  {lang === 'de' ? 'Prom8eus Verwaltung' : 'Prom8eus Administration'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {lang === 'de' ? 'Abmelden' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <aside className="w-64 shrink-0 space-y-6">
            {renderNavGroup(
              lang === 'de' ? 'Kernbereiche' : 'Core Areas',
              lang === 'de' ? 'Monitoring & tägliche Arbeit' : 'Monitoring & daily work',
              adminMenuItems.core
            )}
            {renderNavGroup(
              lang === 'de' ? 'Katalog-Verwaltung' : 'Catalog Management',
              lang === 'de' ? 'Struktur & Inhalte pflegen' : 'Maintain structure & content',
              adminMenuItems.catalog
            )}
            {renderNavGroup(
              lang === 'de' ? 'Tools & Einstellungen' : 'Tools & Settings',
              lang === 'de' ? 'Konfiguration & Utilities' : 'Configuration & utilities',
              adminMenuItems.tools
            )}
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="p-5">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
