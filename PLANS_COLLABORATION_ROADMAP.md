# Colaboração em Planos — Roadmap

## Trilho A — MVP (“convites + membros + UI mínima”)

### Backend (gaps que destravam UI)

- `GET /api/plans/{planId}/invites` (listar convites pendentes/expirados/aceitos do plano).
- `POST /api/plans/{planId}/invites/{inviteId}/revoke` (revogar convite; hoje existe `REVOKED`, mas não há fluxo).
- (Opcional) `GET /api/plans/invites/pending` (listar “meus convites” pelo e-mail do usuário autenticado; evita depender de token “fora da banda”).

### Web UI (mínimo usável)

- No board: trocar “Convites em breve” por modal de convite (campo e-mail → chama `POST /api/plans/{planId}/invites` e mostra link/token para copiar).
- Tela/Drawer “Membros do plano”: lista membros + role (já vem de `GET /api/plans/{planId}`), com ação remover membro (já existe endpoint).
- Tela “Aceitar/Recusar convite”: rota que consome token e chama `/api/plans/invites/{token}/accept|decline`.

### Permissões (MVP)

- Validar regras básicas: só `OWNER`/`ADMIN` convida e remove membros (já é assim via `requirePlanManager`), e UI esconder/disable ações conforme `activePlan.role`.

### Pronto quando

- Um `OWNER`/`ADMIN` consegue convidar alguém.
- A pessoa aceita logada e aparece como membro.
- O board passa a mostrar membros reais (já mostra `membersMeta` quando vem do backend).

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

