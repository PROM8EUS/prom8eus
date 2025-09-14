import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types (duplicated from our lib files for edge function)
type Category = 
  | "Data Processing"
  | "Reporting & Analytics"
  | "Communication & Scheduling"
  | "Integration & DevOps"
  | "Quality & Security"
  | "Customer & Advisory"
  | "Creative & Strategy";

type CatalogTask = {
  id: string;
  title: string;
  description: string;
  category: Category;
  tags: string[];
  defaultAutomation: "Automatable" | "Human";
};

type Catalog = {
  role: string;
  roleSlug: string;
  version: number;
  generatedAt: string;
  source: "gpt5" | "manual" | "mixed";
  items: CatalogTask[];
};

// Constants
const CATEGORIES: Category[] = [
  "Data Processing",
  "Reporting & Analytics", 
  "Communication & Scheduling",
  "Integration & DevOps",
  "Quality & Security",
  "Customer & Advisory",
  "Creative & Strategy"
];

const AUTOMATION_TENDENCY: Record<Category, "Automatable" | "Human"> = {
  "Data Processing": "Automatable",
  "Reporting & Analytics": "Automatable", 
  "Communication & Scheduling": "Automatable",
  "Integration & DevOps": "Automatable",
  "Quality & Security": "Automatable",
  "Customer & Advisory": "Human",
  "Creative & Strategy": "Human"
};

const ROLES = [
  "Software Engineer",
  "DevOps Engineer", 
  "Data Scientist",
  "Product Manager",
  "UX/UI Designer",
  "Sales Manager",
  "Marketing Manager",
  "Customer Support Specialist",
  "HR Manager",
  "Financial Accountant"
];

// Utility functions
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTask(task: any): CatalogTask {
  const id = slugify(task.title);
  let tags = task.tags || [];
  tags = tags
    .map((tag: string) => tag.toLowerCase().trim())
    .filter((tag: string) => tag.length > 0)
    .slice(0, 5);
  
  const defaultAutomation = AUTOMATION_TENDENCY[task.category];
  
  return {
    id,
    title: task.title.trim(),
    description: task.description.trim(),
    category: task.category,
    tags,
    defaultAutomation
  };
}

