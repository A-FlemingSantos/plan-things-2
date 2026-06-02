# Plan Things Intelligence: plano de implementacao com OpenAI Agents SDK

Data de referencia: 2026-06-02

Este documento substitui o plano anterior baseado em loop manual da Responses API. A partir deste ponto, o planejamento do Plan Things Intelligence passa a assumir como arquitetura-alvo o **OpenAI Agents SDK** como runtime de agentes, com um servico TypeScript dedicado e o backend Java mantendo autenticacao, autorizacao, persistencia, auditoria e streaming para a UI.

Nao existe mais uma "etapa separada de migracao para Agents SDK". Todo o plano abaixo ja parte dessa decisao.

## 1. Objetivo do produto

O objetivo nao e adicionar um chat generico. O objetivo e criar um **copiloto operacional do workspace** que:

- entende o contexto do workspace, do plano e do card atual;
- usa ferramentas permissionadas do proprio produto;
- retorna respostas navegaveis e auditaveis;
- evolui para acoes confirmaveis sem quebrar o modelo de seguranca do app.

O comportamento desejado continua o mesmo:

1. O usuario conversa em linguagem natural.
2. O sistema recupera contexto autorizado do Plan Things.
3. O agente responde com narrativa util e, quando cabivel, com referencias estruturadas.
4. No futuro, o agente podera preparar acoes confirmaveis, mas a execucao real continuara passando pelos servicos de negocio do backend.

## 2. Decisoes fechadas

As decisoes abaixo ja estao consolidadas e guiam todo o resto do plano:

1. O runtime de agentes sera implementado em **TypeScript** com o **OpenAI Agents SDK**.
2. O backend **Spring Boot** continua como backend principal e fonte de verdade da aplicacao.
3. O MVP tera **um unico agente**: `WorkspaceAssistantAgent`.
4. O MVP tera apenas ferramentas **read-only**.
5. O MVP **nao** tera multi-agent, handoffs, sandbox de arquivos, tools mutantes ou escrita direta no workspace.
6. Funcionalidades nativas do Agents SDK devem substituir implementacoes customizadas equivalentes sempre que isso simplificar a arquitetura sem perder controle do produto.

## 3. Principios de arquitetura

### 3.1 Java continua sendo o gateway do produto

O frontend nao deve falar com OpenAI diretamente e nem com o runtime de agentes diretamente.

O backend Java continua dono de:

- autenticacao;
- autorizacao;
- escopo multi-tenant;
- acesso as regras reais de negocio;
- persistencia local;
- auditoria;
- SSE para a UI;
- formato de blocos e historico renderizado.

### 3.2 Agents SDK passa a ser o runtime de orquestracao

O runtime TypeScript com Agents SDK passa a ser responsavel por:

- definicao do agente;
- execucao do run;
- streaming do run;
- chamada de tools do agente;
- continuidade de sessao do agente;
- estado resumivel do run;
- approvals e interruptions quando essas capacidades entrarem;
- tracing e observabilidade do fluxo do agente.

### 3.3 O produto continua sendo stateful no banco local

Mesmo usando as superficies nativas do Agents SDK e da Responses API, o **banco local do Plan Things continua sendo a fonte de verdade** para:

- conversas exibidas na UI;
- mensagens persistidas;
- blocos estruturados;
- auditoria de tools;
- referencias navegaveis;
- autorizacao por workspace/plano/card;
- retencao e exclusao.

### 3.4 Preferir nativo ao custom quando houver equivalencia real

O plano anterior implementou varias capacidades manualmente sobre Responses API. A partir deste plano:

- loop manual de tool calling deixa de ser centro da arquitetura;
- continuidade de run deve preferir superficies nativas do SDK;
- approvals futuros devem preferir `needsApproval`, `interruptions` e `state`;
- tracing deve preferir o tracing nativo do SDK;
- orquestracao futura entre agentes deve preferir `handoffs`, e nao roteamento artesanal equivalente.

## 4. Base atual do repositorio

Hoje o projeto ja tem uma base funcional importante:

- frontend real em `apps/web/src/features/intelligence/`;
- backend Java de intelligence em `services/api/src/main/java/com/planthings/api/intelligence/`;
- persistencia local de conversas, mensagens, blocos, snapshots, compaction e tool calls;
- chat com SSE;
- tools read-only `context.search` e `entity.get`;
- loop manual de Responses API em `AiResponseOrchestrator`.

