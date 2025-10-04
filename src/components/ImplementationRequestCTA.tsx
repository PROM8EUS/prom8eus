import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, Mail, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImplementationRequestCTAProps {
  taskTitle?: string;
  taskDescription?: string;
  subtasks?: Array<{
    id: string;
    title: string;
    automationPotential: number;
    estimatedTime: number;
  }>;
  automationScore?: number;
  estimatedSavings?: {
    hours: number;
    cost: number;
    period: string;
  };
  lang?: 'de' | 'en';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onRequestImplementation?: (data: any) => void;
}

export const ImplementationRequestCTA: React.FC<ImplementationRequestCTAProps> = ({
  taskTitle,
  taskDescription,
  subtasks = [],
  automationScore = 0,
  estimatedSavings,
  lang = 'de',
  size = 'lg',
  className,
  onRequestImplementation
}) => {

  const handleRequestImplementation = () => {
    const requestData = {
      taskTitle,
      taskDescription,
      subtasks,
      automationScore,
      estimatedSavings,
      timestamp: new Date().toISOString()
    };

    if (onRequestImplementation) {
      onRequestImplementation(requestData);
    } else {
      // Default behavior: open email client
      const subject = lang === 'de' 
        ? `Implementierungsanfrage: ${taskTitle || 'Automatisierung'}` 
        : `Implementation Request: ${taskTitle || 'Automation'}`;
      
      const body = lang === 'de'
        ? `Hallo,

ich interessiere mich für die Implementierung der folgenden Automatisierung:

Aufgabe: ${taskTitle || 'Nicht spezifiziert'}
Beschreibung: ${taskDescription || 'Nicht verfügbar'}

Automatisierungspotenzial: ${automationScore}%
Geschätzte Einsparungen: ${estimatedSavings?.hours?.toFixed(1) || 0}h/${estimatedSavings?.period || 'Monat'} (${estimatedSavings?.cost?.toLocaleString('de-DE') || 0} €)

Teilaufgaben:
${subtasks.map(s => `- ${s.title} (${Math.round(s.automationPotential * 100)}% Automatisierung)`).join('\n')}

Bitte kontaktieren Sie mich für weitere Details.

Mit freundlichen Grüßen`
        : `Hello,

I'm interested in implementing the following automation:

Task: ${taskTitle || 'Not specified'}
Description: ${taskDescription || 'Not available'}

Automation Potential: ${automationScore}%
Estimated Savings: ${estimatedSavings?.hours?.toFixed(1) || 0}h/${estimatedSavings?.period || 'month'} (${estimatedSavings?.cost?.toLocaleString('en-US') || 0} €)

Subtasks:
${subtasks.map(s => `- ${s.title} (${Math.round(s.automationPotential * 100)}% automation)`).join('\n')}

Please contact me for further details.

Best regards`;

      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          card: 'p-3',
          title: 'text-sm',
          description: 'text-xs',
          button: 'h-8 text-xs px-3',
          icon: 'w-3 h-3'
        };
      case 'md':
        return {
          card: 'p-4',
          title: 'text-base',
          description: 'text-sm',
          button: 'h-9 text-sm px-4',
          icon: 'w-4 h-4'
        };
      case 'lg':
      default:
        return {
          card: 'p-6',
          title: 'text-lg',
          description: 'text-sm',
          button: 'h-11 text-base px-6',
          icon: 'w-5 h-5'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <Card 
      className={cn(
        'bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-primary/30',
        className
      )}
    >
      <CardContent className={sizeClasses.card}>
        <div className="text-center space-y-4">
          {/* Header with Icon */}
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-full bg-primary/20">
              <Sparkles className={cn('text-primary', sizeClasses.icon)} />
            </div>
            <h3 className={cn('font-bold text-foreground', sizeClasses.title)}>
              {lang === 'de' ? 'Bereit für die Umsetzung?' : 'Ready for Implementation?'}
            </h3>
          </div>

          {/* Description */}
          <p className={cn('text-muted-foreground max-w-md mx-auto', sizeClasses.description)}>
            {lang === 'de' 
              ? 'Lassen Sie uns Ihre Automatisierung gemeinsam umsetzen und Ihre Effizienz steigern.'
              : 'Let\'s implement your automation together and boost your efficiency.'}
          </p>

          {/* Key Metrics */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {automationScore > 0 && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {automationScore}% {lang === 'de' ? 'Automatisierung' : 'Automation'}
                </Badge>
              </div>
            )}
            {estimatedSavings && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                  {estimatedSavings.hours.toFixed(1)}h {lang === 'de' ? 'gespart' : 'saved'}/{estimatedSavings.period}
                </Badge>
              </div>
            )}
            {estimatedSavings && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                  {estimatedSavings.cost.toLocaleString('de-DE')} € {lang === 'de' ? 'Einsparung' : 'savings'}
                </Badge>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Button
              onClick={handleRequestImplementation}
              className={cn(
                'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold',
                sizeClasses.button
              )}
            >
              <Mail className={cn('mr-2', sizeClasses.icon)} />
              {lang === 'de' ? 'Implementierung anfragen' : 'Request Implementation'}
              <ArrowRight className={cn('ml-2', sizeClasses.icon)} />
            </Button>
          </div>

          {/* Contact Options */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{lang === 'de' ? 'E-Mail' : 'Email'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{lang === 'de' ? 'Telefon' : 'Phone'}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{lang === 'de' ? 'Chat' : 'Chat'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImplementationRequestCTA;
