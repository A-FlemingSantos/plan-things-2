# Plan Things Intelligence: briefings para agentes

Use esta pasta para delegar a implementacao de Intelligence por partes. Cada arquivo em `workstreams/` e um briefing operacional para um agente especifico.

## Instrucao obrigatoria para o agente

- Leia apenas o arquivo da frente atribuida.
- Nao abra outros documentos de planejamento, a menos que o usuario mande explicitamente.
- Implemente somente o escopo da frente atribuida.
- Respeite os contratos citados no arquivo mesmo quando outra camada ainda nao existir.
- Antes de editar codigo, rode impact analysis do GitNexus para os simbolos afetados.
- Antes de commit, rode `gitnexus_detect_changes()`.

## Mapa de frentes

1. `workstreams/01-product-experience.md`: transformar os fluxos de produto em regras implementaveis para UI, backend e tools.
2. `workstreams/02-frontend-ui-contract.md`: criar o contrato visual/mockado da UI de Intelligence.
3. `workstreams/03-backend-conversation-streaming.md`: implementar conversa, mensagens, Responses API e SSE.
4. `workstreams/04-model-tools-routing.md`: implementar model-facing tools, capabilities internas, propostas e apply.
5. `workstreams/05-context-memory-compaction.md`: implementar contexto, snapshots, memoria e Compaction.
6. `workstreams/06-file-search.md`: implementar busca de arquivos, indexacao e blocos de arquivo.
7. `workstreams/07-github-integration.md`: implementar GitHub App, busca de commits/PRs e links externos.
8. `workstreams/08-database-schema.md`: implementar migrations e persistencia de Intelligence.
9. `workstreams/09-security-permissions-audit.md`: implementar permissoes, governanca, segredos e auditoria.
10. `workstreams/10-testing-evals.md`: implementar testes, evals e smoke checks.

## Linguagem comum

- `proposal`: mudanca pendente, revisavel e ainda nao aplicada.
- `entity reference`: objeto real persistido e navegavel.
- `model-facing tool`: tool enviada ao modelo.
- `capability interna`: operacao granular do backend.
- `apply`: acao disparada pelo frontend apos aprovacao do usuario e revalidada no backend.
- `snapshot`: contexto local auditavel do Plan Things.
- `compaction`: estado opaco da OpenAI para continuidade de runtime, nao auditoria.

## Limites globais

- Frontend nunca chama OpenAI diretamente.
- Modelo nunca recebe tools de apply no MVP.
- Toda escrita real passa por proposta, aprovacao humana e revalidacao no backend.
- Markdown renderiza narrativa; objetos reais e propostas usam blocos estruturados.
- File Search, GitHub e outros provedores nunca substituem permissoes locais.
