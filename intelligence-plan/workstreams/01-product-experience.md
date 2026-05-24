# Frente 01: Experiencia de produto

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Definir o comportamento de produto do Plan Things Intelligence: um assistente operacional para workspaces e planos Kanban, nao apenas um chatbot de texto.

A intencao desta frente e fixar a experiencia que todas as outras camadas precisam respeitar. O produto deve parecer um copiloto que entende objetos do Plan Things, mas o usuario continua no controle das mudancas. A conversa vira uma linha do tempo operacional: contem narrativa, contexto usado, propostas, aprovacoes e referencias para entidades reais.

O assistente deve:

- responder de forma conversacional;
- inspecionar contexto relevante do workspace/plano;
- propor acoes;
- aguardar aprovacao do usuario antes de alterar dados;
- retornar objetos reais clicaveis depois que acoes aprovadas forem executadas.

## Modelo de interacao principal

Este e o contrato mental do produto. Qualquer fluxo que cria ou altera dados deve passar por proposta antes de virar entidade real.

Fluxo esperado:

1. Usuario pede ajuda.
2. Assistente busca contexto ou faz perguntas de esclarecimento.
3. Assistente propoe uma acao quando algo alteraria dados.
4. Usuario aprova, edita ou rejeita a proposta.
5. Backend aplica as acoes aprovadas.
6. Conversa recebe entity reference blocks para objetos criados/atualizados.
7. Usuario clica nesses objetos para abrir o plano, cartao, arquivo, item de Inbox ou objeto externo do GitHub.

O ponto central: a IA pode preparar trabalho, mas nao deve fingir que executou algo antes do backend confirmar. Isso protege a confianca do produto e evita que a conversa vire uma lista de promessas nao verificadas.

## Categorias de objetos

A experiencia do assistente deve suportar:

- workspace;
- plano;
- coluna do board;
- cartao;
- membro;
- convite;
- arquivo;
- item de Inbox;
- commit do GitHub;
- pull request do GitHub;
- proposta de acao;
- pergunta/resposta.

## Tipos de bloco do ponto de vista do produto

Use estes significados de forma consistente:

```txt
NarrativeBlock = explicacao textual do assistente.
ProposalBlock = mudanca sugerida, pendente de aprovacao.
EntityReferenceBlock = objeto real do Plan Things, persistido e clicavel.
ExternalEntityReferenceBlock = objeto externo autorizado, como commit ou PR.
QuestionBlock = pergunta objetiva para destravar ambiguidade.
ToolRunStatusBlock = estado visivel de busca/processamento.
```

Markdown pode explicar uma proposta, mas nao deve ser o proprio objeto interativo. Planos, cartoes, arquivos, membros, Inbox, commits e PRs precisam aparecer como blocos tipados para preservar navegacao, status e auditoria.

## Principios de UX

- Uma proposta nao e uma alteracao aplicada.
- Uma referencia a entidade real deve parecer clicavel e persistente.
- A conversa e uma linha do tempo operacional, nao apenas uma transcricao.
- O assistente nao deve afirmar que dados foram alterados antes da confirmacao do backend.
- Depois da aprovacao, a conversa deve mostrar entidades reais criadas/atualizadas.
- Se uma entidade referenciada for removida depois, o bloco deve permanecer no historico e mostrar estado indisponivel.
- Quando o usuario estiver em Workspace, o assistente deve pensar em escopo amplo; quando estiver em Kanban ou card, deve priorizar aquele contexto.
- Se a intencao estiver ambigua, o assistente deve perguntar ou criar proposta editavel, nao escolher silenciosamente dados sensiveis.

## Estados obrigatorios

O mock e a implementacao devem representar:

```txt
empty
drafting
streaming
tool_running
proposal_pending
proposal_approved
proposal_rejected
proposal_failed
entity_created
entity_updated
entity_unavailable
error_retryable
error_permission
```

## Fluxos principais

Os fluxos abaixo definem comportamento, nao layout. O frontend pode variar a apresentacao, mas nao pode remover a diferenca entre narrativa, proposta e entidade real.

### Criar um plano

1. Usuario pede para criar um plano.
2. Assistente propoe metadados do plano e cartoes iniciais.
3. Usuario aprova.
4. Backend cria o plano.
5. Conversa renderiza um `PlanReferenceBlock`.
6. Clique no bloco abre o plano.

### Criar cartoes a partir de contexto

1. Usuario pede para quebrar trabalho em tarefas.
2. Assistente chama busca de contexto.
3. Assistente propoe criacao em lote de cartoes.
4. Usuario aprova.
5. Backend cria os cartoes.
6. Conversa renderiza referencias clicaveis para os cartoes.

### Anexar commits do GitHub

1. Usuario pede commits recentes relacionados a um tema.
2. Assistente busca no GitHub.
3. Assistente propoe anexar commits a um cartao ou criar cartoes a partir de commits.
4. Usuario aprova.
5. Backend cria links dentro do Plan Things.
6. Conversa renderiza referencias de commits e cartoes.

### Perguntar sobre trabalho existente

1. Usuario pergunta algo sobre um plano, card, arquivo ou membro.
2. Assistente usa busca de contexto ou detalhes de entidade quando os dados nao estiverem no estado atual da conversa.
3. Assistente responde com narrativa e, quando util, inclui referencias clicaveis para os objetos mencionados.
4. Nenhuma proposta deve ser criada se a intencao for apenas leitura.

### Convite ou atribuicao de membro

1. Usuario pede para convidar ou atribuir alguem.
2. Assistente confere contexto de membros existentes e permissoes.
3. Se a pessoa nao existir, cria proposta de convite; se existir, cria proposta de atribuicao.
4. Usuario aprova.
5. Backend aplica e conversa mostra membro/cartao real atualizado.

## Fora do escopo

- Mutacao autonoma de dados sem aprovacao do usuario.
- Acesso direto do frontend ao modelo.
- Escrita no GitHub no MVP.
- Tratar markdown como container para objetos reais do app.
- Resolver todos os detalhes visuais dos componentes; isso pertence a frente de UI.

## Definition of Done

- Fluxos de produto distinguem narrativa, proposta e referencia a entidade real.
- Comportamento de aprovar/rejeitar/editar esta especificado para propostas.
- Comportamento de clique esta especificado para planos, cartoes, arquivos, Inbox, commits e PRs.
- Estados de erro/indisponibilidade estao especificados.
- Escopo do MVP esta claro para implementacao de frontend e backend.