Essa base nao deve ser descartada por completo. Ela deve ser **reorganizada** em torno do runtime novo.

## 5. Arquitetura-alvo de pastas

```text
plan-things-2/
├─ apps/
│  └─ web/
├─ services/
│  ├─ api/
│  │  └─ src/main/java/com/planthings/api/
│  │     ├─ auth/
│  │     ├─ board/
│  │     ├─ files/
│  │     ├─ plans/
│  │     ├─ workspace/
│  │     └─ intelligence/
│  │        ├─ api/
│  │        ├─ application/
│  │        ├─ blocks/
│  │        ├─ persistence/
│  │        ├─ runtime/
│  │        ├─ streaming/
│  │        ├─ tools/
│  │        └─ config/
│  │
│  └─ agents/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ server/
│        │  ├─ app.ts
│        │  └─ routes/
│        ├─ agents/
│        │  └─ workspace-assistant.agent.ts
│        ├─ tools/
│        │  ├─ context-search.tool.ts
│        │  ├─ entity-get.tool.ts
│        │  └─ index.ts
│        ├─ runner/
│        │  └─ run-workspace-agent.ts
│        ├─ prompts/
│        │  └─ workspace-assistant.prompt.ts
│        ├─ contracts/
│        ├─ infra/
│        │  ├─ openai/
│        │  ├─ logging/
│        │  └─ env/
│        └─ shared/
└─ packages/
   └─ intelligence-contracts/         (opcional, recomendado)
```

## 6. Responsabilidades por camada

### 6.1 Frontend

O frontend permanece com a arquitetura geral atual:

- `apps/web/src/features/intelligence/api/intelligenceApi.js`
- `apps/web/src/features/intelligence/hooks/useAiConversation.js`
- `apps/web/src/features/intelligence/hooks/useAiStream.js`
- `apps/web/src/features/intelligence/components/*`

O contrato principal do frontend deve mudar o minimo possivel no MVP. A UI continua consumindo:

- endpoints REST do backend Java;
- SSE da conversa;
- mensagens e blocos persistidos pelo Java.

### 6.2 Backend Java

O backend Java continua responsavel por:

- criar/listar/atualizar conversas;
- persistir mensagens;
- persistir snapshots;
- emitir SSE;
- manter modelos de blocos para UI;
- validar escopo e permissoes;
- servir como adaptador das tools do agente para o dominio real.

### 6.3 Runtime TypeScript com Agents SDK

O servico `services/agents` passa a ser um servico interno. Ele nao e um backend do produto voltado ao browser; ele e um **runtime especializado** para execucao do agente.

Responsabilidades:

- instanciar `WorkspaceAssistantAgent`;
- executar `run(...)` com input e contexto do turno;
- expor ferramentas do agente;
- devolver stream de eventos e resultado final ao backend Java;
- no futuro, devolver interruptions e state resumivel para approvals.

## 7. O que muda em relacao ao desenho anterior

### 7.1 Sai do centro da arquitetura

Os componentes abaixo deixam de ser a espinha dorsal do sistema:

- loop manual da Responses API;
- parsing manual de `function_call` e `function_call_output`;
- orquestracao artesanal de rodadas de tools;
- decisoes futuras de approval implementadas ad hoc no Java;
- tracing manual onde o SDK ja entrega tracing nativo.

### 7.2 Continua existindo, mas reposicionado

Os componentes abaixo seguem valiosos:

- `AiConversationController`;
- `AiConversationService`;
- `AiStreamingService`;
- `AiMessageBlockWriter`;
- `AiEntityReferenceResolver`;
- `AiToolPermissionService`;
- `AiReadOnlyCapabilityService`;
- tabelas `ai_*`.

### 7.3 Deve ser substituido ou esvaziado

Os componentes abaixo devem ser retirados do papel central ao longo da implementacao:

- `AiResponseOrchestrator` -> substituido por um gateway para o runtime TypeScript;
- `DefaultAiOpenAiClient` -> deixa de ser o runtime principal;
- `OpenAiResponseRequest` e `OpenAiResponseResult` -> deixam de ser o contrato central;
- logica custom de multiplas rodadas de tool use -> cede lugar ao `run(...)` do SDK.

