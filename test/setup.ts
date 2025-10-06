import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
  
  console.log('✅ Test environment ready')
})

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  // Cleanup if needed
})

beforeEach(() => {
  // Reset mocks and state before each test
})

afterEach(() => {
  // Cleanup after each test
})

// Mock console methods in test environment
const originalConsole = { ...console }
global.console = {
  ...originalConsole,
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'test' && !process.env.VITEST_VERBOSE) {
      return // Suppress console.log in tests unless verbose mode
    }
    originalConsole.log(...args)
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'test' && !process.env.VITEST_VERBOSE) {
      return // Suppress console.warn in tests unless verbose mode
    }
    originalConsole.warn(...args)
  }
}
