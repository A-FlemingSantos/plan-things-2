# Streamdown no Intelligence: Estado do Codebase

Data de referencia: 2026-05-31

Este documento registra apenas o estado tecnico do codebase em relacao ao uso de Streamdown no frontend de Intelligence.

## Estado atual

A integracao de Streamdown esta implementada no app web.

Arquivos relevantes:

- `apps/web/package.json`
  - dependencia `streamdown` instalada.
- `apps/web/src/main.jsx`
  - import global de `streamdown/styles.css`.
- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.jsx`
  - feature flag `VITE_INTELLIGENCE_STREAMDOWN`;
  - fallback para `react-markdown`;
  - uso de `Streamdown` quando a flag esta ativa;
  - `mode="streaming"` durante stream;
  - `mode="static"` quando a mensagem nao esta em stream;
  - `animated` e `isAnimating`;
  - `remend={{ linkMode: 'text-only' }}`;
  - renderizacao segura de links externos via `target="_blank"` e `rel="noopener noreferrer"`.
- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.module.css`
  - ajustes locais para markdown, incluindo listas, titulos, tabelas, quotes, `code`, `pre`, links e quebra de texto.
- `apps/web/src/features/intelligence/hooks/useAiConversation.js`
  - aplicacao de deltas de `assistant.delta`;
  - refresh final em `assistant.completed`;
  - preservacao de texto parcial local enquanto a persistencia final ainda nao aparece no polling.
- `apps/web/src/features/intelligence/hooks/useAiStream.js`
  - consumo do stream SSE via `fetch` e `ReadableStream`.

## Testes existentes

Cobertura ja presente:

- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.test.jsx`
  - fallback para `react-markdown` quando a flag esta desligada;
  - Streamdown em modo `streaming`;
  - Streamdown em modo `static`.
- `apps/web/src/features/intelligence/hooks/useAiConversation.test.js`
  - hidratacao da mensagem final apos `assistant.completed`;
  - preservacao de texto parcial durante polling;
  - preservacao de `contextSnapshot` local ao recarregar mensagens.

## Pendencias tecnicas no codebase

Nao ha pendencia de integracao principal do Streamdown.

A unica pendencia tecnica relacionada, caso o objetivo seja endurecer o streaming em producao, esta no transporte SSE:

- `useAiStream.js` hoje abre o stream e reporta erro via `onError`;
- nao ha politica de reconnect;
- nao ha retry/backoff;
- nao ha recuperacao automatica quando a conexao cai no meio da resposta.

Essa pendencia nao e especifica do renderer Streamdown. Ela pertence ao fluxo geral de streaming do chat.

## Conclusao

Do ponto de vista do codebase, o rollout tecnico de Streamdown esta concluido.

O que resta como possivel trabalho de codigo e opcional e separado: melhorar a resiliencia do transporte SSE.