## 8. Funcionalidades nativas do Agents SDK que o projeto deve adotar

### 8.1 Agente como unidade principal

O SDK trata o agente como unidade central do workflow: modelo, instrucoes e comportamento runtime no mesmo objeto. Para o MVP, isso sera um unico agente:

- `WorkspaceAssistantAgent`

### 8.2 Tools do agente

As tools deixam de ser "funcoes wire-format da Responses API" como principal abstracao. A abstracao principal passa a ser a **tool do Agents SDK**.

No MVP:

- `context.search`
- `entity.get`

### 8.3 Sessions e continuidade

O SDK oferece sessao de memoria para continuidade entre turnos. O produto deve adotar isso para reduzir parte da logica artesanal de continuidade, sem abrir mao da persistencia local.

No MVP, a sessao do agente deve ser tratada como runtime state, enquanto o historico canonicamente exibido continua no banco local.

### 8.4 Streaming do run

O SDK expoe streaming do run e eventos de stream. O backend Java deve consumir esse stream e traduzi-lo para os eventos SSE da UI.

### 8.5 Results e state

O SDK ja define superficies claras para:

- `finalOutput`
- `history`
- `lastResponseId`
- `interruptions`
- `state`

Essas superficies devem guiar o contrato interno entre Java e o runtime TS.

### 8.6 Approvals e interruptions

No futuro, tools de maior risco devem usar a abordagem nativa:

- `needsApproval`
- `interruptions`
- retomada do mesmo run via `state`

Isso substitui um desenho custom equivalente para approvals quando chegarmos a tools mutantes.

### 8.7 Tracing nativo

O SDK inclui tracing e agrupamento de runs. O produto deve adotar essa observabilidade em vez de tentar reconstruir tudo apenas com logs locais.

## 9. MVP claro

O MVP precisa ser propositalmente estreito.

### 9.1 O que entra no MVP

1. Um unico servico `services/agents` em TypeScript.
2. Um unico agente: `WorkspaceAssistantAgent`.
3. Apenas tools read-only:
   - `context.search`
   - `entity.get`
4. Backend Java como gateway do produto.
5. Frontend mantendo o contrato atual de chat sempre que possivel.
6. Streaming end-to-end:
   - Agents SDK stream
   - backend Java traduz para SSE
   - frontend continua ouvindo SSE da conversa
7. Persistencia local das mensagens, blocos, snapshots e auditoria.
8. Reuso das regras de negocio existentes no Java para leitura de workspace/plano/card/arquivo.

### 9.2 O que explicitamente fica fora do MVP

- multi-agent;
- handoffs;
- sandbox de edicao de arquivos;
- tools mutantes;
- `action.propose`;
- approvals com `needsApproval`;
- GitHub read-only;
- GitHub mutante;
- File Search;
- vision / multimodal;
- long-term memory sofisticada;
- MCP externo;
- roteamento por especialistas.

## 10. Arquitetura do MVP em detalhes

### 10.1 Agente unico

`WorkspaceAssistantAgent` sera configurado para:

- responder em portugues;
- ser objetivo;
- nao inventar entidades;
- usar tools quando precisar de dados do workspace;
- retornar narrativa e referencias estruturadas compativeis com a UI atual.

### 10.2 Tools do MVP

#### `context.search`

Responsabilidade:

- buscar contexto read-only autorizado do workspace;
- agregar resultados de workspace, plano, board, cards e arquivos conforme permitido;
- continuar sendo permissionada pelo backend Java.

#### `entity.get`

Responsabilidade:

- obter os detalhes de uma entidade autorizada;
- devolver payload estruturado;
- permitir ao backend gerar blocos de referencia para UI.

### 10.3 Fluxo de execucao do MVP

1. Frontend envia mensagem para o backend Java.
2. Java persiste mensagem do usuario, `contextSnapshot` e mensagem assistente `PENDING`.
3. Java monta o payload interno do turno.
4. Java chama `services/agents`.
5. O runtime TS executa `run(WorkspaceAssistantAgent, input, options)`.
6. Se o agente usar tools, as tools consultam adaptadores controlados pelo produto.
7. O runtime TS devolve stream de eventos e resultado final.
8. O Java traduz stream para SSE.
9. O Java persiste mensagem final, blocos, referencias e auditoria.
10. O frontend continua consumindo a conversa como hoje.

