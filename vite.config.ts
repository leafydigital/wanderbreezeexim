import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Only ever list actual npm packages here, never an app entry file
        // (e.g. CRMApp.tsx) — forcing an entry into its own manual chunk can
        // pull in its own copy of React's internals, landing in a chunk that
        // loads before/without the shared vendor-react chunk having run yet,
        // which is what throws "Cannot read properties of undefined
        // (reading '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')".
        // Route-level code splitting (React.lazy / dynamic import) is the
        // safe way to keep CRM out of the main bundle, not manualChunks.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});