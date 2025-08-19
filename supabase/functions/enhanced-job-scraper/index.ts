import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { puppeteer } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeRequest {
  url: string;
  forceRender?: boolean;
}

interface ScrapeResponse {
  success: boolean;
  html?: string;
  textLength?: number;
  wasRendered?: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, forceRender = false }: ScrapeRequest = await req.json();
    
    console.log(`Scraping URL: ${url}, forceRender: ${forceRender}`);

    if (!url || !isValidUrl(url)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 1: Try simple fetch first
    let html = '';
    let textLength = 0;
    let wasRendered = false;

    if (!forceRender) {
      try {
        console.log('Attempting simple fetch first...');
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          html = await response.text();
          textLength = extractTextLength(html);
          console.log(`Simple fetch result: ${textLength} characters of visible text`);
        }
      } catch (error) {
        console.log('Simple fetch failed:', error.message);
      }
    }

    // Step 2: Use Playwright if content is minimal or forced
    if (forceRender || textLength < 1000) {
      console.log('Using Playwright for enhanced scraping...');
      
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });

        const page = await browser.newPage();
        
        // Set realistic viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        console.log('Navigating to page...');
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 10000
        });

        // Wait for main content to appear
        try {
          await page.waitForSelector('[role="main"], main, .content, .job-description', { 
            timeout: 5000 
          });
        } catch {
          // Continue if selector not found
          console.log('Main content selector not found, proceeding with current state');
        }

        // Get the rendered HTML
        html = await page.content();
        textLength = extractTextLength(html);
        wasRendered = true;

        console.log(`Playwright result: ${textLength} characters of visible text`);

        await browser.close();
      } catch (error) {
        console.error('Playwright scraping failed:', error.message);
        
        // Fallback to original HTML if we had some
        if (!html) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to scrape URL: ${error.message}` 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        html,
        textLength,
        wasRendered
      } as ScrapeResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in enhanced-job-scraper:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractTextLength(html: string): number {
  // Simple text extraction to estimate content quality
  const textContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return textContent.length;
}