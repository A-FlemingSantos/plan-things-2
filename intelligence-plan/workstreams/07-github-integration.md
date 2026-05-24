# Workstream 07: GitHub Integration

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Integrate GitHub as an optional Plan Things Intelligence connector for reading repositories, commits, and pull requests, then linking them to Plan Things cards.

## Integration Type

Use a GitHub App, not a broad OAuth App.

Reasons:

- granular permissions;
- installation per user/org;
- repository selection;
- webhooks;
- short-lived installation tokens;
- better workspace isolation.

## Initial Permissions

Request read-only permissions first:

```txt
Metadata: read
Contents: read
Pull requests: read
Commit statuses: read optional
Checks: read optional
Issues: read optional
```

Do not request GitHub write permissions in the MVP.

## Tables

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

## Model-Facing Tool

Expose only:

```txt
github.search
```

when GitHub is connected, enabled, and authorized.

Internal capabilities:

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

Apply is internal only.

## Webhooks

Initial events:

```txt
installation
installation_repositories
push
pull_request
pull_request_review
check_suite optional
check_run optional
```

Rules:

- validate `X-Hub-Signature-256`;
- use webhook secret;
- reject invalid payloads;
- idempotency by delivery id;
- enqueue processing and respond quickly.

Table:

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

## Blocks

Commits and PRs render as:

```txt
GitHubCommitBlock
GitHubPullRequestBlock
```

They can be attached to cards using `external_entity_links`.

## Out Of Scope

- Writing comments to GitHub.
- Creating GitHub issues.
- Opening pull requests.
- Pushing branches.

## Definition Of Done

- GitHub App can be installed for a workspace.
- Authorized repositories can be listed/enabled.
- Webhook signature validation exists.
- `github.search` returns authorized commits/PRs.
- Commits/PRs can be proposed as card attachments.
- Applied attachments create local `external_entity_links`.

