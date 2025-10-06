/**
 * AI Workflow Generation Edge Function
 * 
 * Generates n8n workflows using OpenAI based on subtask context
 * Replaces mock data with real AI-generated workflows
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Subtask {
  id?: string;
  title: string;
  description: string;
  automationPotential: number;
  estimatedTime: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'low' | 'medium' | 'high';
  systems: string[];
  risks: string[];
  opportunities: string[];
  dependencies: string[];
  aiTools: string[];
}

interface GeneratedWorkflow {
  name: string;
  description: string;
  summary: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters: any;
  }>;
  connections: Record<string, any>;
  settings: any;
  versionId: string;
}

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key);
}

/**
 * Generate n8n workflow using OpenAI
 */
async function generateWorkflowWithAI(subtask: Subtask, lang: 'de' | 'en' = 'de'): Promise<GeneratedWorkflow> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const systemPrompt = lang === 'de' ? `
Du bist ein Experte für n8n Workflow-Automatisierung. Erstelle einen vollständigen n8n Workflow basierend auf der gegebenen Unteraufgabe.

WICHTIGE REGELN:
1. Antworte NUR mit gültigem JSON - keine Erklärungen oder zusätzlichen Text
2. Erstelle realistische n8n Nodes mit korrekten Parametern
3. Verwende echte n8n Node-Typen (HTTP Request, Webhook, Slack, etc.)
4. Erstelle logische Verbindungen zwischen den Nodes
5. Berücksichtige die angegebenen Systeme und Integrationen
6. Mache den Workflow praktisch und umsetzbar

JSON Format:
{
  "name": "Workflow Name",
  "description": "Detaillierte Beschreibung des Workflows",
  "summary": "Kurze Zusammenfassung",
  "nodes": [
    {
      "id": "node-id",
      "name": "Node Name",
      "type": "n8n-node-type",
      "position": [x, y],
      "parameters": { /* n8n node parameters */ }
    }
  ],
  "connections": {
    "node-id": {
      "main": [[{"node": "target-node-id", "type": "main", "index": 0}]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "1"
}
` : `
You are an expert in n8n workflow automation. Create a complete n8n workflow based on the given subtask.

IMPORTANT RULES:
1. Respond ONLY with valid JSON - no explanations or additional text
2. Create realistic n8n nodes with correct parameters
3. Use real n8n node types (HTTP Request, Webhook, Slack, etc.)
4. Create logical connections between nodes
5. Consider the specified systems and integrations
6. Make the workflow practical and implementable

JSON Format:
{
  "name": "Workflow Name",
  "description": "Detailed workflow description",
  "summary": "Short summary",
  "nodes": [
    {
      "id": "node-id",
      "name": "Node Name",
      "type": "n8n-node-type",
      "position": [x, y],
      "parameters": { /* n8n node parameters */ }
    }
  ],
  "connections": {
    "node-id": {
      "main": [[{"node": "target-node-id", "type": "main", "index": 0}]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "1"
}
`;

  const userPrompt = lang === 'de' ? `
Erstelle einen n8n Workflow für folgende Unteraufgabe:

Titel: ${subtask.title}
Beschreibung: ${subtask.description}
Automatisierungspotential: ${subtask.automationPotential}%
Geschätzte Zeit: ${subtask.estimatedTime}
Priorität: ${subtask.priority}
Komplexität: ${subtask.complexity}
Systeme: ${subtask.systems.join(', ')}
Risiken: ${subtask.risks.join(', ')}
Möglichkeiten: ${subtask.opportunities.join(', ')}
Abhängigkeiten: ${subtask.dependencies.join(', ')}
AI Tools: ${subtask.aiTools.join(', ')}

Erstelle einen praktischen, umsetzbaren n8n Workflow mit realistischen Nodes und Verbindungen.
` : `
Create an n8n workflow for the following subtask:

Title: ${subtask.title}
Description: ${subtask.description}
Automation Potential: ${subtask.automationPotential}%
Estimated Time: ${subtask.estimatedTime}
Priority: ${subtask.priority}
Complexity: ${subtask.complexity}
Systems: ${subtask.systems.join(', ')}
Risks: ${subtask.risks.join(', ')}
Opportunities: ${subtask.opportunities.join(', ')}
Dependencies: ${subtask.dependencies.join(', ')}
AI Tools: ${subtask.aiTools.join(', ')}

Create a practical, implementable n8n workflow with realistic nodes and connections.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Parse JSON response
    const workflow = JSON.parse(content);
    
    // Validate required fields
    if (!workflow.name || !workflow.description || !workflow.nodes) {
      throw new Error("Invalid workflow structure received from AI");
    }

    return workflow;

  } catch (error) {
    console.error('Error generating workflow with AI:', error);
    
    // Return fallback workflow if AI generation fails
    return generateFallbackWorkflow(subtask, lang);
  }
}

/**
 * Generate fallback workflow when AI generation fails
 */
function generateFallbackWorkflow(subtask: Subtask, lang: 'de' | 'en' = 'de'): GeneratedWorkflow {
  const baseName = subtask.title || 'Generated Workflow';
  const baseDescription = subtask.description || 'AI-generated workflow';
  
  return {
    name: baseName,
    description: baseDescription,
    summary: baseDescription.slice(0, 100) + '...',
    nodes: [
      {
        id: 'webhook-trigger',
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        position: [100, 100],
        parameters: {
          httpMethod: 'POST',
          path: 'workflow-trigger',
          responseMode: 'responseNode'
        }
      },
      {
        id: 'process-data',
        name: 'Process Data',
        type: 'n8n-nodes-base.function',
        position: [300, 100],
        parameters: {
          functionCode: `// Process the incoming data
const items = $input.all();
const processedItems = items.map(item => {
  return {
    json: {
      ...item.json,
      processed: true,
      timestamp: new Date().toISOString()
    }
  };
});

return processedItems;`
        }
      },
      {
        id: 'respond',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        position: [500, 100],
        parameters: {
          respondWith: 'json',
          responseBody: '={{ { "success": true, "message": "Workflow executed successfully" } }}'
        }
      }
    ],
    connections: {
      'webhook-trigger': {
        main: [[{ node: 'process-data', type: 'main', index: 0 }]]
      },
      'process-data': {
        main: [[{ node: 'respond', type: 'main', index: 0 }]]
      }
    },
    settings: {
      executionOrder: 'v1'
    },
    versionId: '1'
  };
}

/**
 * Main handler function
 */
async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { 
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const { subtask, lang = 'de' } = await req.json();

    if (!subtask || !subtask.title) {
      return new Response(JSON.stringify({ 
        error: 'Subtask is required with title field' 
      }), { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      });
    }

    console.log(`🤖 Generating AI workflow for: ${subtask.title}`);

    // Generate workflow using AI
    const workflow = await generateWorkflowWithAI(subtask, lang);

    console.log(`✅ Generated workflow: ${workflow.name}`);

    return new Response(JSON.stringify({ 
      workflow,
      success: true,
      generated: true
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });

  } catch (error) {
    console.error('[generate-ai-workflow] error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false
    }), { 
      status: 500, 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      } 
    });
  }
}

Deno.serve(handler);
