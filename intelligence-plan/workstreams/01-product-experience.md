# Frente 01: Experiencia de produto

## Missao do agente

Transforme o comportamento esperado do Plan Things Intelligence em regras de produto implementaveis. Esta frente nao e "fazer UI": ela define os fluxos e limites que UI, backend, tools, permissoes e testes devem respeitar.

Entregue especificacoes ou ajustes de produto que deixem claro quando o assistente deve responder, buscar contexto, propor acao, aguardar aprovacao e retornar objetos reais clicaveis.

## Resultado esperado

Ao final desta frente, outras frentes devem conseguir implementar componentes, endpoints e tools sem reinterpretar a experiencia. O contrato de produto deve deixar claro:

- o que e apenas narrativa;
- o que e proposta pendente;
- o que e entidade real;
- quando uma acao precisa de aprovacao;
- como a conversa continua depois que o backend aplica uma proposta;
- como Workspace, Kanban, card, arquivo, Inbox e GitHub entram no fluxo.

## Regras de produto

- O assistente e operacional, nao apenas textual.
- A conversa e uma linha do tempo de trabalho: mensagens, contexto usado, propostas, aprovacoes, resultados e referencias.
- Toda criacao/edicao/anexo/convite/atribuicao deve virar proposta antes de alterar dados.
- O assistente nao pode dizer que algo foi criado, movido, anexado ou convidado antes de confirmacao do backend.
- Depois do apply, a conversa deve mostrar `entity reference` para o objeto real criado ou atualizado.
- Se uma entidade real sumir depois, o bloco historico continua visivel com estado indisponivel.
- Markdown pode explicar; nao pode substituir bloco interativo.

## Objetos cobertos

Inclua estes objetos nos fluxos e estados:

```txt
workspace
plano
coluna do board
cartao
membro
convite
arquivo
item de Inbox
commit do GitHub
pull request do GitHub
proposta de acao
pergunta/resposta
```

## Tipos de bloco

Use estes significados de forma consistente:

```txt
NarrativeBlock = explicacao textual do assistente.
ProposalBlock = mudanca sugerida, pendente de aprovacao.
EntityReferenceBlock = objeto real do Plan Things, persistido e clicavel.
ExternalEntityReferenceBlock = objeto externo autorizado, como commit ou PR.
QuestionBlock = pergunta objetiva para destravar ambiguidade.
ToolRunStatusBlock = estado visivel de busca/processamento.
```

## Sequencia padrao para acoes

Use este fluxo sempre que a intencao do usuario alterar dados:

```txt
usuario pede acao
assistente busca contexto ou pergunta o que falta
assistente cria proposal
usuario aprova, edita ou rejeita
frontend chama apply
backend revalida e aplica
conversa recebe entity reference real
usuario clica e navega para o objeto
```

## Fluxos que precisam estar especificados

### Criar plano

1. Usuario pede um novo plano.
2. Assistente prepara proposta com metadados e, se fizer sentido, cartoes iniciais.
3. Usuario aprova.
4. Backend cria o plano.
5. Conversa mostra `PlanReferenceBlock`.
6. Clique abre o plano real.

### Criar cartoes a partir de contexto

1. Usuario pede para quebrar trabalho em tarefas.
2. Assistente busca contexto do workspace/plano.
3. Assistente cria proposta de criacao em lote.
4. Usuario aprova.
5. Backend cria cartoes reais.
6. Conversa mostra referencias clicaveis para os cartoes.

### Perguntar sobre trabalho existente

1. Usuario pergunta sobre plano, card, arquivo ou membro.
2. Assistente busca contexto ou detalhes da entidade se necessario.
3. Assistente responde com narrativa e referencias clicaveis quando util.
4. Nenhuma proposta e criada se a intencao for somente leitura.

### Convite ou atribuicao

1. Usuario pede para convidar ou atribuir alguem.
2. Assistente verifica membros, contexto e permissao.
3. Assistente cria proposta de convite ou atribuicao.
4. Usuario aprova.
5. Backend aplica e conversa mostra entidade real atualizada.

### GitHub para Kanban

1. Usuario pede commits/PRs relacionados a um tema.
2. Assistente busca GitHub somente se a integracao estiver habilitada.
3. Assistente mostra referencias GitHub ou cria proposta para anexar/criar cards.
4. Usuario aprova a proposta quando houver mudanca no Plan Things.
5. Backend cria links locais e conversa mostra card/commit/PR relacionados.

## Estados obrigatorios

Especifique comportamento para:

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

## Limites desta frente

- Nao implemente componentes visuais completos; isso pertence a frente 02.
- Nao implemente endpoints, banco ou OpenAI; isso pertence as frentes seguintes.
- Nao transforme propostas em aplicacao automatica.
- Nao permita escrita no GitHub no MVP.

## Aceite

- Os fluxos distinguem narrativa, proposta e entidade real.
- A regra de aprovacao humana esta explicita para toda escrita.
- O comportamento de clique esta definido para plano, cartao, arquivo, Inbox, commit e PR.
- Os estados obrigatorios tem significado de produto claro.
- UI, backend e tools conseguem usar este arquivo como contrato de comportamento.
