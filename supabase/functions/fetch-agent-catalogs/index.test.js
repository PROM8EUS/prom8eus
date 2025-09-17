// Node.js test version for quality filter logic
import assert from 'assert';

// Mock the functions (simplified for Node.js testing)
function isHighQualitySpace(space, now = Date.now()) {
  const likes = Number(space.likes || 0);
  const dl = Number(space.downloads || 0);
  const lm = space.updatedAt || space.lastModified;
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
  const recent = lm ? now - new Date(lm).getTime() <= twelveMonthsMs : false;
  const likesOk = likes >= 5;
  const downloadsOk = dl > 0;
  return likesOk || recent || downloadsOk;
}

function qualityScore(space, now = Date.now()) {
  const likes = Number(space.likes || 0);
  const dl = Number(space.downloads || 0);
  const lm = space.updatedAt || space.lastModified;
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
  const recentBoost = lm && now - new Date(lm).getTime() <= twelveMonthsMs ? 50 : 0;
  return (likes * 2) + dl + recentBoost;
}

// Test data
const now = Date.now();
const twelveMonthsAgo = now - (365 * 24 * 60 * 60 * 1000);
const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);
const twoYearsAgo = now - (730 * 24 * 60 * 60 * 1000);

const mockSpace = (overrides = {}) => ({
  id: "test/space",
  likes: 0,
  downloads: 0,
  updatedAt: new Date(twoYearsAgo).toISOString(),
  tags: [],
  ...overrides,
});

// Tests
console.log('Running quality filter tests...');

// Test 1: High likes
const space1 = mockSpace({ likes: 10 });
assert(isHighQualitySpace(space1, now), 'Should pass with high likes');

// Test 2: Recent update
const space2 = mockSpace({ 
  likes: 0, 
  updatedAt: new Date(sixMonthsAgo).toISOString() 
});
assert(isHighQualitySpace(space2, now), 'Should pass with recent update');

// Test 3: Downloads
const space3 = mockSpace({ 
  likes: 0, 
  downloads: 5,
  updatedAt: new Date(twoYearsAgo).toISOString()
});
assert(isHighQualitySpace(space3, now), 'Should pass with downloads');

// Test 4: Low quality
const space4 = mockSpace({ 
  likes: 2, 
  downloads: 0,
  updatedAt: new Date(twoYearsAgo).toISOString()
});
assert(!isHighQualitySpace(space4, now), 'Should fail with low quality');

// Test 5: Missing fields
const space5 = mockSpace({ 
  likes: undefined, 
  downloads: undefined,
  updatedAt: undefined,
  lastModified: undefined
});
assert(!isHighQualitySpace(space5, now), 'Should handle missing fields');

// Test 6: lastModified fallback
const space6 = mockSpace({ 
  likes: 0,
  downloads: 0,
  updatedAt: undefined,
  lastModified: new Date(sixMonthsAgo).toISOString()
});
assert(isHighQualitySpace(space6, now), 'Should use lastModified fallback');

// Test 7: Quality scoring
const space7 = mockSpace({ likes: 8, downloads: 15, updatedAt: new Date(sixMonthsAgo).toISOString() });
const score = qualityScore(space7, now);
assert(score === 81, `Expected score 81, got ${score}`); // (8*2) + 15 + 50 = 81

// Test 8: Higher likes = higher score
const space8a = mockSpace({ likes: 10, downloads: 0 });
const space8b = mockSpace({ likes: 5, downloads: 0 });
assert(qualityScore(space8a, now) > qualityScore(space8b, now), 'Higher likes should give higher score');

console.log('✅ All quality filter tests passed!');
