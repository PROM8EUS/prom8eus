import { supabase } from './supabase';

interface CachedUrlData {
  extractedData: any;
  textLength: number;
  wasRendered: boolean;
  createdAt: string;
}

interface CacheableJobText {
  title: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  fulltext: string;
  source: string;
  composeJobText: () => string;
}

// Generate SHA-256 hash from URL
export async function generateUrlHash(url: string): Promise<string> {
  // Normalize URL for consistent hashing
  const normalizedUrl = url.trim().toLowerCase();
  
  // Use Web Crypto API to generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedUrl);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Check if URL data is cached and still valid
export async function getCachedUrlData(url: string): Promise<CachedUrlData | null> {
  try {
    const urlHash = await generateUrlHash(url);
    console.log(`Checking cache for URL hash: ${urlHash}`);
    
    const { data, error } = await supabase.rpc('get_cached_url_data', {
      url_hash_param: urlHash
    });
    
    if (error) {
      console.error('Error fetching cached data:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      const cachedData = data[0];
      console.log(`Cache hit! Found data from ${new Date(cachedData.created_at).toLocaleString()}`);
      return {
        extractedData: cachedData.extracted_data,
        textLength: cachedData.text_length,
        wasRendered: cachedData.was_rendered,
        createdAt: cachedData.created_at
      };
    }
    
    console.log('Cache miss - no valid cached data found');
    return null;
  } catch (error) {
    console.error('Error in getCachedUrlData:', error);
    return null;
  }
}

// Store extracted job text data in cache
export async function setCachedUrlData(
  url: string, 
  jobText: CacheableJobText, 
  textLength: number, 
  wasRendered: boolean = false
): Promise<boolean> {
  try {
    const urlHash = await generateUrlHash(url);
    console.log(`Caching data for URL hash: ${urlHash}`);
    
    // Prepare data for caching
    const extractedData = {
      title: jobText.title,
      description: jobText.description,
      responsibilities: jobText.responsibilities,
      qualifications: jobText.qualifications,
      fulltext: jobText.fulltext,
      source: jobText.source,
      composedText: jobText.composeJobText()
    };
    
    const { error } = await supabase
      .from('url_cache')
      .insert({
        url_hash: urlHash,
        original_url: url,
        extracted_data: extractedData,
        text_length: textLength,
        was_rendered: wasRendered
      });
    
    if (error) {
      console.error('Error caching URL data:', error);
      return false;
    }
    
    console.log('Successfully cached URL data');
    return true;
  } catch (error) {
    console.error('Error in setCachedUrlData:', error);
    return false;
  }
}

// Convert cached data back to job text format
export function cachedDataToJobText(cachedData: CachedUrlData, originalUrl: string): CacheableJobText {
  const extractedData = cachedData.extractedData;
  
  return {
    title: extractedData.title || '',
    description: extractedData.description || '',
    responsibilities: extractedData.responsibilities || '',
    qualifications: extractedData.qualifications || '',
    fulltext: extractedData.fulltext || '',
    source: originalUrl,
    composeJobText: () => extractedData.composedText || ''
  };
}

// Cleanup expired cache entries (utility function)
export async function cleanupExpiredCache(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('cleanup_expired_url_cache');
    
    if (error) {
      console.error('Error cleaning up expired cache:', error);
      return false;
    }
    
    console.log('Successfully cleaned up expired cache entries');
    return true;
  } catch (error) {
    console.error('Error in cleanupExpiredCache:', error);
    return false;
  }
}