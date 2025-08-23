import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface AnalyzeInputRequest {
  url?: string
  rawText?: string
}

interface AnalysisResult {
  success: boolean
  data?: {
    originalText: string
    automationScore: number
    automatedTasks: string[]
    manualTasks: string[]
    recommendations: string[]
    summary: string
  }
  error?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { url, rawText }: AnalyzeInputRequest = await req.json()
    
    let finalText = ''
    
    if (url) {
      console.log('Processing URL:', url)
      
      // Normalize URL
      const normalizedUrl = normalizeUrl(url)
      console.log('Normalized URL:', normalizedUrl)
      
      // Fetch content with custom headers
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 Prom8eusBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      })
      
      if (response.status >= 400) {
        throw new Error('Seite nicht erreichbar')
      }
      
      const html = await response.text()
      finalText = extractJobText(html, normalizedUrl)
      
    } else if (rawText) {
      console.log('Processing raw text')
      finalText = rawText.trim()
    } else {
      throw new Error('Weder URL noch Text bereitgestellt')
    }
    
    // Log first 300 characters
    console.log('Final text (first 300 chars):', finalText.substring(0, 300))
    
    // Run analysis
    const analysisResult = await runAnalysis(finalText)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: analysisResult
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
    
  } catch (error) {
    console.error('Error in analyze-input:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Ein Fehler ist aufgetreten'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

function normalizeUrl(url: string): string {
  let normalized = url.trim()
  
  // Add https if no protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }
  
  // Convert http to https
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://')
  }
  
  return normalized
}

function extractJobText(html: string, url: string): string {
  // Remove script and style elements
  let cleanHtml = html.replace(/<script[^>]*>.*?<\/script>/gis, '')
  cleanHtml = cleanHtml.replace(/<style[^>]*>.*?<\/style>/gis, '')
  
  // Remove HTML tags but keep line breaks
  let text = cleanHtml.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/?(div|p|h[1-6]|li|section|article)[^>]*>/gi, '\n')
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '\"')
  text = text.replace(/&#39;/g, "'")
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n')
  text = text.trim()
  
  // Focus on job-relevant content (look for job-related keywords)
  const jobKeywords = [
    'stellenanzeige', 'job', 'position', 'aufgaben', 'tätigkeiten', 
    'anforderungen', 'qualifikation', 'verantwortung', 'stelle',
    'bewerbung', 'karriere', 'mitarbeiter', 'team', 'unternehmen'
  ]
  
  const lines = text.split('\n')
  const relevantLines = lines.filter(line => {
    const lowerLine = line.toLowerCase()
    return jobKeywords.some(keyword => lowerLine.includes(keyword)) || line.length > 50
  })
  
  return relevantLines.join('\n').substring(0, 5000) // Limit to 5000 chars
}

async function runAnalysis(text: string): Promise<any> {
  // Simulate analysis logic - in real implementation, this could call OpenAI/Claude
  const words = text.split(/\s+/).length
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // Simple automation scoring based on keywords
  const automationKeywords = [
    'daten', 'eingabe', 'erfassung', 'verwaltung', 'dokumentation',
    'berichte', 'excel', 'tabelle', 'routine', 'wiederhol', 'standard',
    'prozess', 'workflow', 'system', 'software', 'digital'
  ]
  
  const manualKeywords = [
    'kreativ', 'beratung', 'kommunikation', 'präsentation', 'meeting',
    'führung', 'management', 'strategie', 'entscheidung', 'innovation',
    'design', 'konzept', 'verhandlung', 'kundenbetreuung'
  ]
  
  const lowerText = text.toLowerCase()
  const automationMatches = automationKeywords.filter(keyword => lowerText.includes(keyword))
  const manualMatches = manualKeywords.filter(keyword => lowerText.includes(keyword))
  
  const automationScore = Math.min(85, Math.max(15, 
    (automationMatches.length * 10) - (manualMatches.length * 5) + 40
  ))
  
  const automatedTasks = [
    'Dateneingabe und -verwaltung',
    'Berichtserstellung',
    'E-Mail-Bearbeitung',
    'Terminplanung',
    'Dokumentenverwaltung'
  ].filter((_, index) => index < automationMatches.length + 2)
  
  const manualTasks = [
    'Strategische Planung',
    'Kundenberatung',
    'Team-Management',
    'Kreative Aufgaben',
    'Entscheidungsfindung'
  ].filter((_, index) => index < manualMatches.length + 2)
  
  const recommendations = [
    'Implementierung von Workflow-Automatisierung',
    'Digitalisierung wiederkehrender Prozesse',
    'Einsatz von KI-Tools für Routineaufgaben',
    'Fokus auf wertschöpfende Tätigkeiten'
  ]
  
  return {
    originalText: text, // Store full original text for sharing
    automationScore,
    automatedTasks,
    manualTasks,
    recommendations: recommendations.slice(0, 3),
    summary: `Analyse von ${words} Wörtern ergab ${automationScore}% Automatisierungspotenzial. ${automatedTasks.length} automatisierbare und ${manualTasks.length} manuelle Aufgaben identifiziert.`
  }
}