### 10.4 Contrato interno Java <-> Agents

O contrato interno precisa ser proprio do produto. Ele nao deve expor o wire format cru da OpenAI como contrato principal do sistema.

Payload minimo de request:

- `conversationId`
- `assistantMessageId`
- `userId`
- `workspaceId`
- `scopeType`
- `planId`
- `cardId`
- `userMessage`
- `contextSnapshot`
- `sessionKey`
- `enabledTools`

Payload minimo de response:

- `finalOutput`
- `toolEvents`
- `lastResponseId`
- `structuredReferences`
- `rawHistory` ou superficie equivalente util ao backend

Streaming interno:

- evento de delta textual;
- evento de tool started/completed/failed;
- evento final com output consolidado.

## 11. Estrutura recomendada dentro do backend Java

```text
services/api/src/main/java/com/planthings/api/intelligence/
├─ api/
│  ├─ AiConversationController.java
│  └─ dto/
├─ application/
│  ├─ AiConversationService.java
│  ├─ AiMessageLifecycleService.java
│  └─ AiRuntimeGatewayService.java
├─ blocks/
│  ├─ AiMessageBlockWriter.java
│  ├─ AiEntityReferenceResolver.java
│  └─ ...
├─ persistence/
│  ├─ AiConversationEntity.java
│  ├─ AiMessageEntity.java
│  ├─ AiToolCallEntity.java
│  └─ ...
├─ runtime/
│  ├─ AgentsRuntimeClient.java
│  ├─ AgentsRunRequest.java
│  ├─ AgentsRunEvent.java
│  └─ AgentsRunResult.java
├─ streaming/
│  └─ AiStreamingService.java
├─ tools/
│  ├─ AiToolPermissionService.java
│  ├─ AiReadOnlyCapabilityService.java
│  ├─ AiToolFacade.java
│  └─ ...
└─ config/
```

### 11.1 Classe nova central no Java

O papel central que hoje esta em `AiResponseOrchestrator` deve migrar para algo como:

- `AiRuntimeGatewayService`

Responsabilidades:

- preparar o turno;
- chamar o runtime TS;
- receber stream;
- persistir deltas e status;
- transformar o resultado do runtime em artefatos do produto.

### 11.2 Classes que viram legado

- `AiResponseOrchestrator`
- `DefaultAiOpenAiClient`
- `OpenAiResponseRequest`
- `OpenAiResponseResult`

Essas classes podem conviver temporariamente durante a migracao de implementacao, mas nao devem continuar como arquitetura-alvo.

## 12. Estrutura recomendada dentro de `services/agents`

```text
services/agents/src/
├─ server/
│  ├─ app.ts
│  └─ routes/
│     └─ runs.ts
├─ agents/
│  └─ workspace-assistant.agent.ts
├─ tools/
│  ├─ context-search.tool.ts
│  ├─ entity-get.tool.ts
│  └─ index.ts
├─ runner/
│  └─ run-workspace-agent.ts
├─ prompts/
│  └─ workspace-assistant.prompt.ts
├─ contracts/
│  ├─ runtime-request.ts
│  └─ runtime-response.ts
├─ infra/
│  ├─ openai/
│  ├─ logging/
│  └─ env/
└─ shared/
```

### 12.1 `workspace-assistant.agent.ts`

Define:

- nome do agente;
- instrucoes;
- modelo;
- tools;
- eventuais callbacks dinamicos de instrucao quando necessario.

### 12.2 `run-workspace-agent.ts`

Responsavel por:

- receber o turno vindo do Java;
- executar `run(...)`;
- emitir eventos intermediarios;
- consolidar `finalOutput`, `lastResponseId` e metadados.

### 12.3 Tools do runtime

As tools do runtime nao devem implementar regra de negocio duplicada. Elas devem chamar adaptadores do dominio do produto.

Isso pode ser feito de duas formas:

1. tool no TS chama endpoint interno do Java;
2. tool no TS chama uma facade local do produto se houver acoplamento aceitavel.

Para este projeto, o caminho mais seguro e o primeiro:

- TS chama endpoints internos/read-only do backend Java;
- Java continua aplicando autorizacao e usando `BoardService`, `PlanService`, `FileService`, etc.

## 13. Persistencia e modelo de dados

### 13.1 O que permanece

