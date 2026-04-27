import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import svgr from '@svgr/rollup';
import path from 'path';

const VENDOR_CHUNKS: Record<string, string[]> = {
  'react-vendor': ['react', 'react-dom'],
  'router-vendor': ['react-router-dom'],
  'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
  'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
  'monitoring-vendor': ['@sentry/react'],
};

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    svgr(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (!id.includes('node_modules')) return null;
          for (const [chunk, deps] of Object.entries(VENDOR_CHUNKS)) {
            if (deps.some(dep => id.includes(`/node_modules/${dep}/`))) {
              return chunk;
            }
          }
          return null;
        },
      },
    },
  },
});
