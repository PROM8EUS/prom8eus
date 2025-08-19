import { createClient } from '@supabase/supabase-js'

// Temporäre Konfiguration - diese Werte müssen aus der Supabase Integration bezogen werden
// TODO: Diese durch echte Supabase Projekt-URLs ersetzen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AnalyzeInputRequest {
  url?: string
  rawText?: string
}

export interface AnalysisResult {
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

export async function callAnalyzeInput(input: AnalyzeInputRequest): Promise<AnalysisResult> {
  try {
    // Mock-Implementation für Lovable Vorschau
    if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
      console.log('Using mock analysis for preview:', input)
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const isUrl = input.url && /^https?:\/\//.test(input.url)
      const textToAnalyze = input.rawText || `Simulierte Analyse für ${isUrl ? 'URL: ' + input.url : 'Text-Input'}`
      
      // Mock analysis results
      const mockResult = {
        originalText: textToAnalyze.substring(0, 500) + '...',
        automationScore: Math.floor(Math.random() * 40) + 45, // 45-85%
        automatedTasks: [
          'Dateneingabe und -verwaltung',
          'E-Mail-Bearbeitung und Verteilung', 
          'Berichte und Dokumentation',
          'Terminplanung und Kalenderführung',
          'Wiederkehrende Datenauswertungen'
        ].slice(0, Math.floor(Math.random() * 3) + 2),
        manualTasks: [
          'Strategische Entscheidungen',
          'Kundengespräche und Beratung',
          'Kreative Problemlösung',
          'Team-Leadership',
          'Komplexe Verhandlungen'
        ].slice(0, Math.floor(Math.random() * 3) + 2),
        recommendations: [
          'Workflow-Automatisierung implementieren',
          'KI-Tools für Routineaufgaben einsetzen',
          'Digitale Processes etablieren'
        ],
        summary: `Mock-Analyse erfolgreich: ${Math.floor(Math.random() * 40) + 45}% Automatisierungspotenzial identifiziert`
      }
      
      return {
        success: true,
        data: mockResult
      }
    }

    // Echte Supabase Implementation
    const { data, error } = await supabase.functions.invoke('analyze-input', {
      body: input
    })

    if (error) {
      console.error('Supabase function error:', error)
      return {
        success: false,
        error: error.message || 'Fehler beim Aufrufen der Analyse-Funktion'
      }
    }

    return data as AnalysisResult
  } catch (error) {
    console.error('Error calling analyze-input:', error)
    return {
      success: false,
      error: 'Netzwerkfehler beim Aufrufen der Analyse'
    }
  }
}