import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Settings, Users, BarChart3, Database, Shield, RefreshCw, TestTube } from 'lucide-react';

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
      description: lang === 'de' ? 'Übersicht und Statistiken' : 'Overview and statistics',
      icon: BarChart3,
      href: '/admin'
    },
    {
      id: 'sources',
      title: lang === 'de' ? 'Quellen' : 'Sources',
      description: lang === 'de' ? 'Workflow- und AI-Agent-Quellen' : 'Workflow and AI agent sources',
      icon: RefreshCw,
      href: '/admin/sources'
    },
    {
      id: 'test',
      title: lang === 'de' ? 'Workflow Test' : 'Workflow Test',
      description: lang === 'de' ? 'Teste den Workflow-Chain' : 'Test the workflow chain',
      icon: TestTube,
      href: '/admin/test'
    },
    {
      id: 'users',
      title: lang === 'de' ? 'Benutzer' : 'Users',
      description: lang === 'de' ? 'Benutzerverwaltung' : 'User management',
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
  ];

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <Card 
                key={item.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer h-24 flex items-center ${
                  isActive ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => onViewChange?.(item.id)}
              >
                <CardHeader className="w-full py-0">
                  <div className="flex items-center h-24">
                    <div className={`p-2 rounded-lg mr-3 ${
                      isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Admin Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
