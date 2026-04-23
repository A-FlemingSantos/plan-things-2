# Colaboração em Planos — Roadmap

## Status (resumo)

- Trilho A (MVP): **implementado** (convites + membros + UI mínima).
- Trilho A.1 (pós-MVP): **pendente** (convites “completos” + ajustes de permissões/UI).
- Trilho B: **pendente** (arquivos/anexos + permissões consistentes + colaboração completa).

## Trilho A — MVP (“convites + membros + UI mínima”)

### Backend (gaps que destravam UI)

- `GET /api/plans/{planId}/invites` (listar convites pendentes/expirados/aceitos do plano).
- `POST /api/plans/{planId}/invites/{inviteId}/revoke` (revogar convite; hoje existe `REVOKED`, mas não há fluxo).
- (Opcional) `GET /api/plans/invites/pending` (listar “meus convites” pelo e-mail do usuário autenticado; evita depender de token “fora da banda”).

### Web UI (mínimo usável)

- No board: trocar “Convites em breve” por modal de convite (campo e-mail → chama `POST /api/plans/{planId}/invites` e mostra link/token para copiar).
- No board: dropdown de “Membros do plano” com lista + role e ação remover membro (quando `OWNER/ADMIN`).
- Tela “Aceitar convite”: rota que consome token e faz auto-aceite.

### Permissões (MVP)

- Validar regras básicas: só `OWNER`/`ADMIN` convida e remove membros (já é assim via `requirePlanManager`), e UI esconder/disable ações conforme `activePlan.role`.

### Pronto quando

- Um `OWNER`/`ADMIN` consegue convidar alguém.
- A pessoa aceita logada e aparece como membro.
- O board passa a mostrar membros reais (já mostra `membersMeta` quando vem do backend).

### Status

- Implementado na branch `codex/design-features` (commits `4fc6022`, `fb9ff58`).

## Trilho A.1 — “convites + permissões” (ramificação pós-MVP)

### Convites (fechar ciclo)

- UI para listar convites do plano (`GET /api/plans/{planId}/invites`) e permitir revogar (`POST /api/plans/{planId}/invites/{inviteId}/revoke`).
- UI de “recusar convite” (hoje existe endpoint `/api/plans/invites/{token}/decline`), incluindo mensagens/CTAs.
- (Opcional) `GET /api/plans/invites/pending` + UI de “Meus convites” (sem depender de token “fora da banda”).
- E-mail de convite (quando houver infra):
  - integração de provedor/SMTP (sistema envia; não “pelo e-mail do usuário”)
  - template + link de aceite
  - decidir estratégia de retry/falha de envio.

### Permissões/UI

- Consolidar regras de UI (mostrar/esconder ações) conforme `activePlan.role` e estado do backend.
- Decidir UX para “remover a si mesmo” / “remover owner” (hoje está escondido no MVP).

### Pronto quando

- Owner/Admin consegue gerir convites (listar + revogar) e convidado consegue aceitar/recusar via UI.

## Trilho B — “colaboração completa com arquivos/anexos + permissões”

### Arquivos no contexto do Plano (UI + endpoints existentes)

- Web: tela “Arquivos do plano” usando `GET /api/files/plans/{planId}`.
- Web: ação “Compartilhar com o plano” na biblioteca pessoal chamando `POST /api/files/{fileId}/share/plans/{planId}`.
- Backend: endpoint para descompartilhar (não vi) e decidir se compartilhar exige `MEMBER` ou apenas `ADMIN`/`OWNER`.

### Anexos de cartão (fechar ciclo)

- Backend: hoje `attachToCard` exige arquivo “owned” (`requireOwnedFile`), então falta suportar anexar arquivo acessível ao plano (ex.: arquivo compartilhado por outro membro).
- Backend/UI: listar anexos por cartão e remover anexo (não vi no board payload/endpoint hoje).
- Web: UI de anexos no modal do cartão (selecionar de “Arquivos do plano” / “Minha biblioteca”).

### Permissões de verdade (RBAC leve)

- Separar permissões por ação (ex.: `MEMBER` pode editar cartões? comentar? anexar arquivo? `ADMIN` gerencia membros?).
- Aplicar checagens consistentes em board/files/canvas (hoje a maioria é “membro pode”).

### Colaboração avançada (opcional, depois)

- Canvas: presença/realtime (hoje é só controle de versão).
- Auditoria/atividade: log de ações (convites, anexos, mudanças), e notificações.

### Pronto quando

- Arquivos compartilhados no plano viram “fonte comum” (qualquer membro pode anexar ao cartão).
- Há UI completa de anexos.
- Há um modelo de permissões consistente.