Permanecem como base do produto:

- `ai_conversations`
- `ai_messages`
- `ai_message_blocks`
- `ai_context_snapshots`
- `ai_tool_calls`

### 13.2 O que muda conceitualmente

`last_openai_response_id` deixa de representar o centro do fluxo. Ele pode continuar util, mas agora como detalhe de runtime, nao como principal contrato arquitetural.

### 13.3 O que pode ser adicionado depois

Quando approvals entrarem, sera util introduzir algo como:

- `ai_agent_runs`
- `ai_agent_run_interruptions`

Objetivo:

- persistir `state` resumivel do SDK;
- persistir interrupcoes pendentes;
- retomar o mesmo run apos aprovacao humana.

Isso **nao** e obrigatorio para o MVP.

## 14. Streaming e contrato de eventos

O frontend continuara ouvindo SSE do backend Java. Portanto, o Java deve traduzir os eventos do runtime TS para eventos da UI.

Eventos que continuam fazendo sentido no MVP:

- `stream.ready`
- `message.created`
- `assistant.delta`
- `tool.started`
- `tool.completed`
- `tool.failed`
- `block.created`
- `assistant.completed`
- `assistant.failed`

Eventos que ficam para depois:

- `proposal.created`
- `approval.required`
- `entity.updated` derivado de escrita do agente

## 15. Contexto, sessao e continuidade

### 15.1 Fonte de verdade do contexto do produto

O `contextSnapshot` persistido por mensagem continua importante. Ele segue sendo a forma auditavel de registrar o contexto anexado explicitamente pelo usuario.

### 15.2 Sessao do agente

O runtime do agente deve usar uma estrategia clara de sessao por conversa. O produto precisa evitar misturar varias estrategias de continuidade sem necessidade.

Para o MVP:

- cada conversa do produto mapeia para uma sessao do agente;
- a continuidade do agente serve ao runtime;
- o historico exibido ao usuario continua vindo do banco local.

### 15.3 `lastResponseId`

Se o runtime decidir usar `lastResponseId`, isso deve ficar encapsulado no `services/agents` e nao vazar como regra principal da aplicacao.

## 16. Prompting e comportamento do agente

O prompt do agente deve ser curto, operacional e orientado a produto.

Diretrizes basicas:

- responder em portugues;
- ser objetivo;
- nao inventar entidades;
- confirmar incerteza quando faltarem dados;
- usar tools para consultar o workspace;
- nao executar acoes mutantes no MVP;
- sempre respeitar o escopo autorizado recebido do backend.

O MVP nao precisa de um prompt monstruoso. O plano anterior carregava parte demais da orquestracao no prompt porque o runtime ainda era artesanal. Com Agents SDK, a responsabilidade de fluxo sai do prompt e vai para a arquitetura.

## 17. MVP versus depois

### 17.1 MVP

- 1 agente `WorkspaceAssistantAgent`
- runtime TS com Agents SDK
- Java como gateway
- stream do agente traduzido para SSE
- `context.search`
- `entity.get`
- narrativa + blocos de referencia
- persistencia local mantida

### 17.2 Depois do MVP

#### Aprovacoes e acoes mutantes

- `action.propose`
- tools com `needsApproval`
- persistencia de `interruptions` e `state`
- retomada do mesmo run apos aprovacao

#### File Search e documentos

- upload para OpenAI Files
- vector stores
- tool `file_search`
- busca semantica em documentos autorizados

#### Multimodal

- imagens no turno do usuario
- interpretacao de anexos visuais
- integracao com o fluxo de composer e historico

#### GitHub

- contexto read-only de repositorios, PRs e issues
- depois, acoes confirmaveis relacionadas a GitHub

#### Multi-agent

- especializacao por dominio
- handoffs
- roteamento entre agentes

#### Sandbox

- edicao robusta e segura de arquivos
- isolamento para acoes mais sensiveis

Esse item fica deliberadamente fora do MVP e so deve entrar quando houver necessidade clara de produto.

## 18. Ordem de implementacao recomendada

As fases abaixo ja sao fases da arquitetura nova.

### Fase 1: fundacao do runtime de agentes

- criar `services/agents`;
- instalar `@openai/agents`;
- criar `WorkspaceAssistantAgent`;
- definir contrato interno Java <-> TS;
- preparar configuracao de ambiente e logging.

