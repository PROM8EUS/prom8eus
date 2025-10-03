/**
 * SEO Head Component
 * Provides comprehensive SEO optimization with meta tags, structured data, and social media integration
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  structuredData?: Record<string, unknown>;
  lang?: string;
  noindex?: boolean;
  nofollow?: boolean;
  robots?: string;
  themeColor?: string;
  viewport?: string;
  charset?: string;
  favicon?: string;
  appleTouchIcon?: string;
  manifest?: string;
}

export function SEOHead({
  title = 'Prom8eus - AI-Powered Workflow Automation Platform',
  description = 'Discover and implement AI-powered workflow automation solutions. Generate workflows, agents, and prompts to streamline your business processes.',
  keywords = [
    'workflow automation',
    'AI automation',
    'business process automation',
    'n8n workflows',
    'Zapier automation',
    'AI agents',
    'LLM prompts',
    'productivity tools',
    'business efficiency',
    'automation platform'
  ],
  author = 'Prom8eus Team',
  canonical,
  ogImage = '/og-image.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  lang = 'en',
  noindex = false,
  nofollow = false,
  robots,
  themeColor = '#3b82f6',
  viewport = 'width=device-width, initial-scale=1.0',
  charset = 'utf-8',
  favicon = '/favicon.ico',
  appleTouchIcon = '/apple-touch-icon.png',
  manifest = '/site.webmanifest'
}: SEOHeadProps) {
  const fullTitle = title.includes('Prom8eus') ? title : `${title} | Prom8eus`;
  const robotsContent = robots || `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
  const canonicalUrl = canonical || window.location.href;

  // Default structured data for organization
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Prom8eus',
    description: 'AI-Powered Workflow Automation Platform',
    url: 'https://prom8eus.com',
    logo: 'https://prom8eus.com/logo.png',
    sameAs: [
      'https://twitter.com/prom8eus',
      'https://linkedin.com/company/prom8eus',
      'https://github.com/prom8eus'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@prom8eus.com'
    }
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  // Update page title and meta description for better SEO
  useEffect(() => {
    document.title = fullTitle;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }
  }, [fullTitle, description, canonicalUrl]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <meta name="theme-color" content={themeColor} />
      <meta name="viewport" content={viewport} />
      <meta charSet={charset} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Favicon and Icons */}
      <link rel="icon" href={favicon} />
      <link rel="apple-touch-icon" href={appleTouchIcon} />
      <link rel="manifest" href={manifest} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Prom8eus" />
      <meta property="og:locale" content={lang === 'de' ? 'de_DE' : 'en_US'} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@prom8eus" />
      <meta name="twitter:creator" content="@prom8eus" />

      {/* Additional SEO Meta Tags */}
      <meta name="application-name" content="Prom8eus" />
      <meta name="apple-mobile-web-app-title" content="Prom8eus" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content={themeColor} />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* Language and Direction */}
      <html lang={lang} />
      <meta httpEquiv="Content-Language" content={lang} />

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.openai.com" />
      <link rel="preconnect" href="https://api.anthropic.com" />

      {/* DNS Prefetch for better performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//api.openai.com" />
      <link rel="dns-prefetch" href="//api.anthropic.com" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>

      {/* Additional Performance Hints */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

      {/* Cache Control */}
      <meta httpEquiv="Cache-Control" content="public, max-age=31536000" />
    </Helmet>
  );
}

// Specialized SEO components for different page types
export function WorkflowSEOHead({ 
  workflowTitle, 
  workflowDescription, 
  workflowTags = [],
  ...props 
}: SEOHeadProps & {
  workflowTitle: string;
  workflowDescription: string;
  workflowTags?: string[];
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: workflowTitle,
    description: workflowDescription,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    keywords: workflowTags.join(', '),
    creator: {
      '@type': 'Organization',
      name: 'Prom8eus'
    }
  };

  return (
    <SEOHead
      title={workflowTitle}
      description={workflowDescription}
      keywords={[...workflowTags, 'workflow automation', 'n8n', 'business process']}
      ogType="article"
      structuredData={structuredData}
      {...props}
    />
  );
}

export function AgentSEOHead({ 
  agentName, 
  agentDescription, 
  agentCapabilities = [],
  ...props 
}: SEOHeadProps & {
  agentName: string;
  agentDescription: string;
  agentCapabilities?: string[];
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: agentName,
    description: agentDescription,
    applicationCategory: 'AIApplication',
    operatingSystem: 'Web',
    featureList: agentCapabilities,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    creator: {
      '@type': 'Organization',
      name: 'Prom8eus'
    }
  };

  return (
    <SEOHead
      title={agentName}
      description={agentDescription}
      keywords={[...agentCapabilities, 'AI agent', 'automation', 'artificial intelligence']}
      ogType="article"
      structuredData={structuredData}
      {...props}
    />
  );
}

export default SEOHead;