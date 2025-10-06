import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LogOut,
  Settings,
  Users,
  Shield,
  RefreshCw,
  Mail,
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

  const adminMenuItems = [
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
      id: 'implementation-requests',
      title: lang === 'de' ? 'Implementierungsanfragen' : 'Implementation Requests',
      description: lang === 'de' ? 'Eingehende Wünsche' : 'Incoming requests',
      icon: Mail,
      href: '/admin/implementation-requests'
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
  ] as const;

  const renderNavItem = (item: typeof adminMenuItems[0]) => {
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
  };

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
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {lang === 'de' ? 'Admin-Bereich' : 'Admin Area'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {lang === 'de' ? 'Systemverwaltung' : 'System management'}
                </p>
              </div>
              <div className="space-y-1">
                {adminMenuItems.map(renderNavItem)}
              </div>
            </div>
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
