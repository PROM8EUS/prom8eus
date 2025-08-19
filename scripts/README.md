# Test Scripts

## Quick Analysis Test

Run the analysis function locally to test German and English job descriptions:

```bash
# Install ts-node if not already available
npm install -g ts-node

# Run the test
npx ts-node --esm scripts/quick-test.ts
```

Or with Node.js directly:
```bash
node --loader ts-node/esm scripts/quick-test.ts
```

This will test:
- German job description parsing and analysis
- English job description parsing and analysis  
- Task extraction and categorization
- Automation scoring logic
- Recommendation generation

The script outputs detailed breakdowns of:
- Overall automation scores
- Individual task analysis
- Category detection
- Confidence levels
- Generated recommendations