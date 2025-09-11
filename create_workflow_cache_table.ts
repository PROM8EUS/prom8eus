import { supabase } from './src/integrations/supabase/client';

async function createWorkflowCacheTable() {
  try {
    console.log('Creating workflow_cache table...');
    
    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS workflow_cache (
          id SERIAL PRIMARY KEY,
          version VARCHAR(10) NOT NULL UNIQUE,
          workflows JSONB NOT NULL,
          stats JSONB,
          last_fetch_time TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }

    // Create indexes
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_workflow_cache_version ON workflow_cache(version);
        CREATE INDEX IF NOT EXISTS idx_workflow_cache_last_fetch ON workflow_cache(last_fetch_time);
      `
    });

    // Enable RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE workflow_cache ENABLE ROW LEVEL SECURITY;'
    });

    // Create policies
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow read access to workflow cache" ON workflow_cache
          FOR SELECT USING (true);
        
        CREATE POLICY "Allow authenticated users to manage workflow cache" ON workflow_cache
          FOR ALL USING (auth.role() = 'authenticated');
      `
    });

    // Create trigger function and trigger
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_workflow_cache_updated_at 
          BEFORE UPDATE ON workflow_cache 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    console.log('✅ workflow_cache table created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createWorkflowCacheTable();




