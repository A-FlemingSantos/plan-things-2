# Frente 03: Conversa e streaming no backend

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Criar a base backend para conversas do Intelligence, persistencia de mensagens, chamadas para OpenAI Responses API e streaming por Server-Sent Events para o app web.

## Pacote

Pacote sugerido:

```txt
services/api/src/main/java/com/planthings/api/intelligence
```

Classes sugeridas:

```txt
AiConversationController
AiConversationService
AiStreamingService
AiOpenAiClient
AiPromptBuilder
AiBlockFactory
AiAuditService
```

## Endpoints de API

Endpoints iniciais:

```txt
POST /api/intelligence/conversations
GET  /api/intelligence/conversations/{conversationId}
GET  /api/intelligence/conversations/{conversationId}/messages
POST /api/intelligence/conversations/{conversationId}/messages
GET  /api/intelligence/conversations/{conversationId}/stream
```

Endpoints de acao pertencem a frente de tools/propostas, mas precisam ser compativeis:

```txt
POST /api/intelligence/actions/{proposalId}/apply
POST /api/intelligence/actions/{proposalId}/reject
```

## Runtime OpenAI

Usar `gpt-5.4-mini` via Responses API. O frontend nunca deve chamar OpenAI diretamente.

Configuracao:

```yaml
planthings:
  intelligence:
    enabled: true
    model: gpt-5.4-mini
    reasoning-effort: low
    max-output-tokens: 6000
    store-openai-responses: false
```

## Eventos de streaming

Usar SSE entre backend e frontend.

Nomes de eventos:

```txt
message.created
assistant.delta
tool.started
tool.completed
tool.failed
proposal.created
entity.created
entity.updated
block.created
assistant.completed
assistant.failed
```

Regras:

- deltas sao para streaming narrativo;
- blocos estruturados devem ser emitidos como eventos explicitos de bloco/proposta/entidade;
- persistir antes de transmitir quando possivel;
- incluir ids suficientes para o frontend reconciliar UI otimista.

## Requisitos de persistencia

Persistir:

- conversas;
- mensagens do usuario;
- mensagens do assistente;
- blocos de mensagem;
- OpenAI response id;
- uso de tokens;
- erros;
- status de streaming.

## Tratamento de erros

Tratar:

- timeout da OpenAI;
- rate limit da OpenAI;
- resposta invalida do modelo;
- desconexao SSE;
- usuario sem permissao;
- conversa nao encontrada;
- feature desabilitada.

Retry nao deve duplicar mensagens do usuario nem acoes aplicadas.

## Fora do escopo

- Indexacao de File Search.
- Integracao GitHub App.
- Roteamento completo de acoes.
- Long-term memory.

## Definition of Done

- Conversa pode ser criada e carregada.
- Mensagem do usuario pode ser enviada.
- Backend chama OpenAI via cliente server-side.
- Resposta do assistente chega ao frontend via SSE.
- Mensagens e blocos sao persistidos.
- Estados de retry/erro sao representados.
- Nenhuma API key chega ao browser.

