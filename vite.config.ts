import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

<<<<<<< HEAD
=======
// https://vitejs.dev/config/
>>>>>>> 0957004f30f6f7c38f51db8ac1e815be043b5909
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
<<<<<<< HEAD
  build: {
    rollupOptions: {
      output: {
        // Split CRM into its own chunk — website visitors don't download it
        manualChunks: {
          'crm': [
            './src/crm/CRMApp.tsx',
          ],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
=======
>>>>>>> 0957004f30f6f7c38f51db8ac1e815be043b5909
});
