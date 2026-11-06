import { defineConfig } from 'transone-cli';
import { docRoutes } from './src/content';

export default defineConfig({
  entry: 'src/main.ts',
  pages: Object.fromEntries(docRoutes.filter((route) => route !== '/').map((route) => [route, 'src/main.ts'])),
  server: { port: 52314 },
  build: { outDir: 'dist', basePath: '', directoryPages: true },
});
