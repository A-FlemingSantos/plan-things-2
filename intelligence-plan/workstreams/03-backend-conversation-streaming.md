# Frente 03: Conversa e streaming no backend

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Criar a base backend para conversas do Intelligence, persistencia de mensagens, chamadas para OpenAI Responses API e streaming por Server-Sent Events para o app web.

A intencao desta frente e criar o trilho confiavel da conversa antes de adicionar ferramentas mutantes. O backend deve ser o unico AI gateway: ele guarda chaves, monta contexto, chama o modelo, persiste mensagens/blocos e transmite eventos para o navegador. O frontend nunca fala diretamente com OpenAI.

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

`AiOpenAiClient` deve esconder detalhes da Responses API. `AiConversationService` deve coordenar persistencia e ciclo de vida da conversa. `AiStreamingService` deve emitir eventos idempotentes para o frontend sem virar dono da regra de negocio.

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

`POST /messages` pode retornar rapidamente um `messageId` e iniciar execucao assincrona. O frontend acompanha pelo stream da conversa. Essa separacao evita request HTTP longo demais e deixa retry/cancelamento mais previsiveis.

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

Usar `store: false` nas chamadas, salvo decisao explicita em contrario. O estado auditavel do produto fica no banco local; ids de resposta da OpenAI servem para encadear runtime quando necessario, nao como fonte da UI.

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
- eventos repetidos por reconexao devem ser seguros para reaplicar no cliente.

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

`content_text` pode guardar narrativa simples, mas blocos estruturados devem viver em tabela propria. Isso permite renderizar historico sem reexecutar o modelo e evita depender de markdown para recuperar objetos do app.

## Ciclo de uma mensagem

1. Validar usuario, workspace e escopo da conversa.
2. Persistir mensagem do usuario.
3. Criar snapshot de contexto basico ou chamar o builder de contexto quando disponivel.
4. Montar prompt, input e tools habilitadas para aquela request.
5. Chamar Responses API com streaming quando possivel.
6. Persistir deltas/blocos/tool events conforme chegam.
7. Fechar mensagem do assistente com status final, tokens e erro se houver.
8. Emitir `assistant.completed` ou `assistant.failed`.

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

Quando uma resposta falha depois de mensagem do usuario persistida, manter a mensagem e gravar falha recuperavel no assistant turn. O usuario deve poder tentar novamente sem perder contexto.

## Fora do escopo

- Indexacao de File Search.
- Integracao GitHub App.
- Roteamento completo de acoes.
- Long-term memory.
- Escritas reais em entidades de workspace/board.

## Definition of Done

- Conversa pode ser criada e carregada.
- Mensagem do usuario pode ser enviada.
- Backend chama OpenAI via cliente server-side.
- Resposta do assistente chega ao frontend via SSE.
- Mensagens e blocos sao persistidos.
- Estados de retry/erro sao representados.
- Nenhuma API key chega ao browser.
