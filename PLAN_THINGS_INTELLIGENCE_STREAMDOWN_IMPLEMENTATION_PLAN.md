# Plan Things Intelligence: Streamdown Markdown Implementation Plan

Data de referencia: 2026-05-30

Este documento detalha a implementacao de markdown streaming robusto no frontend de Intelligence, usando `streamdown` com rollout seguro.

## 1. Objetivo

Resolver problemas de renderizacao durante streaming:

- markdown literal temporario (ex.: `**`, headers, fences)
- listas com bullets/numeracao inconsistentes durante delta streaming
- jank visual por reparse excessivo durante respostas longas

Objetivo de produto:

- manter UX fluida em `IntelligenceChat` e painel IA do `KanbanBoard`
- preservar seguranca de renderizacao
- reduzir regressao com feature flag e fallback rapido

## 2. Escopo tecnico (frontend)

Arquivos principais:

- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.jsx`
- `apps/web/src/features/intelligence/components/IntelligenceConversationThread/IntelligenceConversationThread.jsx`
- `apps/web/src/features/intelligence/hooks/useAiConversation.js`
- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.module.css`
- `apps/web/src/shared/styles/globals.css`
- `apps/web/src/main.jsx`
- `apps/web/package.json`

Sem mudanca de protocolo SSE neste plano. O backend ja envia `assistant.delta`, `assistant.completed`, `assistant.failed`.

## 3. Estrategia de implementacao

### 3.1 Trilha de baixo risco

- integrar `streamdown` apenas no renderer markdown
- manter reconciliacao final por `assistant.completed` + refresh de mensagens
- habilitar por feature flag (rollback instantaneo)
- manter fallback para renderer atual quando necessario

### 3.2 Trilha de alta fidelidade

- usar modo `streaming` em mensagens `PENDING/STREAMING`
- usar modo `static` em mensagens `COMPLETED`
- ativar animacao apenas durante stream (`isAnimating`)
- aplicar guardrails de CSS para listas e espacos

## 4. Plano em 3 etapas

### Etapa 1: Baseline e preparacao

Objetivo:

- estabelecer baseline de flicker/performance antes da troca
- preparar feature flag e cenarios de teste

Tarefas:

1. Criar flag em frontend (ex.: `VITE_INTELLIGENCE_STREAMDOWN=true`).
2. Mapear estado de streaming por mensagem (`PENDING`, `STREAMING`, `COMPLETED`).
3. Definir corpus de prompts para validacao:
   - listas simples e longas
   - listas aninhadas
   - code fences incompletas e completas
   - links incompletos
4. Registrar baseline manual com as duas superficies:
   - `/workspace/chat`
   - painel IA no `KanbanBoard`

Entrega:

- baseline documentado + flag pronta para canario

### Etapa 2: Integracao Streamdown

Objetivo:

- trocar renderer markdown mantendo comportamento atual de conversa

Tarefas:

1. Instalar dependencia:
   - `streamdown` em `apps/web`
2. Importar estilos:
   - `import 'streamdown/styles.css'` em `src/main.jsx`
3. Atualizar `MarkdownBlock.jsx`:
   - substituir `react-markdown` por `Streamdown`
   - props recomendadas:
     - `mode="streaming"` para mensagem em stream
     - `mode="static"` para mensagem concluida
     - `isAnimating={true}` apenas enquanto streama
     - `animated` habilitado
     - `remend={{ linkMode: 'text-only' }}` para evitar links parciais clicaveis
4. Passar sinal de streaming de `IntelligenceConversationThread` para `MarkdownBlock`.
5. Preservar fallback:
   - se flag desativada, usar renderer atual.

Entrega:

- Streamdown funcional com toggle por feature flag

### Etapa 3: Hardening de UX e estabilidade

Objetivo:

- eliminar regressao de listas e melhorar custo de render

Tarefas:

1. Ajustar CSS de markdown:
   - garantir `ul/ol` com `list-style` no escopo do markdown
   - garantir `white-space: normal` no container markdown
2. Revisar reset global:
   - hoje `ul, ol { list-style: none; }` em `globals.css`
   - garantir override local em `MarkdownBlock.module.css`
3. Validar conflitos de ancestral com `white-space: pre-wrap` (especialmente em wrappers de mensagem).
4. Rodar regressao visual nos cenarios do corpus.
5. Consolidar regra operacional:
   - qualquer regressao critica => rollback de flag.

Entrega:

- rollout pronto com criterios objetivos de Go/No-Go

## 5. Criterios de aceite

### 5.1 Flicker

- sem piscadas perceptiveis em respostas longas no fluxo normal
- reducao visivel de markdown literal temporario durante stream

### 5.2 Listas

- bullets e numeracao renderizados corretamente durante e apos stream
- sem marcador isolado em linha separada
- sem perda de hierarquia em listas aninhadas validas

### 5.3 Code fences

- bloco de codigo nao deve "quebrar" layout durante abertura/fechamento
- conteudo final apos `assistant.completed` deve estar consistente com texto acumulado

### 5.4 Custo de render

- sem travamento perceptivel do input/composer durante stream
- reducao de re-renders custosos vs baseline em respostas longas
- manter responsividade no painel IA do Kanban e na pagina de chat dedicada

## 6. Rollout recomendado

1. Deploy com flag desligada.
2. Ativar flag para ambiente de teste interno.
3. Validar corpus completo nos dois entrypoints.
4. Ativar para pequena parcela de usuarios.
5. Expandir gradualmente.

Rollback:

- desligar flag para voltar ao renderer atual sem rollback de deploy.

## 7. Riscos e mitigacoes

Risco: estilo quebrado por dependencia de tokens/CSS base.
Mitigacao: validar tema atual e sobrescrever apenas no escopo do bloco.

Risco: regressao de listas por `white-space` herdado.
Mitigacao: forcar `white-space: normal` no container markdown e revisar ancestrais.

Risco: diferenca visual entre streaming e completed.
Mitigacao: consolidar estado final sempre via mensagem persistida no backend.

Risco: incompatibilidade com plugins markdown atuais.
Mitigacao: comecar sem plugins opcionais (code/math/mermaid) e adicionar por fase.

## 8. Fontes consultadas

- Streamdown README (GitHub): https://github.com/vercel/streamdown/blob/main/packages/streamdown/README.md
- Streamdown docs (Usage): https://streamdown.ai/docs/usage
- Streamdown docs (Getting Started): https://streamdown.ai/docs/getting-started
- Streamdown docs (Unterminated parsing / remend): https://streamdown.ai/docs/termination
- NPM streamdown: https://www.npmjs.com/package/streamdown
- Issue Streamdown #68 (listas + `white-space: pre-wrap`): https://github.com/vercel/streamdown/issues/68
- Issue Streamdown #158 (espacamento/tabelas + `white-space`): https://github.com/vercel/streamdown/issues/158
- Issue Streamdown #475 (listas com quebra e wrappers): https://github.com/vercel/streamdown/issues/475
- OpenAI Streaming Responses guide: https://developers.openai.com/api/docs/guides/streaming-responses
- OpenAI migrate-to-responses guide: https://developers.openai.com/api/docs/guides/migrate-to-responses
