# Sunset Stories — projeto completo

Versão editável do site Sunset Stories para abrir e modificar no Visual Studio Code. O pacote inclui as páginas públicas, a área administrativa, imagens e marcas do projeto, regras do Firebase e a documentação técnica disponível.

## Requisitos

- Node.js 18 ou superior
- npm
- VS Code (recomendado)

## Rodar localmente

1. Extraia o ZIP e abra a pasta `Sunset_Stories_VSCode` no VS Code.
2. No terminal integrado, execute `npm install`.
3. Copie `.env.example` para `.env.local`.
4. Inicie com `npm run dev` e abra o endereço indicado no terminal.

O Vite lê `.env.local` automaticamente. Variáveis `VITE_*` são inseridas no JavaScript do navegador durante a compilação: não coloque senhas, chaves privadas ou credenciais de servidor nelas. A configuração Web do Firebase é pública por natureza; restrinja o acesso com Authentication, regras do Firestore/Storage e restrições da chave no Google Cloud.

## Comandos

- `npm run dev` — servidor local com atualização automática.
- `npm run build` — gera a versão estática em `dist/`.
- `npm run preview` — abre localmente a versão compilada.

## Estrutura

- `index.html`, `style.css`, `app.js` — Home e experiência pública.
- `public/assets/` — imagens, miniaturas e marcas copiadas para a versão publicada.
- `admin/` — painel administrativo e estilos (entrada própria na compilação multipágina).
- `admin/admin.js` — conteúdo, imagens, ajustes e integração do painel.
- `firebase-auth.js` — autenticação, conta, preferências, dados e Analytics com consentimento.
- `privacidade.html`, `termos.html`, `obrigado.html`, `404.html` — páginas auxiliares.
- `firestore.rules`, `storage.rules`, `firebase.json` — regras e hospedagem Firebase.
- `vite.config.js` — compilação da Home, do painel e das páginas auxiliares.
- `docs/` — documentação técnica do projeto, quando incluída.

Os comentários adicionados e os existentes estão em português quando possível. Os nomes das APIs do Firebase, do navegador e alguns identificadores técnicos permanecem no original para evitar incompatibilidade.

## Firebase

1. Confira `.env.local` e os dados do app Web no Console do Firebase.
2. Em Authentication, habilite E-mail/senha e autorize o domínio usado pelo site.
3. Publique as regras com o Firebase CLI:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,storage
   ```

4. Para publicar a hospedagem Firebase após `npm run build`:

   ```bash
   npx firebase-tools deploy --only hosting
   ```

O painel requer uma conta de administrador autorizada pelas regras existentes. Criar uma conta comum não concede permissões administrativas.

## Upload de imagens

O painel aponta por padrão para a API de mídia já configurada no projeto. Para usar outro serviço, altere `VITE_ADMIN_API_BASE` em `.env.local`. Se o novo serviço tiver outro domínio, atualize a política CSP (`Content-Security-Policy`) em `index.html` e `admin/index.html`, incluindo o domínio em `connect-src`.

## Antes de publicar em outro domínio

Atualize canonical, sitemap, metadados de compartilhamento e domínios autorizados do Firebase. As imagens, textos e marcas foram preservados da versão atual do Sunset Stories; confira os termos de uso de materiais de terceiros antes de republicar.
