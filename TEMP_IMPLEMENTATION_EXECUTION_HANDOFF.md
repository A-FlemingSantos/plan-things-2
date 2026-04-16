# Handoff de Implementação (F1–F10)

Data: 2026-04-16  
Projeto: `plan-things-2`  
Objetivo: consolidar contexto técnico suficiente para revisão por segundo agente.

## 1) Resumo executivo
Todas as findings F1–F10 do `TEMP_IMPLEMENTATION_PLAN.md` foram implementadas no backend e frontend, com validação automatizada concluída com sucesso.

Status geral: **Concluído**.

## 2) Evidências de validação obrigatória
Comandos executados:

1. `mvn test` em `services/api` -> **PASS**  
2. `npm run build` em `apps/web` -> **PASS**  
3. `npm run test:run` em `apps/web` -> **PASS**

Observações não-bloqueantes identificadas durante execução:
- Warning de chunk grande no build Vite.
- Warnings de depreciação (`esbuild`/`optimizeDeps.esbuildOptions`) no Vitest.
- Warning do Mockito sobre self-attach de agent no JDK (futuro endurecimento).

Nenhum desses warnings bloqueou build/test.

## 3) Escopo implementado por finding

### F1 - Exclusão/restauração recursiva de pastas
Implementado:
- Soft-delete recursivo no backend para pasta + subárvore.
- Restore recursivo no backend para pasta + subárvore.
- Frontend de arquivos não promove órfãos para raiz ao montar árvore.

Arquivos principais:
- `services/api/src/main/java/com/planthings/api/files/FileService.java`
- `services/api/src/main/java/com/planthings/api/files/FileEntryRepository.java`
- `apps/web/src/shared/contracts/backendAdapters.js`

Teste adicionado:
- `services/api/src/test/java/com/planthings/api/FileApiIntegrationTest.java` (`shouldDeleteAndRestoreFolderTreeRecursively`)

---

### F2 - Board/Canvas sem loading infinito
Implementado:
- Separação explícita de estados: `loading`, `sem plano`, `erro`.
- Estado “sem plano” é informativo, estável e **sem CTA**.
- Erro de carga deixa de ficar mascarado como loading infinito.

