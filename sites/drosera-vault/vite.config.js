import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        genetics: resolve(__dirname, 'genetics.html'),
        cultivation: resolve(__dirname, 'cultivation.html')
      }
    }
  }
});
