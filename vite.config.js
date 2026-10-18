// Compila todas as páginas do site, inclusive o painel e as páginas auxiliares.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        inicio: resolve(process.cwd(), 'index.html'),
        administracao: resolve(process.cwd(), 'admin/index.html'),
        privacidade: resolve(process.cwd(), 'privacidade.html'),
        termos: resolve(process.cwd(), 'termos.html'),
        obrigado: resolve(process.cwd(), 'obrigado.html'),
        naoEncontrado: resolve(process.cwd(), '404.html')
      }
    }
  }
});
