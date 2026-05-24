# Frente 07: Integracao GitHub

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Integrar GitHub como conector opcional do Plan Things Intelligence para ler repositorios, commits e pull requests, depois relaciona-los a cartoes do Plan Things.

A intencao desta frente e transformar atividade de desenvolvimento em contexto operacional do Kanban, sem dar poder de escrita no GitHub ao assistente. O Plan Things pode ler commits/PRs autorizados, sugerir cartoes, anexar referencias a cards e manter links locais auditaveis.

## Tipo de integracao

Usar GitHub App, nao OAuth App amplo.

Motivos:

- permissoes granulares;
- instalacao por usuario/organizacao;
- selecao de repositorios;
- webhooks;
- installation tokens de curta duracao;
- melhor isolamento por workspace.

O workspace deve controlar quais repositorios instalados ficam habilitados para Intelligence. Instalacao no GitHub nao significa exposicao automatica ao modelo.

## Permissoes iniciais

Solicitar permissoes read-only primeiro:

```txt
Metadata: read
Contents: read
Pull requests: read
Commit statuses: read opcional
Checks: read opcional
Issues: read opcional
```

Nao solicitar permissoes de escrita no GitHub no MVP.

Permissoes de escrita futuras devem ser avaliadas separadamente e nao fazem parte do contrato inicial. O MVP escreve apenas no banco do Plan Things, por exemplo criando `external_entity_links`.

## Tabelas

```txt
github_installations
- id
- workspace_id
- installation_id
- account_login
- account_type
- repository_selection
- status
- created_at
- updated_at

github_repositories
- id
- workspace_id
- installation_id
- github_repo_id
- owner
- name
- full_name
- default_branch
- private
- enabled
- last_synced_at

external_entity_links
- id
- workspace_id
- provider
- external_type
- external_id
- external_url
- entity_type
- entity_id
- metadata_json
- created_by_user_id
- created_at
```

`external_entity_links` e a ponte principal entre GitHub e entidades locais. Ela permite mostrar commits/PRs no card mesmo depois da conversa terminar, e evita depender de buscar tudo novamente no GitHub para renderizar historico basico.

## Model-facing tool

Expor apenas:

```txt
github.search
```

quando GitHub estiver conectado, habilitado e autorizado.

Capabilities internas:

```txt
github.repo.search
github.commit.search
github.commit.get
github.pull_request.search
github.pull_request.get
github.commit.attach_to_card_proposal
github.pull_request.attach_to_card_proposal
github.suggest_cards_from_commits
github.apply_attach_to_card
```

Apply e apenas interno.

`github.search` deve aceitar intencao do usuario, tipos de entidade, repos autorizados e filtros de data quando existirem. O backend decide internamente se lista commits, busca PRs, consulta cache local ou chama detalhes especificos.

## Webhooks

Eventos iniciais:

```txt
installation
installation_repositories
push
pull_request
pull_request_review
check_suite opcional
check_run opcional
```

Regras:

- validar `X-Hub-Signature-256`;
- usar webhook secret;
- rejeitar payload invalido;
- garantir idempotencia por delivery id;
- enfileirar processamento e responder rapidamente.

Tabela:

```txt
github_webhook_events
- id
- delivery_id
- event_type
- action
- installation_id
- repository_id nullable
- payload_json
- processed_at nullable
- status
- created_at
```

Webhooks devem manter cache e links atualizados, mas nao devem disparar acoes de IA sozinhos no MVP. Eles alimentam dados para buscas futuras e reduzem dependencia de polling/rate limit.

## Blocos

Commits e PRs renderizam como:

```txt
GitHubCommitBlock
GitHubPullRequestBlock
```

Eles podem ser anexados a cartoes usando `external_entity_links`.

Blocos GitHub devem mostrar origem, repo, autor, data, mensagem/titulo e status basico quando disponivel. O clique pode abrir GitHub em nova aba ou uma visao de detalhes local, mas a conversa deve preservar snapshot suficiente para continuar compreensivel.

## Fluxos esperados

### Buscar commits recentes

1. Usuario pede commits relacionados a um tema.
2. Backend verifica GitHub conectado, repos habilitados e permissoes.
3. `github.search` retorna commits/PRs autorizados.
4. Assistente responde com narrativa curta e blocos GitHub.

### Anexar commit a card

1. Usuario pede para anexar commit/PR a um card.
2. Assistente usa `github.search` e/ou `entity.get`.
3. Assistente cria proposta via `action.propose`.
4. Usuario aprova.
5. Backend cria `external_entity_links` e conversa mostra card/commit relacionados.

## Fora do escopo

- Escrever comentarios no GitHub.
- Criar issues no GitHub.
- Abrir pull requests.
- Fazer push de branches.

## Definition of Done

- GitHub App pode ser instalado para um workspace.
- Repositorios autorizados podem ser listados/habilitados.
- Validacao de assinatura de webhook existe.
- `github.search` retorna commits/PRs autorizados.
- Commits/PRs podem ser propostos como anexos de cartoes.
- Anexos aplicados criam `external_entity_links` locais.
