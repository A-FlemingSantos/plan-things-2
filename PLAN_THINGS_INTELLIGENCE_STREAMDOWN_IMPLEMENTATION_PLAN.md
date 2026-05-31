# Plan Things Intelligence: Streamdown Markdown Remaining Work Plan

Data de referencia: 2026-05-31

Este documento substitui a versao anterior do plano de Streamdown e passa a refletir o estado real do projeto hoje: o que ja foi implementado, o que falta fechar e quais criterios definem a conclusao desse rollout.

## 1. Resumo executivo

O nucleo tecnico do plano de Streamdown ja foi implementado no frontend.

Ja existe:

- dependencia `streamdown` instalada no app web;
- import global de `streamdown/styles.css`;
- feature flag frontend para ligar e desligar o renderer;
- fallback para `react-markdown` quando a flag estiver desativada;
- uso de `mode="streaming"` durante stream e `mode="static"` quando a mensagem conclui;
- guardrails locais de CSS para listas, espacos e links;
- reconciliacao final da mensagem apos `assistant.completed`;
- testes unitarios cobrindo o toggle do renderer e os estados `streaming`/`static`.

Portanto, este plano nao e mais um plano de integracao inicial. Agora ele e um plano de conclusao, validacao e endurecimento operacional.

## 2. Estado atual do codigo

### 2.1 Ja implementado

Implementacao atual confirmada no codigo:

- `apps/web/package.json`
  - `streamdown` instalado.
- `apps/web/src/main.jsx`
  - `import 'streamdown/styles.css'`.
- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.jsx`
  - flag `VITE_INTELLIGENCE_STREAMDOWN`;
  - fallback para `react-markdown`;
  - `Streamdown` com:
    - `mode="streaming"` quando a mensagem esta em stream;
    - `mode="static"` quando a mensagem esta concluida;
    - `animated`;
    - `isAnimating`;
    - `remend={{ linkMode: 'text-only' }}`;
    - links externos renderizados com seguranca de navegador.
- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.module.css`
  - `white-space: normal`;
  - `overflow-wrap` e `word-break`;
  - restauracao de `ul/ol/li`;
  - estilos basicos para titulos, tabelas, quotes, `code` e `pre`.
- `apps/web/src/features/intelligence/hooks/useAiConversation.js`
  - aplica deltas de `assistant.delta`;
  - faz refresh final em `assistant.completed`;
  - preserva texto parcial local enquanto o backend ainda nao persistiu o texto final.
- `apps/web/src/features/intelligence/hooks/useAiStream.js`
  - consome SSE manualmente via `fetch` e `ReadableStream`.

### 2.2 Ja implementado em testes

- `apps/web/src/features/intelligence/components/blocks/MarkdownBlock/MarkdownBlock.test.jsx`
  - cobre fallback;
  - cobre `streaming`;
  - cobre `static`.
- `apps/web/src/features/intelligence/hooks/useAiConversation.test.js`
  - cobre hidratacao apos `assistant.completed`;
  - cobre preservacao de texto parcial durante polling;
  - cobre preservacao de `contextSnapshot` local ao recarregar mensagens.

## 3. O que este plano considera concluido

As seguintes partes do plano anterior devem ser tratadas como concluidas:

### 3.1 Integracao basica do Streamdown

Concluido:

- instalacao da dependencia;
- import dos estilos;
- adocao do renderer por feature flag;
- fallback para renderer anterior;
- passagem do estado de streaming para o bloco markdown.

### 3.2 Hardening basico de CSS

Concluido:

- override local do reset global de listas;
- `white-space: normal` no escopo do markdown;
- restauracao de bullets e numeracao dentro do bloco markdown.

### 3.3 Compatibilidade com o fluxo atual de SSE

Concluido:

- o backend continua emitindo `assistant.delta`, `assistant.completed` e `assistant.failed`;
- o frontend renderiza deltas durante o stream;
- o frontend reconcilia o estado final a partir da mensagem persistida.

## 4. O que ainda falta

As pendencias restantes do plano de Streamdown nao sao mais de integracao principal. Elas estao concentradas em validacao real, rollout e robustez operacional.

### 4.1 Baseline e validacao formal

Ainda falta:

1. Definir e registrar um corpus oficial de validacao para streaming markdown.
2. Validar esse corpus nos dois entrypoints:
   - `/workspace/chat`
   - painel IA do `KanbanBoard`
3. Registrar os resultados esperados para:
   - listas simples;
   - listas aninhadas;
   - fences incompletas e completas;
   - links incompletos;
   - tabelas;
   - blocos longos com multiplos parágrafos.
4. Formalizar criterio de aprovacao e rollback.

