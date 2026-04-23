# Colaboração em Planos — Roadmap

## Status (resumo)

- Trilho A (MVP): **implementado** (convites + membros + UI mínima).
- Trilho A.1 (pós-MVP): **pendente** (convites “completos” + ajustes de permissões/UI).
- Trilho B: **implementado** (arquivos/anexos no board + permissões de compartilhamento/remoção + colaboração de arquivos no plano).
- Trilho B.1 (pós-implementação): **opcional** (refinamentos de UX, paginação/busca, auditoria e realtime futuro).

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

### Escopo implementado

- Toolbar do board:
  - botão `Arquivos` no lugar de `Mudar de quadros`
  - abertura de sidebar direita no mesmo padrão visual de `Planejador`/`Caixa de entrada`
  - comportamento mutuamente exclusivo entre `Arquivos`, `Planejador` e `Caixa de entrada`
- Sidebar de arquivos:
  - filtros `Plano` e `Biblioteca`
  - list-view plana, sem pastas nesta etapa
  - download de arquivos
  - compartilhar arquivo próprio com o plano
  - descompartilhar arquivo do plano quando permitido
- Modal do cartão:
  - seção inline `Anexos`
  - picker modal próprio acionado pelo item `Arquivo`
  - filtros `Plano` e `Biblioteca`
  - anexar apenas arquivos, nunca pastas
  - anexar a partir da `Biblioteca` compartilha automaticamente o arquivo com o plano ativo
- Backend/API:
  - `POST /api/files/{fileId}/attach/cards/{cardId}` atualizado para aceitar arquivo próprio ou arquivo já acessível pelo plano
  - `DELETE /api/files/attachments/{attachmentId}` para remover anexo
  - `DELETE /api/files/{fileId}/share/plans/{planId}` para descompartilhar arquivo do plano
  - `BoardCardView` passa a retornar `attachments`
  - `AttachmentView` inclui dados do arquivo, autor do anexo e flags de permissão
- Permissões aplicadas:
  - `MEMBER` pode ver/baixar arquivos do plano, compartilhar arquivo próprio, anexar arquivo próprio ou já compartilhado, remover apenas anexo próprio e descompartilhar apenas arquivo compartilhado por ele
  - `ADMIN`/`OWNER` podem remover qualquer anexo e descompartilhar qualquer arquivo do plano
  - descompartilhar arquivo ainda anexado a cartão do plano retorna conflito
  - pastas não são anexáveis nem compartilháveis para esse fluxo de anexos

### Pronto quando

- Arquivos compartilhados no plano viram uma fonte comum para anexos de cartão.
- O board expõe anexos no payload e o modal do cartão permite anexar, baixar e remover conforme permissão.
- O fluxo de compartilhar, anexar e descompartilhar respeita as regras de papel do plano.

### Status

- Implementado na branch `codex/design-features` (commit `70f5d56`).

## Trilho B.1 — “refinamentos pós-implementação de arquivos/anexos” (opcional)

### UX e escala

- Busca, paginação e ordenação na sidebar/picker de arquivos quando o volume crescer.
- Indicadores mais explícitos de origem/permissão do arquivo (`compartilhado por`, `anexado por`, estado de bloqueio para descompartilhar).
- Melhorias de feedback para erros de conflito e ações indisponíveis.

### Governança e colaboração futura

- Auditoria/atividade de arquivos e anexos (quem compartilhou, anexou, removeu, descompartilhou).
- Notificações ligadas a compartilhamento e anexos relevantes.
- Canvas/presença/realtime, se a colaboração síncrona virar prioridade em outra etapa.
