import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_ANON_KEY as string;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const solutionId = 'test-solution-jsonb';
  const solutionType = 'workflow';
  const steps = [
    {
      step_number: 1,
      step_title: 'Setup environment',
      step_description: 'Install and configure required tools',
      step_category: 'setup',
      estimated_time: '15 minutes',
      difficulty_level: 'beginner',
      prerequisites: ['account'],
      tools_required: ['browser']
    },
    {
      step_title: 'Configure integration',
      step_description: 'Add API key and test connection',
      step_category: 'configuration',
      estimated_time: '10 minutes',
      difficulty_level: 'beginner',
      prerequisites: [],
      tools_required: []
    }
  ];

  const { data, error } = await supabase.rpc('store_implementation_steps', {
    p_solution_id: solutionId,
    p_solution_type: solutionType,
    p_steps: steps,
  });

  if (error) {
    console.error('RPC error:', error);
    process.exit(1);
  }

  console.log('✅ store_implementation_steps accepted JSONB array, inserted count:', data);

  const { data: fetched, error: fetchErr } = await supabase.rpc('get_implementation_steps', {
    p_solution_id: solutionId,
  });

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    process.exit(1);
  }

  console.log('✅ get_implementation_steps returned', Array.isArray(fetched) ? fetched.length : 0, 'rows');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


