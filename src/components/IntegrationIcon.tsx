import React from 'react';
import { Globe, Zap, Mail, Database, HardDrive, MessageCircle, Building2, Calendar, Bot, Code, Boxes } from 'lucide-react';
import { AppIcon } from '@/components/AppIcon';

type Size = 'sm' | 'md' | 'lg';

export interface IntegrationIconProps {
  name: string;
  size?: Size;
  className?: string;
  showName?: boolean;
}

function isDomainLike(id: string) {
  return /\./.test(id);
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function chooseIcon(name: string) {
  const n = normalize(name);
  if (n.includes('webhook')) return Zap;
  if (n.includes('http') || n.includes('request') || n.includes('graphql') || n.includes('api')) return Globe;
  if (n.includes('cron') || n.includes('schedule')) return Calendar;
  if (n.includes('mail') || n.includes('email') || n.includes('sendgrid') || n.includes('gmail')) return Mail;
  if (n.includes('postgres') || n.includes('mysql') || n.includes('mongodb') || n.includes('db') || n.includes('database') || n.includes('redis')) return Database;
  if (n.includes('drive') || n.includes('storage') || n.includes('s3') || n.includes('bucket')) return HardDrive;
  if (n.includes('slack') || n.includes('discord') || n.includes('telegram') || n.includes('message')) return MessageCircle;
  if (n.includes('salesforce') || n.includes('hubspot') || n.includes('pipedrive') || n.includes('crm')) return Building2;
  if (n.includes('calendar') || n.includes('calendly')) return Calendar;
  if (n.includes('openai') || n.includes('anthropic') || n.includes('ai') || n.includes('gpt')) return Bot;
  if (n.includes('github') || n.includes('gitlab') || n.includes('code')) return Code;
  return Boxes; // generic
}

const sizeClasses: Record<Size, string> = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-12 h-12' };

export const IntegrationIcon: React.FC<IntegrationIconProps> = ({ name, size = 'sm', className = '', showName = false }) => {
  const n = normalize(name);

  // If it's a well-known brand or domain, use AppIcon via a minimal tool object
  // Heuristic: domain-like or known vendor names
  const vendorKeywords = ['google','gmail','sheets','drive','calendar','microsoft','excel','powerbi','outlook','notion','airtable','supabase','twitter','x ','discord','slack','telegram','github','gitlab','shopify','hubspot','salesforce','pipedrive','stripe','mailchimp','sendgrid','postgres','mysql','mongodb','redis','jira','asana','trello','clickup','zendesk','intercom'];

  const resolveVendorDomain = (val: string): string | null => {
    const v = normalize(val);
    const map: Record<string, string> = {
      'google sheets': 'sheets.google.com',
      'sheets': 'sheets.google.com',
      'gmail': 'mail.google.com',
      'google drive': 'drive.google.com',
      'drive': 'drive.google.com',
      'google calendar': 'calendar.google.com',
      'calendar': 'calendar.google.com',
      'excel': 'microsoft.com',
      'powerbi': 'powerbi.com',
      'outlook': 'outlook.com',
      'notion': 'notion.so',
      'airtable': 'airtable.com',
      'supabase': 'supabase.com',
      'twitter': 'x.com',
      'discord': 'discord.com',
      'slack': 'slack.com',
      'telegram': 'telegram.org',
      'github': 'github.com',
      'gitlab': 'gitlab.com',
      'shopify': 'shopify.com',
      'hubspot': 'hubspot.com',
      'salesforce': 'salesforce.com',
      'pipedrive': 'pipedrive.com',
      'stripe': 'stripe.com',
      'mailchimp': 'mailchimp.com',
      'sendgrid': 'sendgrid.com',
      'postgres': 'postgresql.org',
      'mysql': 'mysql.com',
      'mongodb': 'mongodb.com',
      'redis': 'redis.io',
      'jira': 'atlassian.com',
      'asana': 'asana.com',
      'trello': 'trello.com',
      'clickup': 'clickup.com',
      'zendesk': 'zendesk.com',
      'intercom': 'intercom.com'
    };
    for (const [k, domain] of Object.entries(map)) {
      if (v.includes(k)) return domain;
    }
    return null;
  };

  const isVendor = isDomainLike(n) || vendorKeywords.some(k => n.includes(k)) || !!resolveVendorDomain(n);

  if (isVendor) {
    const mapped = resolveVendorDomain(n);
    const id = mapped ? mapped : (isDomainLike(n) ? n : `${n.replace(/\s+/g,'-')}.com`);
    const tool = { id, name, logo: { alt: name, backgroundColor: '#6b7280' }, pricing: 'Free', automationPotential: 0 } as any;
    return <AppIcon tool={tool} size={size} showName={showName} className={className} />;
  }

  const Icon = chooseIcon(name);
  return (
    <div className={`rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center ${sizeClasses[size]} ${className}`} title={name} aria-label={name}>
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5 text-gray-600' : size === 'md' ? 'w-5 h-5 text-gray-600' : 'w-7 h-7 text-gray-600'} />
    </div>
  );
};

export default IntegrationIcon;


