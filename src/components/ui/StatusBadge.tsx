import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react';

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'error' | 'warning' | 'loading' | 'pending' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = false, 
  className = '' 
}: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'active':
      case 'aktiv':
      case 'enabled':
      case 'running':
      case 'success':
      case 'configured':
      case 'valid':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
          icon: CheckCircle,
          text: 'Aktiv'
        };
      
      case 'inactive':
      case 'inaktiv':
      case 'disabled':
      case 'stopped':
      case 'missing':
      case 'not configured':
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
          icon: XCircle,
          text: 'Inaktiv'
        };
      
      case 'error':
      case 'failed':
      case 'invalid':
      case 'ungültig':
      case 'fehler':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
          icon: XCircle,
          text: 'Fehler'
        };
      
      case 'warning':
      case 'warnung':
      case 'pending':
      case 'ausstehend':
        return {
          variant: 'outline' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
          icon: AlertTriangle,
          text: 'Warnung'
        };
      
      case 'loading':
      case 'laden':
      case 'processing':
      case 'verarbeitung':
        return {
          variant: 'outline' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
          icon: Loader2,
          text: 'Lädt...'
        };
      
      default:
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
          icon: Clock,
          text: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} ${className} ${
        config.icon === Loader2 ? 'animate-spin' : ''
      }`}
    >
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.text}
    </Badge>
  );
}

// Convenience components for common statuses
export function ActiveBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <StatusBadge status="active" size={size} className={className} />;
}

export function InactiveBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <StatusBadge status="inactive" size={size} className={className} />;
}

export function ErrorBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <StatusBadge status="error" size={size} className={className} />;
}

export function WarningBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <StatusBadge status="warning" size={size} className={className} />;
}

export function LoadingBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <StatusBadge status="loading" size={size} className={className} />;
}