Observacao:
essa parte nao esta implementada no codigo. E uma pendencia de produto/QA/engenharia.

### 4.2 Regressao visual orientada a cenarios reais

Ainda falta:

1. Rodar regressao visual real com mensagens longas.
2. Confirmar que nao ha:
   - flicker perceptivel;
   - marcador solto em listas;
   - quebra de hierarchy em listas aninhadas;
   - code fence quebrando layout;
   - jank perceptivel no composer durante stream.
3. Documentar o resultado para cada superficie.

Hoje existem testes unitarios, mas nao uma bateria formal de regressao visual do rollout.

### 4.3 Rollout operacional da feature flag

Ainda falta:

1. Definir valor padrao da flag por ambiente.
2. Confirmar se a flag ficara:
   - desligada por padrao em producao ate validacao manual; ou
   - ligada por padrao apos a homologacao.
3. Registrar procedimento de rollback operacional.
4. Se necessario, fazer rollout progressivo por ambiente interno antes de consolidar.

O mecanismo da flag existe; o plano de ativacao gradual ainda nao esta formalizado neste documento.

### 4.4 Robustez do transporte de stream

Esta parte fica na borda entre o plano de Streamdown e a robustez geral do chat, mas vale registrar porque impacta diretamente a experiencia de markdown em stream.

Ainda falta avaliar ou implementar, se o objetivo for endurecimento de producao:

1. politica de reconnect para o SSE quando a conexao cair no meio da resposta;
2. estrategia de retry/backoff;
3. comportamento de recuperacao quando o stream falha e a mensagem final ja foi persistida;
4. visibilidade melhor de erro transiente no frontend.

Importante:
isso nao bloqueia a integracao do Streamdown em si, mas bloqueia a ideia de "streaming totalmente robusto" em sentido de producao.

## 5. Novo plano de execucao

### Etapa 1: consolidar o contrato de validacao

Objetivo:

- transformar o rollout em algo verificavel.

Tarefas:

1. Escrever corpus oficial de prompts de teste.
2. Definir expected behavior por cenario.
3. Registrar checklist unico para `IntelligenceChat` e `KanbanBoard`.

Entrega:

- checklist de validacao aprovado pela equipe.

### Etapa 2: validar as duas superficies com a flag ativa

Objetivo:

- confirmar que a implementacao atual cumpre os objetivos de UX.

Tarefas:

1. Testar o corpus com `VITE_INTELLIGENCE_STREAMDOWN=true`.
2. Validar:
   - listas;
   - links parciais;
   - code fences;
   - respostas longas;
   - mensagens multi-paragrafo.
3. Comparar com o fallback para identificar regressao real.

Entrega:

- relatorio curto de Go/No-Go.

### Etapa 3: decidir estado final da flag

Objetivo:

- fechar o rollout.

Tarefas:

1. Se nao houver regressao critica, ligar a flag por padrao.
2. Se houver regressao relevante, manter fallback como default e abrir correcoes pontuais.
3. Registrar criterio de rollback simples.

Entrega:

- decisao final de rollout documentada.

### Etapa 4: opcional - endurecimento do transporte

Objetivo:

- melhorar resiliencia do streaming fim a fim.

Tarefas:

1. mapear falhas reais de stream;
2. avaliar reconnect/backoff;
3. melhorar UX de erro e recuperacao.

Entrega:

- chat com stream mais resiliente a falhas de conexao.

## 6. Criterios de conclusao

Este plano so podera ser considerado concluido quando:

1. o corpus de validacao estiver definido;
2. os dois entrypoints tiverem sido validados com a flag ativa;
3. nao houver regressao critica de listas, links, fences ou performance percebida;
4. a decisao operacional da flag estiver documentada;
5. existir procedimento claro de rollback.

## 7. O que nao faz parte deste plano

Os itens abaixo continuam sendo pendencias do plano principal de Intelligence, nao deste plano de Streamdown:

- persistencia backend de `contextSnapshot`;
- `ai_context_snapshots`;
- `ai_compaction_items`;
- cancelamento de geracao;
- listagem e `PATCH` de conversas;
- tools, proposals e blocos estruturados reais;
- compaction oficial da OpenAI;
- governanca completa de streaming no backend.

## 8. Veredito atual

Estado atual resumido:

- implementacao tecnica de Streamdown: concluida;
- hardening basico de markdown streaming: concluido;
- validacao formal e rollout: pendentes;
- robustez total de stream em sentido operacional: parcialmente pendente.

Em outras palavras: o projeto ja saiu da fase de "precisamos integrar Streamdown" e entrou na fase de "precisamos validar, consolidar e decidir rollout".
