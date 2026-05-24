# Plan Things Intelligence: frentes de trabalho

Esta pasta divide a implementacao de Intelligence em frentes pequenas, autossuficientes e executaveis por agentes separados.

Cada arquivo deve conter contexto suficiente para implementar aquela parte sem abrir outro documento de planejamento. A intencao e reduzir janela de contexto, evitar mistura de responsabilidades e manter cada agente concentrado no contrato que precisa entregar.

## Como usar

- Escolha apenas uma frente por agente.
- Trate o arquivo escolhido como o briefing completo da tarefa.
- Nao amplie escopo sem pedido explicito do usuario.
- Preserve os limites definidos no arquivo: UI nao deve inventar contrato backend, backend nao deve chamar OpenAI pelo frontend, tools nao devem aplicar mudancas sem aprovacao.
- Prefira padroes, servicos e rotas existentes no projeto.
- Antes de editar codigo, rode impact analysis do GitNexus para os simbolos afetados.
- Mantenha a implementacao incremental, testavel e facil de reverter.

## Frentes

1. `workstreams/01-product-experience.md`: comportamento do produto, fluxos e limites de UX.
2. `workstreams/02-frontend-ui-contract.md`: contrato visual, blocos interativos e composer.
3. `workstreams/03-backend-conversation-streaming.md`: conversas, mensagens, Responses API e SSE.
4. `workstreams/04-model-tools-routing.md`: tools expostas ao modelo, capabilities internas, propostas e apply.
5. `workstreams/05-context-memory-compaction.md`: snapshots, contexto, memoria e Compaction.
6. `workstreams/06-file-search.md`: arquivos, metadados, vector stores e blocos de arquivo.
7. `workstreams/07-github-integration.md`: GitHub App, commits, PRs, webhooks e links externos.
8. `workstreams/08-database-schema.md`: migrations e persistencia das entidades de Intelligence.
9. `workstreams/09-security-permissions-audit.md`: permissoes, governanca, segredos e auditoria.
10. `workstreams/10-testing-evals.md`: testes automatizados, evals e QA manual.

## Regra de alinhamento

As frentes devem falar a mesma linguagem:

- `proposal` significa algo pendente, revisavel e ainda nao aplicado.
- `entity reference` significa objeto real persistido e navegavel.
- `model-facing tool` significa tool enviada ao modelo.
- `capability interna` significa operacao granular do backend.
- `apply` sempre acontece por acao do usuario no frontend e revalidacao do backend.
