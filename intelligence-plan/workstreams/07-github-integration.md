# Frente 07: Integracao GitHub

## Missao do agente

Implemente GitHub como conector opcional e read-only para o Plan Things Intelligence. O sistema deve ler repositorios, commits e pull requests autorizados, relaciona-los a cards e criar links locais auditaveis.

Nao implemente escrita no GitHub no MVP.

## Tipo de integracao

Use GitHub App, nao OAuth App amplo.

Motivos:

- permissoes granulares;
- instalacao por usuario/organizacao;
- selecao de repositorios;
- webhooks;
- installation tokens de curta duracao;
- isolamento por workspace.

Instalacao no GitHub nao significa exposicao automatica ao modelo. O workspace deve habilitar repositorios para Intelligence.

## Permissoes iniciais

Solicite read-only:

```txt
Metadata: read
Contents: read
Pull requests: read
Commit statuses: read opcional
Checks: read opcional
Issues: read opcional
```

Nao solicite write permissions no MVP.

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

`external_entity_links` e a ponte entre GitHub e entidades locais.

## Tool e capabilities

Model-facing tool:

```txt
github.search
```

Enviar somente quando GitHub estiver conectado, habilitado e autorizado.

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

Apply e interno e altera apenas o Plan Things, criando links locais.

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
- enfileirar processamento;
- responder rapido ao GitHub.

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

Webhooks alimentam cache/busca. Nao dispare acoes de IA sozinho no MVP.

## Blocos

Renderize GitHub como:

```txt
GitHubCommitBlock
GitHubPullRequestBlock
```

Campos esperados:

- provider;
- repo;
- autor;
- data;
- SHA ou numero do PR;
- mensagem/titulo;
- status basico quando disponivel;
- external URL;
- snapshot suficiente para historico.

## Fluxos obrigatorios

### Buscar commits recentes

1. Usuario pede commits relacionados a tema.
2. Backend verifica integracao, repos habilitados e permissoes.
3. `github.search` retorna commits/PRs autorizados.
4. Assistente responde com narrativa e blocos GitHub.

### Anexar commit ou PR a card

1. Usuario pede anexacao.
2. Assistente usa `github.search` e/ou `entity.get`.
3. Assistente cria proposta via `action.propose`.
4. Usuario aprova.
5. Backend cria `external_entity_links`.
6. Conversa mostra card e commit/PR relacionados.

## Limites desta frente

- Nao escrever comentarios no GitHub.
- Nao criar issues.
- Nao abrir PRs.
- Nao fazer push.
- Nao expor repos nao habilitados pelo workspace.

## Aceite

- GitHub App pode ser instalado para workspace.
- Repos autorizados podem ser listados/habilitados.
- Webhook valida assinatura e idempotencia.
- `github.search` retorna commits/PRs autorizados.
- Commits/PRs podem virar proposta de anexo.
- Apply cria `external_entity_links` locais.
