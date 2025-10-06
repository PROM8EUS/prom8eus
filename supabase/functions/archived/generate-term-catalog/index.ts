import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('VITE_OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('VITE_OPENAI_API_KEY ist nicht konfiguriert');
    }

    const { category } = await req.json();
    
    console.log('Generating term catalog for category:', category);

    const systemPrompt = `Du bist ein Experte für Arbeitsplatzautomatisierung und hilfst dabei, Begriffe zu kategorisieren, die bei der Einordnung von Aufgaben als "automatisierbar" oder "menschlich erforderlich" helfen.

Erstelle einen strukturierten Katalog mit deutschen und englischen Begriffen für die Aufgabenklassifizierung.

Kategorien für AUTOMATISIERBARE Aufgaben:
1. Datenverarbeitung (Data Processing)
2. Kommunikation & Terminplanung (Communication & Scheduling) 
3. Routine & Wiederkehrende Prozesse (Routine & Recurring)
4. Systeme & Integration (Systems & Integration)
5. Dokumentation & Reporting (Documentation & Reporting)

Kategorien für MENSCHLICH ERFORDERLICHE Aufgaben:
1. Körperliche Arbeit (Physical Work)
2. Kreativität & Innovation (Creative & Innovation)
3. Führung & Management (Leadership & Management)
4. Beratung & Expertise (Consultation & Expertise)
5. Verhandlung & Beziehungen (Negotiation & Relationships)
6. Komplexe Entscheidungen (Complex Decisions)

Format: JSON mit folgender Struktur:
{
  "automation_signals": {
    "category_name": {
      "description_de": "Deutsche Beschreibung",
      "description_en": "English Description", 
      "keywords_de": ["begriff1", "begriff2", ...],
      "keywords_en": ["term1", "term2", ...],
      "weight": 25,
      "examples": ["Beispiel 1", "Example 2"]
    }
  },
  "human_signals": {
    // gleiche Struktur
  }
}

Gib pro Kategorie mindestens 15-20 spezifische Begriffe an. Verwende präzise, domänenspezifische Begriffe.`;

    const userPrompt = category ? 
      `Fokussiere auf die Kategorie: ${category}. Gib eine detaillierte Analyse mit vielen spezifischen Begriffen.` :
      `Erstelle einen vollständigen Begriffskatalog für alle Kategorien. Jede Kategorie sollte umfassende Listen enthalten.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const catalog = JSON.parse(data.choices[0].message.content);

    console.log('Generated catalog with categories:', Object.keys(catalog));

    return new Response(JSON.stringify({ 
      success: true,
      catalog,
      generated_at: new Date().toISOString(),
      category_filter: category || 'all'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-term-catalog function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});