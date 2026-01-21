# Deploy do Web Admin na Vercel (com backend na Vercel)

## Variáveis de ambiente (no projeto do Admin)
- BACKEND_URL = https://SEU-BACKEND.vercel.app
- NEXT_PUBLIC_API_BASE_URL = (vazio)

> O Admin chama sempre /api/* e faz proxy via Next rewrites.

## Teste rápido
Após deploy, abra no navegador:
- https://SEU-ADMIN.vercel.app/api/health (se existir)
ou
- https://SEU-ADMIN.vercel.app/api/auth/login (deve responder 405/400, mas NÃO 404)

Se aparecer 404 em /api/*, o rewrite não está ativo ou BACKEND_URL está errado.
