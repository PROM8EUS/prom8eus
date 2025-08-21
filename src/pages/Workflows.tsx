import React from 'react';
import { WorkflowTemplates } from '../components/WorkflowTemplates';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';

const WorkflowsPage: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="AI Workflow Templates - Automatisierung für verschiedene Branchen"
        description="Entdecken Sie vorgefertigte AI-Workflow-Templates für Marketing, Finance und Healthcare. Sparen Sie Zeit und Kosten mit bewährten Automatisierungslösungen."
        keywords="AI Workflows, Automatisierung, Marketing Automation, Finance Automation, Healthcare Automation, ROI, Zeitersparnis"
        lang="de"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <WorkflowTemplates />
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default WorkflowsPage;
