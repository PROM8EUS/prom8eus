import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ProfessionalSetupProps {
  lang?: 'de' | 'en';
}

export default function ProfessionalSetup({ lang = 'de' }: ProfessionalSetupProps) {
  const [showForm, setShowForm] = useState(false);

  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "24h Setup"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6.292a2 2 0 01.293-1.414l7.674-7.674a2 2 0 012.828 0l.707.707M7 20l2-2m0-2l2-2m0-2l2-2M7 20l-2-2m0-2l-2-2m0-2l-2-2" />
        </svg>
      ),
      label: lang === 'de' ? 'Funktionsgarantie' : 'Functionality Guarantee'
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      label: lang === 'de' ? 'Geld zurück' : 'Money back'
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: lang === 'de' ? 'Zahlung bei Erfolg' : 'Payment upon success'
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: "30d Support"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: lang === 'de' ? 'Sofort startklar' : 'Immediately ready to start'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted');
  };

  return (
    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-bold text-purple-900">
              {lang === 'de' ? 'Professionelle Einrichtung' : 'Professional Setup'}
            </h4>
            <p className="text-purple-700 text-sm">
              {lang === 'de' 
                ? 'Lassen Sie uns diese Automatisierung für Sie einrichten.'
                : 'Let us set up this automation for you.'
              }
            </p>
          </div>
        </div>
        
        {!showForm ? (
          <Button 
            variant="outline" 
            size="sm"
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
            onClick={() => setShowForm(true)}
          >
            {lang === 'de' ? 'Anfragen' : 'Inquire'}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
            onClick={() => setShowForm(false)}
          >
            {lang === 'de' ? 'Abbrechen' : 'Cancel'}
          </Button>
        )}
      </div>

      {/* Features Grid - Only shown when form is not visible */}
      {!showForm && (
        <div className="grid grid-cols-6 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-lg bg-purple-200 flex items-center justify-center mx-auto mb-2">
                {feature.icon}
              </div>
              <span className="text-xs text-gray-700 font-medium">{feature.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Form - Only shown when form is visible */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setup-name" className="text-purple-900 font-medium">
                {lang === 'de' ? 'Name' : 'Name'}
              </Label>
              <Input 
                id="setup-name" 
                placeholder={lang === 'de' ? 'Name' : 'Name'}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-email" className="text-purple-900 font-medium">
                {lang === 'de' ? 'E-Mail' : 'Email'}
              </Label>
              <Input 
                id="setup-email" 
                type="email" 
                placeholder={lang === 'de' ? 'E-Mail' : 'Email'}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="setup-company" className="text-purple-900 font-medium">
              {lang === 'de' ? 'Firma (optional)' : 'Company (optional)'}
            </Label>
            <Input 
              id="setup-company" 
              placeholder={lang === 'de' ? 'Firma (optional)' : 'Company (optional)'}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="setup-requirements" className="text-purple-900 font-medium">
              {lang === 'de' ? 'Ihre Anforderungen und Kontext...' : 'Your requirements and context...'}
            </Label>
            <Textarea 
              id="setup-requirements" 
              rows={4}
              placeholder={lang === 'de' 
                ? 'Ihre Anforderungen und Kontext...'
                : 'Your requirements and context...'
              }
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 resize-none"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {lang === 'de' ? 'Anfrage senden' : 'Send Request'}
          </Button>
        </form>
      )}
    </div>
  );
}
