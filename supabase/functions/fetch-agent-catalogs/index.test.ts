import { assertEquals, assertFalse, assertTrue } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { isHighQualitySpace, qualityScore, type HfSpace } from "./index.ts";

// Test data
const now = Date.now();
const twelveMonthsAgo = now - (365 * 24 * 60 * 60 * 1000);
const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);
const twoYearsAgo = now - (730 * 24 * 60 * 60 * 1000);

const mockSpace = (overrides: Partial<HfSpace> = {}): HfSpace => ({
  id: "test/space",
  likes: 0,
  downloads: 0,
  updatedAt: new Date(twoYearsAgo).toISOString(),
  tags: [],
  ...overrides,
});

Deno.test("isHighQualitySpace - passes with high likes", () => {
  const space = mockSpace({ likes: 10 });
  assertTrue(isHighQualitySpace(space, now));
});

Deno.test("isHighQualitySpace - passes with recent update", () => {
  const space = mockSpace({ 
    likes: 0, 
    updatedAt: new Date(sixMonthsAgo).toISOString() 
  });
  assertTrue(isHighQualitySpace(space, now));
});

Deno.test("isHighQualitySpace - passes with downloads", () => {
  const space = mockSpace({ 
    likes: 0, 
    downloads: 5,
    updatedAt: new Date(twoYearsAgo).toISOString()
  });
  assertTrue(isHighQualitySpace(space, now));
});

Deno.test("isHighQualitySpace - fails with old, low-quality space", () => {
  const space = mockSpace({ 
    likes: 2, 
    downloads: 0,
    updatedAt: new Date(twoYearsAgo).toISOString()
  });
  assertFalse(isHighQualitySpace(space, now));
});

Deno.test("isHighQualitySpace - handles missing fields gracefully", () => {
  const space = mockSpace({ 
    likes: undefined, 
    downloads: undefined,
    updatedAt: undefined,
    lastModified: undefined
  });
  assertFalse(isHighQualitySpace(space, now));
});

Deno.test("isHighQualitySpace - uses lastModified as fallback", () => {
  const space = mockSpace({ 
    likes: 0,
    downloads: 0,
    updatedAt: undefined,
    lastModified: new Date(sixMonthsAgo).toISOString()
  });
  assertTrue(isHighQualitySpace(space, now));
});

Deno.test("qualityScore - higher likes = higher score", () => {
  const space1 = mockSpace({ likes: 10, downloads: 0 });
  const space2 = mockSpace({ likes: 5, downloads: 0 });
  
  const score1 = qualityScore(space1, now);
  const score2 = qualityScore(space2, now);
  
  assertTrue(score1 > score2);
});

Deno.test("qualityScore - recent updates get boost", () => {
  const space1 = mockSpace({ 
    likes: 5, 
    downloads: 0,
    updatedAt: new Date(sixMonthsAgo).toISOString()
  });
  const space2 = mockSpace({ 
    likes: 5, 
    downloads: 0,
    updatedAt: new Date(twoYearsAgo).toISOString()
  });
  
  const score1 = qualityScore(space1, now);
  const score2 = qualityScore(space2, now);
  
  assertTrue(score1 > score2);
  assertEquals(score1 - score2, 50); // recency boost
});

Deno.test("qualityScore - downloads contribute to score", () => {
  const space1 = mockSpace({ likes: 5, downloads: 10 });
  const space2 = mockSpace({ likes: 5, downloads: 0 });
  
  const score1 = qualityScore(space1, now);
  const score2 = qualityScore(space2, now);
  
  assertTrue(score1 > score2);
  assertEquals(score1 - score2, 10); // downloads difference
});

Deno.test("qualityScore - handles missing fields", () => {
  const space = mockSpace({ 
    likes: undefined, 
    downloads: undefined,
    updatedAt: undefined
  });
  
  const score = qualityScore(space, now);
  assertEquals(score, 0);
});

Deno.test("qualityScore - complex scoring example", () => {
  const space = mockSpace({ 
    likes: 8,
    downloads: 15,
    updatedAt: new Date(sixMonthsAgo).toISOString()
  });
  
  const score = qualityScore(space, now);
  // Expected: (8 * 2) + 15 + 50 = 16 + 15 + 50 = 81
  assertEquals(score, 81);
});
