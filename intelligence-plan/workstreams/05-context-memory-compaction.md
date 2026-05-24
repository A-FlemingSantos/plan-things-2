# Frente 05: Contexto, memoria e Compaction

## Missao do agente

Implemente a estrategia de contexto do Intelligence: snapshots locais auditaveis, selecao de contexto por mensagem, memoria de longo prazo e Compaction da OpenAI para conversas longas.

Nao trate Compaction como auditoria. A auditoria e local; Compaction e runtime opaco.

## Tipos de contexto

Use estes nomes no codigo e nos contratos:

```txt
Conversation state = mensagens e tool calls da conversa atual.
Working context = snapshot do workspace/plano/card no momento da mensagem.
Attached context = objetos explicitamente anexados pelo usuario.
Long-term memory = preferencias/fatos estaveis aprovados.
External context = GitHub, arquivos indexados e outros conectores.
Runtime compaction = itens opacos da OpenAI para conversas longas.
```

## Snapshot local

Crie snapshot para cada mensagem do usuario:

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

Inclua no snapshot:

- usuario;
- workspace;
- plano/card ativo quando houver;
- colunas relevantes;
- cards relevantes, nao todos;
- membros relevantes;
- preferencias usadas;
- contexto anexado;
- resultados de capabilities de leitura;
- repos GitHub habilitados quando relevante;
- estimativa de tokens.

O snapshot deve explicar o que foi usado ou considerado. Para boards grandes, salve top resultados e parametros de busca, nao o board inteiro.

## Compaction da OpenAI

Use Compaction da Responses API para reduzir custo/latencia em conversas longas.

Modos suportados:

```txt
Server-side compaction = context_management com compact_threshold.
Standalone compaction = /responses/compact com janela completa.
```

Exemplo conceitual:

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

O item de compaction retornado e opaco. Nao interprete, nao resuma e nao use para explicar decisoes ao usuario.

## Politica para MVP

- Comece com snapshots locais.
- Use resumo proprio simples quando a conversa ficar longa.
- Ative `context_management` acima do threshold configurado.
- Adie `/responses/compact` standalone ate haver necessidade real.
- Registre metadados de compaction mesmo que o payload opaco nao seja salvo.
- Se usar `previous_response_id`, nao pode podar historico manualmente.
- Se usar input-array stateless, pode podar apenas antes do item de compaction mais recente.

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

Memoria:

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

Memorias sensiveis, comportamentais ou que alterem escrita exigem confirmacao explicita.

## Classes alvo

```txt
AiContextBuilder
AiContextSnapshotService
AiContextCompactionService
AiConversationSummaryService
AiMemoryService
```

Responsabilidades:

- `AiContextBuilder`: monta contexto permissionado.
- `AiContextSnapshotService`: persiste snapshot auditavel.
- `AiContextCompactionService`: decide threshold e registra metadados.
- `AiConversationSummaryService`: cria resumo legivel local.
- `AiMemoryService`: gerencia candidatos, aprovacao e arquivamento.

## Limites desta frente

- Nao envie boards/arquivos inteiros quando busca direcionada for suficiente.
- Nao use compaction para permissao.
- Nao use compaction para renderizacao historica.
- Nao guarde segredo/token em memoria.

## Aceite

- Snapshot e salvo por mensagem do usuario.
- Token estimate e registrado.
- Politica de threshold existe.
- Metadados de compaction podem ser persistidos.
- Snapshot local continua fonte auditavel.
- Long-term memory possui status e origem.
