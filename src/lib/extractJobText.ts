import * as cheerio from 'cheerio';
import { supabase } from '@/integrations/supabase/client';

interface JobData {
  title: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  fulltext: string;
  source: string;
}

interface ExtractedJobText extends JobData {
  composeJobText: () => string;
}

interface ScrapeResponse {
  success: boolean;
  html?: string;
  textLength?: number;
  wasRendered?: boolean;
  error?: string;
}

export async function extractJobTextFromUrl(url: string): Promise<ExtractedJobText> {
  try {
    console.log('Fetching job content from URL:', url);
    
    // Call the enhanced scraper edge function
    const { data, error } = await supabase.functions.invoke('enhanced-job-scraper', {
      body: { url }
    });

    if (error) {
      console.error('Error calling enhanced-job-scraper:', error);
      throw new Error(`Failed to fetch content: ${error.message}`);
    }

    const scrapeResult = data as ScrapeResponse;
    
    if (!scrapeResult.success || !scrapeResult.html) {
      throw new Error(scrapeResult.error || 'Failed to scrape content');
    }

    console.log(`Content scraped successfully. Text length: ${scrapeResult.textLength}, Was rendered: ${scrapeResult.wasRendered}`);
    
    return extractJobText(scrapeResult.html, url);
  } catch (error) {
    console.error('Error in extractJobTextFromUrl:', error);
    throw error;
  }
}

export function extractJobText(html: string, url: string): ExtractedJobText {
  const $ = cheerio.load(html);
  
  let title = '';
  let description = '';
  let responsibilities = '';
  let qualifications = '';
  let fulltext = '';

  // Step 1: Look for JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const jsonLd = JSON.parse($(element).html() || '');
      const jobPosting = Array.isArray(jsonLd) 
        ? jsonLd.find(item => item['@type'] === 'JobPosting')
        : jsonLd['@type'] === 'JobPosting' ? jsonLd : null;

      if (jobPosting) {
        title = jobPosting.title || '';
        description = jobPosting.description || '';
        responsibilities = jobPosting.responsibilities || '';
        qualifications = jobPosting.qualifications || '';
      }
    } catch (e) {
      // Invalid JSON-LD, continue with fallback
    }
  });

  // Step 2: Fallback extraction
  if (!title) {
    title = $('title').text() || '';
  }

  if (!description) {
    description = $('meta[name="description"]').attr('content') || '';
  }

  // Extract main content areas
  if (!fulltext) {
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '#content',
      '.content',
      '.job-description',
      '.job-details'
    ];

    const contentElements: string[] = [];
    
    contentSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        // Remove navigation, footer, scripts, styles
        $(element).find('nav, footer, script, style, .navigation, .nav').remove();
        const text = $(element).text();
        if (text && text.trim().length > 50) {
          contentElements.push(text);
        }
      });
    });

    fulltext = contentElements.join('\n\n');
  }

  // Step 3: Cleanup
  const cleanText = (text: string): string => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Clean up multiple newlines
      .trim()
      .substring(0, 10000); // Limit to 10,000 characters
  };

  const cleanedTitle = cleanText(title);
  const cleanedDescription = cleanText(description);
  const cleanedResponsibilities = cleanText(responsibilities);
  const cleanedQualifications = cleanText(qualifications);
  const cleanedFulltext = cleanText(fulltext);

  // Step 4: Compose function
  const composeJobText = (): string => {
    const sections: string[] = [];
    
    if (cleanedTitle) {
      sections.push(cleanedTitle);
    }
    
    if (cleanedResponsibilities) {
      sections.push(`\n\nAUFGABEN:\n${cleanedResponsibilities}`);
    }
    
    if (cleanedQualifications) {
      sections.push(`\n\nANFORDERUNGEN:\n${cleanedQualifications}`);
    }
    
    if (cleanedDescription || cleanedFulltext) {
      sections.push(`\n\nBESCHREIBUNG:\n${cleanedDescription || cleanedFulltext}`);
    }
    
    return sections.join('');
  };

  return {
    title: cleanedTitle,
    description: cleanedDescription,
    responsibilities: cleanedResponsibilities,
    qualifications: cleanedQualifications,
    fulltext: cleanedFulltext,
    source: url,
    composeJobText
  };
}