Arquivos principais:
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`
- `apps/web/src/features/canvas/pages/CanvasPage/CanvasPage.jsx`
- `apps/web/src/features/canvas/pages/CanvasPage/CanvasPage.module.css`

---

### F3 - Falhas silenciosas em Arquivos
Implementado:
- Estado de erro de integração no conteúdo da página de arquivos.
- Botão de retry para recarregar biblioteca.
- Toasts para falhas de upload e criação de pasta (antes só `console.error`).

Arquivos principais:
- `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`
- `apps/web/src/features/files/pages/FilesPage/FilesPage.module.css`

---

### F4 - Download de pasta não pode mentir
Implementado:
- A ação de download permanece visível para pasta.
- Ao acionar em pasta, UI informa explicitamente que ainda não é suportado.
- Removido comportamento de falso sucesso (“baixando...”) para pasta.

Arquivo principal:
- `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`

---

### F5 - `taskCount` no Workspace
Implementado:
- Backend passou a expor `taskCount` em `GET /api/plans`.
- Frontend passou a mapear `tasks` a partir de `taskCount`.

Arquivos principais:
- `services/api/src/main/java/com/planthings/api/plans/PlanService.java`
- `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java`
- `apps/web/src/shared/contracts/backendAdapters.js`

Teste adicionado:
- `services/api/src/test/java/com/planthings/api/PlanApiIntegrationTest.java` (`shouldExposeTaskCountInPlanSummaryList`)

---

### F6 - Mutações do Board resilientes em erro
Implementado:
- `createColumn`, `renameColumn` e `addCard` agora propagam erro ao chamador.
- Formulários de coluna/cartão permanecem abertos quando falha API.
- Mensagem de erro inline + toast para permitir correção e reenvio.

Arquivos principais:
- `apps/web/src/features/workspace/hooks/useBoardColumns.js`
- `apps/web/src/features/workspace/components/KanbanColumn/KanbanColumn.jsx`
- `apps/web/src/features/workspace/components/AddColumnComposer/AddColumnComposer.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`

---

### F7 - Delete no Calendar com confirmação e erro visível
Implementado:
- Confirmação explícita antes de excluir evento.
- Em erro, notificação + bloco visual com ação de retry.

Arquivos principais:
- `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx`
- `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.module.css`

---

### F8 - Fluxo real de forgot/reset
Implementado:
- Novas telas funcionais para `/forgot` e `/reset`.
- `/forgot` chama `/api/auth/forgot-password` e redireciona automaticamente para `/reset` com token.
- `/reset` chama `/api/auth/reset-password`.
- Após sucesso, redireciona para login com mensagem de confirmação.

Arquivos principais:
- `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx` (novo)
- `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.module.css` (novo)
- `apps/web/src/App.jsx`
- `apps/web/src/shared/config/routes.js`
- `apps/web/src/features/auth/pages/Auth/Auth.jsx`
- `apps/web/src/features/auth/pages/Auth/Auth.module.css`
- `apps/web/src/features/info/data/infoPages.js` (remoção do placeholder de `/forgot`)

---

### F9 - Owner hardcoded em Arquivos
Implementado:
- Owner próprio agora aparece como **“Eu”** também no painel de detalhes.
- Removido texto fixo com nome pessoal.

Arquivo principal:
- `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`

---

### F10 - Hardening do guard de datasource
Implementado:
- Fora do profile `test`, `databaseName` passou a ser obrigatório.
- Fora de `test`, allowlist estrita: somente `plan_things_db`.
- Bloqueia inicialização para ausência de `databaseName` ou qualquer outro DB.

Arquivos principais:
- `services/api/src/main/java/com/planthings/api/config/DatasourceSafetyGuard.java`
- `services/api/src/test/java/com/planthings/api/DatasourceSafetyGuardTest.java`

Cobertura dos cenários:
- test profile permitido.
- sem `databaseName` bloqueado.
- DB inválido bloqueado.
- DB oficial permitido.

## 4) Contratos e semântica alterados

1. `GET /api/plans` agora inclui `taskCount` por plano.
2. Semântica de delete/restore de pasta em arquivos agora é recursiva.
3. Frontend passou a ter fluxo funcional de recuperação em `/forgot` e `/reset`.

## 5) Pontos de verificação manual (checklist sugerido)

### F1
- Criar pasta A > pasta B > arquivo C.
- Excluir A.
- Verificar na lixeira que A, B, C estão deletados.
- Restaurar A.
- Verificar que B e C retornam com hierarquia intacta.

### F2
- Navegar para board/canvas sem plano ativo.
- Confirmar empty state textual estável, sem spinner infinito.
- Simular erro de carga e validar estado de erro visível.

### F3/F4/F9
- Em Arquivos, forçar falha de API e validar estado de erro + retry.
- Acionar “Baixar” em pasta: deve avisar não suportado.
- Conferir owner de item próprio como “Eu”.

### F5
- Criar cards em um plano no board.
- Voltar ao workspace e validar contagem de tarefas do card do plano.

### F6
- Forçar falha em criar lista / renomear coluna / adicionar cartão.
- Confirmar formulário aberto + mensagem de erro + possibilidade de retry imediato.

### F7
- Clicar excluir evento no calendário.
- Confirmar diálogo de confirmação.
- Em falha, validar erro visível com botão de nova tentativa.

### F8
- Em `/forgot`, informar email válido.
- Confirmar redirecionamento automático para `/reset` com token preenchido.
- Finalizar reset e validar redirecionamento para `/login` com mensagem de sucesso.

### F10
- Subir app backend fora de `test` com URL sem `databaseName` -> deve bloquear.
- Subir com `databaseName=master` -> deve bloquear.
- Subir com `databaseName=plan_things_db` -> deve permitir.

## 6) Arquivos novos criados
- `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx`
- `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.module.css`

## 7) Lista consolidada de arquivos alterados (alto nível)

### Backend
- `services/api/src/main/java/com/planthings/api/config/DatasourceSafetyGuard.java`
- `services/api/src/main/java/com/planthings/api/files/FileEntryRepository.java`
- `services/api/src/main/java/com/planthings/api/files/FileService.java`
- `services/api/src/main/java/com/planthings/api/plans/PlanService.java`
- `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java`
- `services/api/src/test/java/com/planthings/api/DatasourceSafetyGuardTest.java`
- `services/api/src/test/java/com/planthings/api/FileApiIntegrationTest.java`
- `services/api/src/test/java/com/planthings/api/PlanApiIntegrationTest.java`

### Frontend
- `apps/web/src/shared/contracts/backendAdapters.js`
- `apps/web/src/shared/config/routes.js`
- `apps/web/src/App.jsx`
- `apps/web/src/features/workspace/hooks/useBoardColumns.js`
- `apps/web/src/features/workspace/components/KanbanColumn/KanbanColumn.jsx`
- `apps/web/src/features/workspace/components/AddColumnComposer/AddColumnComposer.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`
- `apps/web/src/features/canvas/pages/CanvasPage/CanvasPage.jsx`
- `apps/web/src/features/canvas/pages/CanvasPage/CanvasPage.module.css`
- `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`
- `apps/web/src/features/files/pages/FilesPage/FilesPage.module.css`
- `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx`
- `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.module.css`
- `apps/web/src/features/auth/pages/Auth/Auth.jsx`
- `apps/web/src/features/auth/pages/Auth/Auth.module.css`
- `apps/web/src/features/info/data/infoPages.js`
- `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx`
- `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.module.css`

## 8) Notas finais para o segundo agente
- O escopo foi mantido estritamente alinhado ao plano F1–F10.
- Não houve alteração intencional de comportamento além das decisões fechadas.
- A revisão pode focar em:
  - consistência de UX de erro entre telas;
  - semântica de recursividade em arquivos;
  - robustez do novo fluxo auth `/forgot` -> `/reset` -> `/login`;
  - regressões de roteamento e carregamento em board/canvas.
