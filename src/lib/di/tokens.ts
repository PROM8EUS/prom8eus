/**
 * Dependency Injection Tokens
 * 
 * Service identifiers for dependency injection
 */

export const DI_TOKENS = {
  // Configuration
  CONFIG: Symbol('Config'),
  
  // Database
  SUPABASE_CLIENT: Symbol('SupabaseClient'),
  
  // AI Services
  OPENAI_CLIENT: Symbol('OpenAIClient'),
  
  // Cache Services
  CACHE_MANAGER: Symbol('CacheManager'),
  
  // Validation Services
  VALIDATION_SERVICE: Symbol('ValidationService'),
  
  // Domain Classification
  DOMAIN_CLASSIFICATION_SERVICE: Symbol('DomainClassificationService'),
  
  // Notification Services
  NOTIFICATION_SERVICE: Symbol('NotificationService'),
  
  // Workflow Services
  WORKFLOW_INDEXER: Symbol('WorkflowIndexer'),
  WORKFLOW_CACHE_MANAGER: Symbol('WorkflowCacheManager'),
  WORKFLOW_DATA_PROCESSOR: Symbol('WorkflowDataProcessor'),
  
  // N8N Services
  N8N_API: Symbol('N8nApi'),
  N8N_WORKFLOW_PARSER: Symbol('N8nWorkflowParser'),
  N8N_DATA_MAPPER: Symbol('N8nDataMapper'),

  // Unified Workflow Services
  UNIFIED_WORKFLOW_INDEXER: Symbol('UnifiedWorkflowIndexer'),
  
  // Analysis Services
  ANALYSIS_SERVICE: Symbol('AnalysisService'),
  
  // Performance Services
  PERFORMANCE_METRICS: Symbol('PerformanceMetrics'),
  
  // Security Services
  SECURITY_COMPLIANCE: Symbol('SecurityCompliance'),
  
  // Monitoring Services
  MONITORING_MANAGER: Symbol('MonitoringManager'),
  
  // Analytics Services
  USAGE_ANALYTICS: Symbol('UsageAnalytics'),
  
  // Fallback Services
  FALLBACK_ENGINE: Symbol('FallbackEngine'),
  
  // Deduplication Services
  DEDUPLICATION_ENGINE: Symbol('DeduplicationEngine'),
  
  // Source Management
  SOURCE_CONFIG_MANAGER: Symbol('SourceConfigManager'),
  SOURCE_LIFECYCLE_MANAGER: Symbol('SourceLifecycleManager'),
  
  // Implementation Services
  IMPLEMENTATION_REQUEST_SERVICE: Symbol('ImplementationRequestService'),
  
  // Shared Analysis Services
  SHARED_ANALYSIS_SERVICE: Symbol('SharedAnalysisService'),
  
  // Documentation Services
  DOCUMENTATION_MANAGER: Symbol('DocumentationManager'),
  
  // Maintenance Services
  MAINTENANCE_PROCEDURE_MANAGER: Symbol('MaintenanceProcedureManager'),
  
  // Enrichment Services
  ENRICHMENT_SERVICE: Symbol('EnrichmentService'),
  ENRICHMENT_TRIGGER_SERVICE: Symbol('EnrichmentTriggerService'),
  
  // Data Validation
  DATA_VALIDATION_ENGINE: Symbol('DataValidationEngine'),
  
  // Metadata Services
  METADATA_VALIDATOR: Symbol('MetadataValidator'),
  
  // Workflow Generator
  WORKFLOW_GENERATOR: Symbol('WorkflowGenerator'),
  
  // Catalog Services
  CATALOG_SERVICE: Symbol('CatalogService'),
  
  // AI Tools
  AI_TOOLS_SERVICE: Symbol('AiToolsService'),
  
  // Run Analysis
  RUN_ANALYSIS_SERVICE: Symbol('RunAnalysisService'),
  
  // Types
  TYPES_SERVICE: Symbol('TypesService'),
  
  // Supabase
  SUPABASE_SERVICE: Symbol('SupabaseService'),
  
  // Source Operations
  SOURCE_OPERATIONS_SERVICE: Symbol('SourceOperationsService'),
  
  // Source Health
  SOURCE_HEALTH_SERVICE: Symbol('SourceHealthService'),
  
  // Source Quality
  SOURCE_QUALITY_SERVICE: Symbol('SourceQualityService'),
  
  // Source Performance
  SOURCE_PERFORMANCE_SERVICE: Symbol('SourcePerformanceService'),
  
  // Source Alerts
  SOURCE_ALERTS_SERVICE: Symbol('SourceAlertsService'),
  
  // Source Recovery
  SOURCE_RECOVERY_SERVICE: Symbol('SourceRecoveryService'),
  
  // Source Notifications
  SOURCE_NOTIFICATIONS_SERVICE: Symbol('SourceNotificationsService'),
  
  // Source Cache
  SOURCE_CACHE_SERVICE: Symbol('SourceCacheService'),
  
  // Source Incremental Updates
  SOURCE_INCREMENTAL_UPDATES_SERVICE: Symbol('SourceIncrementalUpdatesService'),
  
  // Source Versioning
  SOURCE_VERSIONING_SERVICE: Symbol('SourceVersioningService'),
  
  // Source Schema
  SOURCE_SCHEMA_SERVICE: Symbol('SourceSchemaService'),
  
  // Source Migration
  SOURCE_MIGRATION_SERVICE: Symbol('SourceMigrationService'),
  
  // Source Backup
  SOURCE_BACKUP_SERVICE: Symbol('SourceBackupService'),
  
  // Source Restore
  SOURCE_RESTORE_SERVICE: Symbol('SourceRestoreService'),
  
  // Source Cleanup
  SOURCE_CLEANUP_SERVICE: Symbol('SourceCleanupService'),
  
  // Source Monitoring
  SOURCE_MONITORING_SERVICE: Symbol('SourceMonitoringService'),
  
  // Source Analytics
  SOURCE_ANALYTICS_SERVICE: Symbol('SourceAnalyticsService'),
  
  // Source Reporting
  SOURCE_REPORTING_SERVICE: Symbol('SourceReportingService'),
  
  // Source Export
  SOURCE_EXPORT_SERVICE: Symbol('SourceExportService'),
  
  // Source Import
  SOURCE_IMPORT_SERVICE: Symbol('SourceImportService'),
  
  // Source Sync
  SOURCE_SYNC_SERVICE: Symbol('SourceSyncService'),
  
  // Source Validation
  SOURCE_VALIDATION_SERVICE: Symbol('SourceValidationService'),
  
  // Source Transformation
  SOURCE_TRANSFORMATION_SERVICE: Symbol('SourceTransformationService'),
  
  // Source Enrichment
  SOURCE_ENRICHMENT_SERVICE: Symbol('SourceEnrichmentService'),
  
  // Source Deduplication
  SOURCE_DEDUPLICATION_SERVICE: Symbol('SourceDeduplicationService'),
  
  // Source Quality Assurance
  SOURCE_QUALITY_ASSURANCE_SERVICE: Symbol('SourceQualityAssuranceService'),
  
  // Source Testing
  SOURCE_TESTING_SERVICE: Symbol('SourceTestingService'),
  
  // Source Deployment
  SOURCE_DEPLOYMENT_SERVICE: Symbol('SourceDeploymentService'),
  
  // Source Configuration
  SOURCE_CONFIGURATION_SERVICE: Symbol('SourceConfigurationService'),
  
  // Source Lifecycle
  SOURCE_LIFECYCLE_SERVICE: Symbol('SourceLifecycleService'),
  
  // Source Operations
  SOURCE_OPERATIONS_SERVICE: Symbol('SourceOperationsService'),
  
  // Source Management
  SOURCE_MANAGEMENT_SERVICE: Symbol('SourceManagementService'),
  
  // Source Administration
  SOURCE_ADMINISTRATION_SERVICE: Symbol('SourceAdministrationService'),
  
  // Source Maintenance
  SOURCE_MAINTENANCE_SERVICE: Symbol('SourceMaintenanceService'),
  
  // Source Support
  SOURCE_SUPPORT_SERVICE: Symbol('SourceSupportService'),
  
  // Source Help
  SOURCE_HELP_SERVICE: Symbol('SourceHelpService'),
  
  // Source Documentation
  SOURCE_DOCUMENTATION_SERVICE: Symbol('SourceDocumentationService'),
  
  // Source Training
  SOURCE_TRAINING_SERVICE: Symbol('SourceTrainingService'),
  
  // Source Onboarding
  SOURCE_ONBOARDING_SERVICE: Symbol('SourceOnboardingService'),
  
  // Source Migration
  SOURCE_MIGRATION_SERVICE: Symbol('SourceMigrationService'),
  
  // Source Upgrade
  SOURCE_UPGRADE_SERVICE: Symbol('SourceUpgradeService'),
  
  // Source Downgrade
  SOURCE_DOWNGRADE_SERVICE: Symbol('SourceDowngradeService'),
  
  // Source Rollback
  SOURCE_ROLLBACK_SERVICE: Symbol('SourceRollbackService'),
  
  // Source Recovery
  SOURCE_RECOVERY_SERVICE: Symbol('SourceRecoveryService'),
  
  // Source Disaster Recovery
  SOURCE_DISASTER_RECOVERY_SERVICE: Symbol('SourceDisasterRecoveryService'),
  
  // Source Business Continuity
  SOURCE_BUSINESS_CONTINUITY_SERVICE: Symbol('SourceBusinessContinuityService'),
  
  // Source Risk Management
  SOURCE_RISK_MANAGEMENT_SERVICE: Symbol('SourceRiskManagementService'),
  
  // Source Compliance
  SOURCE_COMPLIANCE_SERVICE: Symbol('SourceComplianceService'),
  
  // Source Governance
  SOURCE_GOVERNANCE_SERVICE: Symbol('SourceGovernanceService'),
  
  // Source Audit
  SOURCE_AUDIT_SERVICE: Symbol('SourceAuditService'),
  
  // Source Security
  SOURCE_SECURITY_SERVICE: Symbol('SourceSecurityService'),
  
  // Source Privacy
  SOURCE_PRIVACY_SERVICE: Symbol('SourcePrivacyService'),
  
  // Source Data Protection
  SOURCE_DATA_PROTECTION_SERVICE: Symbol('SourceDataProtectionService'),
  
  // Source GDPR
  SOURCE_GDPR_SERVICE: Symbol('SourceGDPRService'),
  
  // Source CCPA
  SOURCE_CCPA_SERVICE: Symbol('SourceCCPAService'),
  
  // Source HIPAA
  SOURCE_HIPAA_SERVICE: Symbol('SourceHIPAAService'),
  
  // Source SOX
  SOURCE_SOX_SERVICE: Symbol('SourceSOXService'),
  
  // Source PCI
  SOURCE_PCI_SERVICE: Symbol('SourcePCIService'),
  
  // Source ISO
  SOURCE_ISO_SERVICE: Symbol('SourceISOService'),
  
  // Source SOC
  SOURCE_SOC_SERVICE: Symbol('SourceSOCService'),
  
  // Source FedRAMP
  SOURCE_FEDRAMP_SERVICE: Symbol('SourceFedRAMPService'),
  
  // Source FISMA
  SOURCE_FISMA_SERVICE: Symbol('SourceFISMAService'),
  
  // Source NIST
  SOURCE_NIST_SERVICE: Symbol('SourceNISTService'),
  
  // Source COBIT
  SOURCE_COBIT_SERVICE: Symbol('SourceCOBITService'),
  
  // Source ITIL
  SOURCE_ITIL_SERVICE: Symbol('SourceITILService'),
  
  // Source COSO
  SOURCE_COSO_SERVICE: Symbol('SourceCOSOService'),
  
  // Source COSO ERM
  SOURCE_COSO_ERM_SERVICE: Symbol('SourceCOSOERMService'),
  
  // Source COSO IC
  SOURCE_COSO_IC_SERVICE: Symbol('SourceCOSOICService'),
  
  // Source COSO FR
  SOURCE_COSO_FR_SERVICE: Symbol('SourceCOSOFRService'),
  
  // Source COSO CR
  SOURCE_COSO_CR_SERVICE: Symbol('SourceCOSOCRService'),
  
  // Source COSO PR
  SOURCE_COSO_PR_SERVICE: Symbol('SourceCOSOPRService'),
  
  // Source COSO IR
  SOURCE_COSO_IR_SERVICE: Symbol('SourceCOSOIRService'),
  
  // Source COSO OR
  SOURCE_COSO_OR_SERVICE: Symbol('SourceCOSOORService'),
  
  // Source COSO SR
  SOURCE_COSO_SR_SERVICE: Symbol('SourceCOSOSRService'),
  
  // Source COSO TR
  SOURCE_COSO_TR_SERVICE: Symbol('SourceCOSOTRService'),
  
  // Source COSO UR
  SOURCE_COSO_UR_SERVICE: Symbol('SourceCOSOURService'),
  
  // Source COSO VR
  SOURCE_COSO_VR_SERVICE: Symbol('SourceCOSOVRService'),
  
  // Source COSO WR
  SOURCE_COSO_WR_SERVICE: Symbol('SourceCOSOWRService'),
  
  // Source COSO XR
  SOURCE_COSO_XR_SERVICE: Symbol('SourceCOSOXRService'),
  
  // Source COSO YR
  SOURCE_COSO_YR_SERVICE: Symbol('SourceCOSOYRService'),
  
  // Source COSO ZR
  SOURCE_COSO_ZR_SERVICE: Symbol('SourceCOSOZRService'),
} as const;

export type DIToken = typeof DI_TOKENS[keyof typeof DI_TOKENS];
