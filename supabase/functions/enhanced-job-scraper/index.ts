import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

    // Special handling for Google Jobs URLs - they require rendering
    const isGoogleJobs = url.includes('google.com') && url.includes('jobs');
    const shouldRender = forceRender || isGoogleJobs;

    // Step 1: Try simple fetch first (skip for Google Jobs)
    let html = '';
    let textLength = 0;
    let wasRendered = false;

    if (!shouldRender) {
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

    // Step 2: Use Playwright if content is minimal, forced, or Google Jobs
    if (shouldRender || textLength < 1000) {
      console.log(`Using Playwright for enhanced scraping... (Google Jobs: ${isGoogleJobs}, Force: ${forceRender}, Low content: ${textLength < 1000})`);
      
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
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--single-process', // Important for Supabase
            '--no-zygote',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        });

        const page = await browser.newPage();
        
        // Set realistic viewport and user agent for Google
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Additional stealth measures for Google
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        console.log('Navigating to page...');
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 15000
        });

        // For Google Jobs, wait for specific content to load
        if (isGoogleJobs) {
          console.log('Waiting for Google Jobs content...');
          try {
            await page.waitForSelector('[data-job-title], .VfPpkd-fmcmS-wGMbrd, [jsname="s5aXhc"]', { 
              timeout: 10000 
            });
            console.log('Google Jobs content selector found');
          } catch {
            console.log('Google Jobs selectors not found, proceeding anyway');
          }
        } else {
          // Wait for main content to appear
          try {
            await page.waitForSelector('[role="main"], main, .content, .job-description', { 
              timeout: 5000 
            });
          } catch {
            console.log('Main content selector not found, proceeding with current state');
          }
        }

        // Get the rendered HTML
        html = await page.content();
        textLength = extractTextLength(html);
        wasRendered = true;

        console.log(`Playwright result: ${textLength} characters of visible text`);
        
        // Log a sample of the extracted content for debugging
        const sampleText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                             .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                             .replace(/<[^>]*>/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim()
                             .substring(0, 500);
        console.log(`Sample extracted text: ${sampleText}`);

        await browser.close();
      } catch (error) {
        console.error('Playwright scraping failed:', error.message);
        
        // For Google Jobs, try a simpler approach
        if (isGoogleJobs && !html) {
          console.log('Attempting fallback for Google Jobs...');
          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
              },
              signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
              html = await response.text();
              textLength = extractTextLength(html);
              console.log(`Fallback fetch result: ${textLength} characters`);
            }
          } catch (fallbackError) {
            console.error('Fallback fetch also failed:', fallbackError.message);
          }
        }
        
        // If still no content, return error
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

    // Final validation
    if (textLength < 100) {
      console.log(`Warning: Very low text content (${textLength} characters)`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        html,
        textLength,
        wasRendered,
        isGoogleJobs
      } as ScrapeResponse & { isGoogleJobs?: boolean }),
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