# Frente 05: Contexto, memoria e Compaction

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Gerenciar contexto de conversa, snapshots locais auditaveis, long-term memory e Compaction da OpenAI Responses API sem misturar responsabilidades.

## Tipos de contexto

```txt
Conversation state = mensagens e tool calls da conversa atual.
Working context = snapshot do workspace/plano/card no momento da mensagem do usuario.
Attached context = objetos explicitamente anexados pelo usuario.
Long-term memory = preferencias/fatos estaveis aprovados.
External context = GitHub, arquivos indexados e outros conectores.
Runtime compaction = itens opacos da OpenAI para conversas longas eficientes.
```

## Snapshots locais

Cada mensagem do usuario deve criar um snapshot auditavel:

```txt
ai_context_snapshots
- id
- conversation_id
- message_id
- workspace_id
- plan_id nullable
- context_json
- token_estimate
- created_at
```

Conteudo do snapshot:

- usuario;
- workspace;
- plano ativo;
- colunas relevantes do board;
- cartoes relevantes, nao todos quando houver muitos;
- membros;
- preferencias;
- contexto anexado;
- resultados de capabilities de leitura;
- repositorios GitHub habilitados quando relevante.

Snapshots servem para auditoria, debug, replay, controle multi-tenant e explicabilidade. Eles nao sao substituidos por Compaction da OpenAI.

## Compaction da OpenAI

Usar Compaction da OpenAI Responses API para eficiencia de runtime em conversas longas.

Modos:

```txt
Server-side compaction:
enviar context_management com compact_threshold em /responses.

Standalone compaction:
chamar /responses/compact com uma janela completa de contexto e seguir usando a saida compactada.
```

Exemplo:

```json
{
  "model": "gpt-5.4-mini",
  "input": [],
  "store": false,
  "context_management": [
    {
      "type": "compaction",
      "compact_threshold": 120000
    }
  ]
}
```

## Politica

1. Manter snapshots locais como fonte auditavel.
2. Usar compaction em conversas longas ou com muitas tool calls.
3. Definir `compact_threshold` por modelo, plano do workspace e ambiente.
4. Tratar output de compaction da OpenAI como estado opaco de runtime.
5. Nao usar compaction para permissoes, auditoria, historico de produto ou renderizacao de UI.
6. Manter resumos legiveis por humanos quando forem uteis para suporte/debug.
7. Se usar `previous_response_id`, nao podar historico manualmente.
8. Se usar arrays de input stateless, podar apenas itens anteriores ao item de compaction mais recente.
9. Se usar `/responses/compact`, passar a saida compactada adiante como retornada.

## Armazenamento

Tabela opcional:

```txt
ai_compaction_items
- id uuid pk
- conversation_id uuid not null
- message_id uuid nullable
- openai_response_id varchar nullable
- compaction_mode varchar not null
- compact_threshold int nullable
- input_token_estimate int nullable
- output_item_ref varchar nullable
- opaque_payload_json nvarchar(max) nullable
- created_at datetimeoffset
```

Tabela de long-term memory:

```txt
ai_memories
- id
- workspace_id
- user_id nullable
- scope
- content
- source_message_id
- status: active | archived | rejected
- confidence
- created_at
- updated_at
```

Memorias sensiveis ou que alterem comportamento de escrita exigem confirmacao explicita do usuario.

## Classes sugeridas

```txt
AiContextBuilder
AiContextSnapshotService
AiContextCompactionService
AiConversationSummaryService
AiMemoryService
```

## Fora do escopo

- Tratar output de compaction como legivel por humanos.
- Usar compaction para contornar checagens locais de permissao.
- Enviar boards/arquivos inteiros quando uma busca contextual direcionada for suficiente.

## Definition of Done

- Context snapshots sao persistidos por mensagem do usuario.
- Estimativas de token sao registradas.
- Politica de threshold de compaction existe.
- Metadados de compaction da OpenAI podem ser armazenados.
- Snapshots locais continuam sendo fonte auditavel.
- Long-term memory tem status e mensagem de origem claros.

