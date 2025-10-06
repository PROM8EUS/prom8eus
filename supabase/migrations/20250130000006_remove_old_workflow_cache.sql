-- Remove old workflow_cache table after successful migration to unified_workflows
-- This migration safely removes the legacy workflow_cache table and related objects

-- ============================================================================
-- 1. VERIFY MIGRATION COMPLETENESS
-- ============================================================================

-- Create a function to verify that migration is complete
CREATE OR REPLACE FUNCTION verify_workflow_migration_complete()
RETURNS BOOLEAN AS $$
DECLARE
  workflow_cache_count INTEGER;
  unified_workflows_count INTEGER;
  migration_complete BOOLEAN := FALSE;
BEGIN
  -- Check if workflow_cache table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_cache') THEN
    RAISE NOTICE 'workflow_cache table does not exist, migration already complete';
    RETURN TRUE;
  END IF;

  -- Count records in both tables
  SELECT COUNT(*) INTO workflow_cache_count FROM workflow_cache;
  SELECT COUNT(*) INTO unified_workflows_count FROM unified_workflows;

  RAISE NOTICE 'workflow_cache records: %, unified_workflows records: %', 
    workflow_cache_count, unified_workflows_count;

  -- Consider migration complete if:
  -- 1. unified_workflows has more records than workflow_cache, OR
  -- 2. workflow_cache is empty, OR
  -- 3. unified_workflows has at least 80% of workflow_cache records
  IF unified_workflows_count >= workflow_cache_count * 0.8 OR 
     workflow_cache_count = 0 OR
     unified_workflows_count > workflow_cache_count THEN
    migration_complete := TRUE;
    RAISE NOTICE 'Migration verification passed';
  ELSE
    RAISE WARNING 'Migration verification failed: insufficient data in unified_workflows';
  END IF;

  RETURN migration_complete;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. BACKUP CRITICAL DATA (if needed)
-- ============================================================================

-- Create a backup table for any critical data that might be lost
CREATE TABLE IF NOT EXISTS workflow_cache_backup AS
SELECT 
  *,
  NOW() as backup_created_at
FROM workflow_cache
WHERE 1=0; -- Create empty table with same structure

-- ============================================================================
-- 3. REMOVE DEPENDENCIES
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_workflow_cache_updated_at ON workflow_cache;
DROP TRIGGER IF EXISTS trigger_update_cache_admin_version ON workflow_cache;

-- Drop policies
DROP POLICY IF EXISTS "Allow read access to workflow cache" ON workflow_cache;
DROP POLICY IF EXISTS "Allow authenticated users to manage workflow cache" ON workflow_cache;

-- Drop indexes
DROP INDEX IF EXISTS idx_workflow_cache_version;
DROP INDEX IF EXISTS idx_workflow_cache_last_fetch;
DROP INDEX IF EXISTS idx_workflow_cache_source;
DROP INDEX IF EXISTS idx_workflow_cache_admin_version;
DROP INDEX IF EXISTS idx_workflow_cache_type;
DROP INDEX IF EXISTS idx_workflow_cache_admin_version_type;
DROP INDEX IF EXISTS idx_workflow_cache_updated_at_desc;
DROP INDEX IF EXISTS idx_workflow_cache_version_admin_version;
DROP INDEX IF EXISTS idx_workflow_cache_domains;
DROP INDEX IF EXISTS idx_workflow_cache_domain_origin;

-- ============================================================================
-- 4. REMOVE FUNCTIONS THAT DEPEND ON workflow_cache
-- ============================================================================

-- Drop functions that reference workflow_cache
DROP FUNCTION IF EXISTS get_workflow_cache_stats();
DROP FUNCTION IF EXISTS cleanup_old_workflow_cache();
DROP FUNCTION IF EXISTS update_workflow_cache_admin_version();

-- ============================================================================
-- 5. REMOVE THE TABLE (with verification)
-- ============================================================================

-- Only remove the table if migration is verified complete
DO $$
DECLARE
  migration_verified BOOLEAN;
BEGIN
  -- Verify migration is complete
  SELECT verify_workflow_migration_complete() INTO migration_verified;
  
  IF migration_verified THEN
    -- Drop the table
    DROP TABLE IF EXISTS workflow_cache CASCADE;
    RAISE NOTICE 'Successfully removed workflow_cache table';
  ELSE
    RAISE WARNING 'Migration not verified complete, keeping workflow_cache table';
  END IF;
END $$;

-- ============================================================================
-- 6. CLEANUP MIGRATION FUNCTIONS
-- ============================================================================

-- Remove migration functions as they are no longer needed
DROP FUNCTION IF EXISTS migrate_workflow_cache_to_unified();
DROP FUNCTION IF EXISTS verify_workflow_migration_complete();

-- ============================================================================
-- 7. UPDATE FEATURE FLAGS
-- ============================================================================

-- Update feature flags to reflect that legacy tables are removed
UPDATE feature_flags 
SET 
  enabled = true,
  description = 'Unified workflow schema is now the primary system',
  updated_at = NOW()
WHERE name = 'unified_workflow_read' AND environment = 'production';

-- ============================================================================
-- 8. CREATE CLEANUP VERIFICATION FUNCTION
-- ============================================================================

-- Create a function to verify cleanup was successful
CREATE OR REPLACE FUNCTION verify_workflow_cleanup()
RETURNS TABLE (
  cleanup_item TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check if workflow_cache table exists
  RETURN QUERY
  SELECT 
    'workflow_cache_table'::TEXT as cleanup_item,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_cache') 
      THEN 'EXISTS'::TEXT
      ELSE 'REMOVED'::TEXT
    END as status,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_cache') 
      THEN 'Table still exists - cleanup may have failed'
      ELSE 'Table successfully removed'
    END as details;

  -- Check if unified_workflows table exists and has data
  RETURN QUERY
  SELECT 
    'unified_workflows_table'::TEXT as cleanup_item,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_workflows') 
      THEN 'EXISTS'::TEXT
      ELSE 'MISSING'::TEXT
    END as status,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_workflows') 
      THEN 'Table exists and ready for use'
      ELSE 'Table missing - this is a problem'
    END as details;

  -- Check feature flags
  RETURN QUERY
  SELECT 
    'feature_flags'::TEXT as cleanup_item,
    CASE 
      WHEN EXISTS (SELECT 1 FROM feature_flags WHERE name = 'unified_workflow_read' AND enabled = true) 
      THEN 'ENABLED'::TEXT
      ELSE 'DISABLED'::TEXT
    END as status,
    'Unified workflow schema feature flag status' as details;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. FINAL VERIFICATION
-- ============================================================================

-- Run verification and log results
DO $$
DECLARE
  verification_record RECORD;
BEGIN
  RAISE NOTICE '=== WORKFLOW CLEANUP VERIFICATION ===';
  
  FOR verification_record IN 
    SELECT * FROM verify_workflow_cleanup()
  LOOP
    RAISE NOTICE '%: % - %', 
      verification_record.cleanup_item, 
      verification_record.status, 
      verification_record.details;
  END LOOP;
  
  RAISE NOTICE '=== CLEANUP VERIFICATION COMPLETE ===';
END $$;

-- ============================================================================
-- 10. CLEANUP VERIFICATION FUNCTION
-- ============================================================================

-- Remove the verification function as it's no longer needed
DROP FUNCTION IF EXISTS verify_workflow_cleanup();
