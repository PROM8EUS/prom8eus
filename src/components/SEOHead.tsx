import { useEffect } from 'react';

interface SEOHeadProps {
  lang: 'de' | 'en';
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
}

const SEOHead = ({ 
  lang, 
  title, 
  description, 
  keywords, 
  path = '/' 
}: SEOHeadProps) => {
  
  const defaultContent = {
    de: {
      title: 'PROM8EUS - Automatisierungspotenzial sofort erkennen | KI-gestützte Arbeitsanalyse',
      description: 'Analysieren Sie Ihr Automatisierungspotenzial mit KI. Fügen Sie Aufgabenbeschreibungen oder Stellenanzeigen ein und erhalten Sie sofort eine detaillierte Bewertung, welche Aufgaben automatisiert werden können.',
      keywords: 'Automatisierung, KI-Analyse, Workflow Automation, Arbeitsanalyse, Prozessoptimierung, Automatisierungspotenzial, Stellenanalyse, Aufgabenanalyse, KI-gestützt, PROM8EUS'
    },
    en: {
      title: 'PROM8EUS - See your automation potential instantly | AI-powered job analysis',
      description: 'Analyze your automation potential with AI. Paste task descriptions or job postings and get instant detailed evaluation of which tasks can be automated.',
      keywords: 'automation, AI analysis, workflow automation, job analysis, process optimization, automation potential, position analysis, task analysis, AI-powered, PROM8EUS'
    }
  };

  const content = defaultContent[lang];

  useEffect(() => {
    // Update document title
    document.title = title || content.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || content.description);
    }
    
    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords || content.keywords);
    }
    
    // Update html lang attribute
    document.documentElement.lang = lang;
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title || content.title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description || content.description);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      const baseUrl = 'https://prom8eus.com';
      const langPath = lang === 'en' ? '?lang=en' : '';
      ogUrl.setAttribute('content', `${baseUrl}${path}${langPath}`);
    }
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title || content.title);
    }
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description || content.description);
    }
    
  }, [lang, title, description, keywords, path, content]);

  return null; // This component doesn't render anything
};

export default SEOHead;
