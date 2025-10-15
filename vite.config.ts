import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    port: 5173,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-tooltip', '@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-collapsible'],
          'utils-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          
          // Feature chunks
          'workflow-features': [
            './src/components/tabs/WorkflowTab.tsx',
            './src/lib/workflowMatcher.ts',
            './src/lib/workflowGeneratorSimplified.ts'
          ],
          'agent-features': [
            './src/components/tabs/AgentTab.tsx',
            './src/lib/services/agentGenerator.ts'
          ],
          'llm-features': [
            './src/components/tabs/LLMTab.tsx',
            './src/lib/services/promptGenerator.ts'
          ],
          'cache-services': [
            './src/lib/services/cacheManager.ts',
            './src/lib/services/analysisCacheService.ts',
            './src/lib/services/simpleCache.ts'
          ],
          'ui-components': [
            './src/components/ui/StatusBadge.tsx',
            './src/components/ui/CollapsibleSection.tsx'
          ],
          'services': [
            './src/lib/workflowIndexerUnified.ts',
            './src/lib/trendAnalysis.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
      '@radix-ui/react-collapsible'
    ],
  },
});
