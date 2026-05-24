# Frente 03: Conversa e streaming no backend

## Missao do agente

Implemente a base backend de conversas do Intelligence: criar conversa, receber mensagem, chamar OpenAI Responses API server-side, persistir mensagens/blocos e transmitir eventos SSE para o app web.

Esta frente cria o trilho da conversa. Nao implemente tools mutantes, File Search, GitHub App ou long-term memory aqui.

## Pacote alvo

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

Responsabilidades:

- `AiConversationController`: endpoints HTTP.
- `AiConversationService`: ciclo de vida de conversa/mensagem.
- `AiOpenAiClient`: detalhes da Responses API.
- `AiStreamingService`: SSE e reconciliacao de eventos.
- `AiPromptBuilder`: prompt/input inicial sem regra de negocio mutante.
- `AiBlockFactory`: cria blocos persistiveis.
- `AiAuditService`: eventos basicos de uso/erro.

## Endpoints

Implemente ou prepare:

```txt
POST /api/intelligence/conversations
GET  /api/intelligence/conversations/{conversationId}
GET  /api/intelligence/conversations/{conversationId}/messages
POST /api/intelligence/conversations/{conversationId}/messages
GET  /api/intelligence/conversations/{conversationId}/stream
```

Mantenha compatibilidade futura com:

```txt
POST /api/intelligence/actions/{proposalId}/apply
POST /api/intelligence/actions/{proposalId}/reject
```

`POST /messages` pode retornar `messageId` rapidamente e iniciar execucao assincrona. O frontend acompanha pelo stream da conversa.

## OpenAI runtime

Use `gpt-5.4-mini` via Responses API. O frontend nunca chama OpenAI diretamente.

Configuracao esperada:

```yaml
planthings:
  intelligence:
    enabled: true
    model: gpt-5.4-mini
    reasoning-effort: low
    max-output-tokens: 6000
    store-openai-responses: false
```

Use `store: false`, salvo decisao explicita em contrario. O banco local e a fonte da UI e auditoria; ids da OpenAI sao runtime.

## Eventos SSE

Emita eventos com ids estaveis:

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

- deltas servem para narrativa;
- blocos estruturados entram por eventos explicitos;
- persista antes de emitir sempre que possivel;
- reconexao/retry nao pode duplicar mensagem ou bloco.

## Persistencia minima

Persistir:

- conversa;
- mensagem do usuario;
- mensagem do assistente;
- blocos da mensagem;
- OpenAI response id quando existir;
- token usage;
- status;
- erro.

`content_text` pode guardar narrativa, mas objetos interativos devem ser `ai_message_blocks`.

## Sequencia de uma mensagem

1. Validar usuario, workspace e conversa.
2. Persistir mensagem do usuario.
3. Criar contexto minimo autorizado.
4. Montar input para Responses API.
5. Chamar OpenAI server-side.
6. Streamar deltas e eventos.
7. Persistir blocos gerados.
8. Fechar assistant turn com status, token usage e erro se houver.
9. Emitir `assistant.completed` ou `assistant.failed`.

## Erros obrigatorios

Trate:

- OpenAI timeout;
- OpenAI rate limit;
- resposta invalida;
- desconexao SSE;
- usuario sem permissao;
- conversa inexistente;
- feature flag desabilitada.

Retry nao deve duplicar mensagem do usuario nem acoes aplicadas.

## Limites desta frente

- Nao implemente File Search.
- Nao implemente GitHub App.
- Nao implemente roteamento completo de tools.
- Nao implemente long-term memory.
- Nao altere entidades de workspace/board como efeito de uma resposta do modelo.

## Aceite

- Conversa pode ser criada, carregada e listada.
- Mensagem do usuario pode ser enviada.
- Backend chama OpenAI sem expor API key ao browser.
- Resposta chega via SSE.
- Mensagens e blocos sao persistidos.
- Estados de erro/retry aparecem de forma recuperavel.
