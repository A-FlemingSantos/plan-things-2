# Frente 07: Integracao GitHub

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Integrar GitHub como conector opcional do Plan Things Intelligence para ler repositorios, commits e pull requests, depois relaciona-los a cartoes do Plan Things.

## Tipo de integracao

Usar GitHub App, nao OAuth App amplo.

Motivos:

- permissoes granulares;
- instalacao por usuario/organizacao;
- selecao de repositorios;
- webhooks;
- installation tokens de curta duracao;
- melhor isolamento por workspace.

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

## Blocos

Commits e PRs renderizam como:

```txt
GitHubCommitBlock
GitHubPullRequestBlock
```

Eles podem ser anexados a cartoes usando `external_entity_links`.

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

