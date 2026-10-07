# bondschat-mvp

Painel de atendimento por WhatsApp. React + Vite + Tailwind v4 + shadcn/ui, consumindo a API do backend Elysia que vive em `~/Projetos/elysia-rag-api`.

## Rodar

O backend precisa estar no ar. Ele espera `localhost:4174` na lista de CORS e de `trustedOrigins`, entao a porta do Vite esta fixada em 4174 e nao deve mudar sem mexer em `apps/backend/src/app/cors.ts` e `apps/backend/src/modules/auth/auth.ts`.

```bash
bun install
bun run dev            # http://localhost:4174
```

Variavel de ambiente: copie `.env.example` para `.env` se a API nao estiver em `http://localhost:3000`. Nunca coloque segredo aqui, tudo com prefixo `VITE_` vai para o bundle.

## Scripts

| Script | O que faz |
| --- | --- |
| `bun run dev` | Servidor de desenvolvimento na 4174 |
| `bun run build` | Gera as rotas, typecheca e monta o bundle de produção |
| `bun run typecheck` | `tsr generate` seguido de `tsc -b` |
| `bun run lint` | oxlint |
| `bun run check` | lint e typecheck juntos, é o que roda antes de commit |
| `bun run verify:app` | Percorre o fluxo inteiro num Chromium de verdade contra o backend de verdade |
| `bun run seed:leads` | Cria instância, conversa, lead e mensagens direto no banco |

`routeTree.gen.ts` é gerado pelo plugin do TanStack Router e está no `.gitignore`. O `tsc` roda depois do `tsr generate` porque o build precisa da árvore de rotas antes de tipar.

## Verificação

```bash
bun run verify:app
```

Exige o backend em `:3000`, o app em `:4174` e o smtp4dev em `:5080` para o cadastro com OTP. Cria uma conta nova a cada execução, então o `phone_number` precisa ser único (o backend tem índice único global nessa coluna).

Para a tela de leads, que depende de dados que só nascem pelo webhook do WhatsApp:

```bash
bun run seed:leads <email>
bun run verify-leads <email> <senha>
```

## Regras do repositório

**Comentários e texto de interface em português sem acento.** Comentários explicam o porquê que o código não mostra, nunca narram a linha seguinte. Nenhum comentário tipo `// renderiza a lista`.

**Imports pelo alias `@/`.** Nunca caminho relativo atravessando pastas.

**Tailwind v4 por utilitário no JSX.** Nenhum arquivo de CSS novo além de `src/index.css`. Evite `style={{}}`.

**Estado de servidor sempre no TanStack Query.** `src/features/<domínio>/queries.ts` para leituras e `mutations.ts` para escritas. Nunca espelhe dado remoto em `useState` nem no Zustand.

**A API só passa por `src/api/client.ts`.** Nunca chame `fetch` direto, nem em componente. Toda resposta é validada por um schema Zod de `src/api/types.ts` no momento da fronteira, então nada de `as` em dado vindo da rede. `ApiError.message` já vem normalizado: nunca cheque se é array ou string.

**Sessão só pelo Better Auth.** Importe `authClient` de `src/lib/auth-client.ts`. Depois de um sign-in, grave a sessão no cache com `setQueryData`; invalidar não basta, porque o guard de rota lê por `ensureQueryData` e devolveria o `null` antigo.

**Zustand guarda só estado de interface.** `selectedInstanceId` e `sidebarOpen`, nada mais.

**Componentes shadcn são copiados, não importados.** Edite `src/components/ui/*` à vontade.

**Ações por estado de lead saem de `LEAD_LIFECYCLE`.** Não rederive `canAssign`, `canClose` ou `canSendMessage` com condicionais na tela.

**Criação de instância manda `agenda_enabled: false`.** O backend recusa `true` na criação; a agenda só liga depois do onboarding.

**Catálogo de onboarding é frontend e trava por teste.** O backend não expõe as perguntas, então as 51 chaves de `src/features/onboarding/catalog.ts` têm que acompanhar `BEHAVIORAL_FIELD_KEYS`; `catalog.test.ts` quebra se divergir. Não copie `human_handoff` nem `handoff_information` da referência, o backend recusa com 400.

**Upload é presign, PUT direto e confirm.** O PUT vai ao Supabase com `fetch` fora de `src/api/client.ts` porque o destino não é a API. A lista recarrega por `refetchInterval` condicional, nunca `setInterval` em componente.