import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

// GitHub Pages serves a static build of the same game at this project path.
export default defineConfig({
  root: resolve(projectRoot, 'github-pages'),
  base: '/my-minecraft-world/',
  publicDir: resolve(projectRoot, 'public'),
  resolve: {
    alias: { '@': projectRoot },
    dedupe: ['react', 'react-dom'],
  },
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    outDir: resolve(projectRoot, 'dist-pages'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
