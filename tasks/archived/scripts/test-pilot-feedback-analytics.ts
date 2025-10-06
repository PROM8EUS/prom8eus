import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_ANON_KEY as string;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase.rpc('get_pilot_feedback_analytics', {
    p_period: 'weekly',
    p_solution_id: null,
  });

  if (error) {
    console.error('RPC error:', error);
    process.exit(1);
  }

  console.log('✅ get_pilot_feedback_analytics OK');
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


