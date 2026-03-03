import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['node-pty'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  publicDir: 'assets',
  build: {
    outDir: 'dist/renderer',
  },
});