### Fase 2: integracao Java <-> runtime TS

- criar `AgentsRuntimeClient` no Java;
- substituir o papel central de `AiResponseOrchestrator`;
- enviar mensagem real do backend Java para o runtime TS;
- receber `finalOutput` e persistir resposta final.

### Fase 3: streaming e tools read-only

- conectar stream do SDK ao SSE do Java;
- implementar `context.search`;
- implementar `entity.get`;
- registrar auditoria de tools via backend Java;
- manter blocos estruturados e referencias navegaveis.

### Fase 4: endurecimento do MVP

- tratamento de falhas e retries;
- testes integrados Java + TS;
- compatibilidade com o frontend atual;
- observabilidade basica com tracing do SDK;
- rollout controlado por feature flag.

## 19. Testes

### 19.1 Runtime TS

- teste do `WorkspaceAssistantAgent`;
- teste das tools `context.search` e `entity.get`;
- teste de stream de deltas;
- teste de falha de tool;
- teste de sessao por conversa.

### 19.2 Backend Java

- teste do `AgentsRuntimeClient`;
- teste do fluxo `POST /messages`;
- teste de persistencia de mensagens e blocos;
- teste de traducao de stream para SSE;
- teste de auditoria de tool calls.

### 19.3 End-to-end

- conversa simples sem tools;
- conversa com `context.search`;
- conversa com `entity.get`;
- cancelamento;
- reload da thread com historico persistido.

## 20. Seguranca e governanca

- chaves OpenAI somente em backend/servicos internos;
- frontend nunca fala com OpenAI;
- tools sempre passam pelo modelo de permissao do produto;
- nenhuma tool mutante no MVP;
- nenhuma escrita direta em arquivo no MVP;
- nenhum acesso cross-workspace;
- logs e traces sem vazar dados sensiveis indevidamente.

## 21. Riscos e mitigacoes

### Risco 1: duplicar logica entre Java e TS

Mitigacao:

- TS nao implementa regra de negocio de dominio;
- TS usa tools/adaptadores;
- Java continua dono de autorizacao e acesso ao dominio.

### Risco 2: stream interno adicionar complexidade

Mitigacao:

- manter o frontend no contrato SSE atual;
- encapsular toda a complexidade no adaptador Java <-> TS;
- comecar com um conjunto pequeno de eventos.

### Risco 3: sessao do agente divergir do historico local

Mitigacao:

- banco local continua como fonte de verdade da UI;
- sessao do agente e tratada como runtime state;
- tornar explicita a estrategia de continuidade por conversa.

### Risco 4: reter componentes legados por tempo demais

Mitigacao:

- marcar `AiResponseOrchestrator` e `DefaultAiOpenAiClient` como caminho legado;
- evitar adicionar funcionalidade nova no loop manual antigo.

## 22. Definition of Done do MVP

O MVP estara pronto quando:

1. O chat do produto executar via `services/agents` com Agents SDK.
2. O frontend continuar funcionando sem falar com OpenAI diretamente.
3. O backend Java seguir como fonte de verdade de conversas, mensagens e blocos.
4. `WorkspaceAssistantAgent` responder de ponta a ponta.
5. `context.search` e `entity.get` funcionarem com auditoria.
6. O stream do agente chegar ao frontend via SSE.
7. O loop manual anterior deixar de ser o caminho principal de execucao.
8. O rollout puder ser controlado por flag.

## 23. Fontes oficiais da OpenAI utilizadas

- Agents SDK overview: https://developers.openai.com/api/docs/guides/agents
- Agents SDK quickstart: https://developers.openai.com/api/docs/guides/agents/quickstart
- Agent definitions: https://developers.openai.com/api/docs/guides/agents/define-agents
- Running agents: https://developers.openai.com/api/docs/guides/agents/running-agents
- Guardrails and human review: https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- Results and state: https://developers.openai.com/api/docs/guides/agents/results
- Integrations and observability: https://developers.openai.com/api/docs/guides/agents/integrations-observability
- File search: https://developers.openai.com/api/docs/guides/tools-file-search
- Conversation state: https://developers.openai.com/api/docs/guides/conversation-state
- Compaction: https://developers.openai.com/api/docs/guides/compaction
- Models overview / selection: https://developers.openai.com/api/docs/models
