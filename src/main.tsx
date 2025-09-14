import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { validateConfig, config } from './lib/config'

// Validate environment variables at application startup
const validation = validateConfig(config);
if (!validation.isValid) {
  console.error('❌ Configuration validation failed:');
  validation.errors.forEach(error => {
    console.error(`  - ${error}`);
  });
  
  // In development, show detailed error information
  if (import.meta.env.DEV) {
    console.warn('⚠️  Application will continue with limited functionality');
    console.warn('📝 Please check your .env file and ensure all required variables are set');
  } else {
    // In production, you might want to show a user-friendly error page
    console.error('🚨 Critical configuration errors detected in production');
  }
} else {
  console.log('✅ Configuration validation passed');
}

createRoot(document.getElementById("root")!).render(<App />);
