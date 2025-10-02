/**
 * UI component interfaces for the expanded task detail view
 */

import { BadgeStatus } from '../types';

// Status Badge Interface
export interface StatusBadgeInterface {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  tooltip?: string;
}

// Tab Interface
export interface TabInterface {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
  content: React.ReactNode;
}

// Tab Navigation Interface
export interface TabNavigationInterface {
  activeTab: string;
  tabs: TabInterface[];
  onTabChange: (tabId: string) => void;
  className?: string;
}

// Sidebar Navigation Interface
export interface SidebarNavigationInterface {
  items: SidebarItemInterface[];
  activeItem?: string;
  onItemClick: (itemId: string) => void;
  className?: string;
}

// Sidebar Item Interface
export interface SidebarItemInterface {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
  children?: SidebarItemInterface[];
}

// Loading State Interface
export interface LoadingStateInterface {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

// Error State Interface
export interface ErrorStateInterface {
  hasError: boolean;
  message?: string;
  code?: string;
  retryable?: boolean;
  onRetry?: () => void;
}

// Action Button Interface
export interface ActionButtonInterface {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}
