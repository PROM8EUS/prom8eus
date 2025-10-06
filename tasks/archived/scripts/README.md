# Archived Scripts

This directory contains scripts that were removed from the main project as part of the over-engineering remediation effort.

## Archived Training Scripts

These scripts implemented a complex self-learning training system for job description analysis. They were removed because:

1. **Over-Engineering**: The training system was overly complex for the current needs
2. **Maintenance Burden**: Required significant maintenance and monitoring
3. **Unused Features**: The training system was not actively used in production
4. **Code Complexity**: Added unnecessary complexity to the codebase

### Files Archived:

- `run-training-pipeline.ts` - Main training pipeline script
- `intensive-training.ts` - Intensive training with advanced features
- `cleanup-training-files.ts` - Cleanup utility for training files
- `auto-training-system.ts` - Automated training system
- `README-TRAINING.md` - Comprehensive training documentation

### Original npm Scripts Removed:

```json
{
  "train": "tsx scripts/run-training-pipeline.ts",
  "train:quick": "tsx scripts/run-training-pipeline.ts 3 0.8 20 2",
  "train:intensive": "tsx scripts/run-training-pipeline.ts 10 0.9 50 5 --save",
  "train:super": "tsx scripts/intensive-training.ts 20 0.95 150 8 --save --verbose",
  "train:clean": "tsx scripts/intensive-training.ts 10 0.9 100 5 --delete-after --verbose",
  "cleanup": "tsx scripts/cleanup-training-files.ts",
  "cleanup:dry": "tsx scripts/cleanup-training-files.ts --dry-run --verbose",
  "test-extraction": "tsx scripts/auto-training-system.ts"
}
```

## Archived Test Scripts

These scripts were specific test utilities that were removed because:

1. **Specific Use Cases**: Only used for specific testing scenarios
2. **Maintenance Overhead**: Required regular updates and maintenance
3. **Limited Usage**: Not part of the core testing strategy
4. **Code Duplication**: Functionality could be achieved with existing test tools

### Files Archived:

- `test-pilot-feedback-analytics.ts` - Pilot feedback analytics testing
- `test-select-sentinel.ts` - Select sentinel testing
- `test-step-extraction-jsonb.ts` - Step extraction JSONB testing
- `test-error-boundary.ts` - Error boundary testing

### Original npm Scripts Removed:

```json
{
  "test:pilot-analytics": "tsx scripts/test-pilot-feedback-analytics.ts",
  "test:select-sentinel": "tsx scripts/test-select-sentinel.ts",
  "test:step-jsonb": "tsx scripts/test-step-extraction-jsonb.ts",
  "test:error-boundary": "tsx scripts/test-error-boundary.ts"
}
```

## Restoration

If any of these scripts are needed in the future, they can be restored by:

1. Moving the relevant files back to the `scripts/` directory
2. Adding the corresponding npm scripts back to `package.json`
3. Updating any dependencies that may be required

## Impact

The removal of these scripts:

- **Reduced package.json complexity** from 22 scripts to 9 scripts
- **Eliminated maintenance burden** for unused training system
- **Simplified development workflow** by removing unused commands
- **Improved codebase clarity** by focusing on essential functionality

## Remaining Scripts

The following scripts remain in the main project:

- `dev` - Development server
- `build` - Production build
- `build:dev` - Development build
- `lint` - ESLint checking
- `preview` - Preview build
- `generate-favicon` - Favicon generation
- `test` - Vitest testing
- `test:ui` - Vitest UI
- `test:run` - Vitest run
- `test:coverage` - Test coverage

These scripts represent the core functionality needed for development, building, and testing the application.