function dedupeById(items: CatalogTask[]): CatalogTask[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

const SYSTEM_PROMPT = `You are a precise catalog builder for job tasks. Return ONLY valid JSON matching the provided schema. Avoid duplicates and vague items. Use imperative titles. Keep each description to one sentence. Classify into the provided categories and infer defaultAutomation as 'Automatable' for operational/technical repeatable tasks and 'Human' for judgment-heavy, creative, advisory or leadership tasks.`;

const USER_PROMPT_TEMPLATE = (role: string) => `
ROLE: ${role}

TAXONOMY:
• Data Processing
• Reporting & Analytics
• Communication & Scheduling
• Integration & DevOps
• Quality & Security
• Customer & Advisory
• Creative & Strategy

Produce an array of 18–30 task objects with fields:
{ title, description, category, tags }

Rules:
• title: imperative, 3–7 words (e.g., "Build CI/CD pipeline")
• description: one concise sentence
• category: one of the taxonomy values
• tags: up to 5 lowercased keywords
• do not include ids or defaultAutomation; those are derived

Output: JSON array only.
`;

async function generateTasksForRole(role: string, openAIApiKey: string, retryCount = 0): Promise<CatalogTask[]> {
  const maxRetries = 3; // Increased retries
  
  try {
    console.log(`🤖 Generating tasks for: ${role} (attempt ${retryCount + 1})`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT_TEMPLATE(role) }
        ],
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse the JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Extract tasks array (handle different response formats)
    let rawTasks: any[];
    if (Array.isArray(parsed)) {
      rawTasks = parsed;
    } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
      rawTasks = parsed.tasks;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      rawTasks = parsed.items;
    } else {
      // Try to find the first array property
      const arrayProp = Object.values(parsed).find(val => Array.isArray(val));
      if (arrayProp) {
        rawTasks = arrayProp as any[];
      } else {
        throw new Error('No task array found in response');
      }
    }

    // Validate and normalize tasks
    const tasks: CatalogTask[] = [];
    for (const rawTask of rawTasks) {
      try {
        if (!rawTask.title || !rawTask.description || !rawTask.category) {
          console.warn(`⚠️  Skipping incomplete task: ${JSON.stringify(rawTask)}`);
          continue;
        }

        if (!CATEGORIES.includes(rawTask.category)) {
          console.warn(`⚠️  Skipping task with invalid category: ${rawTask.category}`);
          continue;
        }

        const normalizedTask = normalizeTask({
          title: rawTask.title,
          description: rawTask.description,
          category: rawTask.category,
          tags: rawTask.tags || []
        });

        tasks.push(normalizedTask);
      } catch (error) {
        console.warn(`⚠️  Error normalizing task: ${error}`);
      }
    }

    // Deduplicate by ID
    const uniqueTasks = dedupeById(tasks);
    
    if (uniqueTasks.length === 0) {
      throw new Error('No valid tasks generated');
    }

    console.log(`✅ Generated ${uniqueTasks.length} tasks for ${role}`);
    return uniqueTasks;

  } catch (error) {
    console.error(`❌ Error generating tasks for ${role}:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying ${retryCount + 1}/${maxRetries} for ${role}`);
      // Exponential backoff with longer delays for rate limits
      const delay = Math.min(5000 * Math.pow(2, retryCount), 30000); // Cap at 30 seconds
      console.log(`⏳ Waiting ${delay/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateTasksForRole(role, openAIApiKey, retryCount + 1);
    }
    
    console.error(`❌ All retry attempts failed for ${role}`);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('VITE_OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('VITE_OPENAI_API_KEY not found in environment variables');
    }

    const { role: singleRole, roles: customRoles } = await req.json().catch(() => ({}));
    
    // Determine which roles to generate
    let rolesToGenerate: string[] = [];
    if (singleRole) {
      rolesToGenerate = [singleRole];
    } else if (customRoles && Array.isArray(customRoles)) {
      rolesToGenerate = customRoles;
    } else {
      rolesToGenerate = ROLES;
    }

    console.log(`🚀 Generating catalogs for ${rolesToGenerate.length} roles...`);

    // Generate catalogs for all roles with better rate limiting
    const catalogs: Catalog[] = [];
    
    // Process roles in smaller batches to avoid rate limits
    const batchSize = 3; // Process 3 roles at a time
    const batches = [];
    for (let i = 0; i < rolesToGenerate.length; i += batchSize) {
      batches.push(rolesToGenerate.slice(i, i + batchSize));
    }
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}: ${batch.join(', ')}`);
      
      for (const role of batch) {
        const tasks = await generateTasksForRole(role, openAIApiKey);
        
        if (tasks.length > 0) {
          const catalog: Catalog = {
            role,
            roleSlug: slugify(role),
            version: 1,
            generatedAt: new Date().toISOString(),
            source: 'gpt5',
            items: tasks
          };
          
          catalogs.push(catalog);
          console.log(`📊 ${role}: ${tasks.length} tasks`);
        }
        
        // Longer delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Even longer delay between batches
      if (batchIndex < batches.length - 1) {
        console.log(`⏳ Waiting 10 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Create index
    const index = {
      generatedAt: new Date().toISOString(),
      roles: catalogs.map(catalog => ({
        role: catalog.role,
        roleSlug: catalog.roleSlug,
        file: `${catalog.roleSlug}.json`,
        items: catalog.items.length,
        version: catalog.version
      }))
    };

    const totalTasks = catalogs.reduce((sum, cat) => sum + cat.items.length, 0);

    console.log(`✅ Generated ${catalogs.length} catalogs with ${totalTasks} total tasks`);

    return new Response(
      JSON.stringify({
        success: true,
        catalogs,
        index,
        stats: {
          rolesGenerated: catalogs.length,
          totalTasks,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-catalog function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});