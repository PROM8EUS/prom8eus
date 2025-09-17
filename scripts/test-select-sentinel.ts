import { readFileSync } from 'fs';
import { resolve } from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('❌', message);
    process.exit(1);
  }
}

try {
  const filePath = resolve(process.cwd(), 'src/components/PilotFeedbackManagement.tsx');
  const content = readFileSync(filePath, 'utf8');

  const hasDefaultAll = content.includes("useState<string>('__ALL__')");
  assert(hasDefaultAll, "Default selectedSolution should be '__ALL__'");

  const hasAllItem = content.includes('<SelectItem value="__ALL__">All Solutions</SelectItem>');
  assert(hasAllItem, "SelectItem for 'All Solutions' should use value='__ALL__'");

  const hasEmptyValueItem = /<SelectItem\s+value=\"\"/m.test(content);
  assert(!hasEmptyValueItem, 'No SelectItem should use an empty string value');

  console.log('✅ Select sentinel checks passed');
  process.exit(0);
} catch (e) {
  console.error('❌ Test failed with error:', e);
  process.exit(1);
}


