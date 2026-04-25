# Sequencia de Implementacoes

Indice de execucao das etapas. O detalhamento de contexto, estado atual e decisoes de produto fica em [STATUS_OVERVIEW.md](STATUS_OVERVIEW.md).

## Concluidas

1. Convites de plano na UI
   - Estado: concluida
   - Arquivos:
     `services/api/src/main/java/com/planthings/api/plans/PlanController.java`
     `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

2. Sidebar "Arquivos" no KanbanBoard
   - Estado: concluida
   - Arquivos:
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
     `apps/web/src/features/workspace/components/KanbanColumn/KanbanColumn.jsx`
     `apps/web/src/features/workspace/components/KanbanCard/KanbanCard.jsx`
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`
     `apps/web/src/features/workspace/components/KanbanCard/KanbanCard.test.jsx`

3. OAuth com Google como login da conta
   - Estado: concluida
   - Arquivos:
     `apps/web/src/features/auth/pages/Auth/Auth.jsx`
     `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx`
     `apps/web/src/features/auth/context/AuthContext.jsx`

## Proximas etapas

4. Integracao Gmail nas Configuracoes
   - Base tecnica para as proximas etapas de email.
   - Arquivos:
     `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

5. Envio de convite por e-mail pelo owner/admin do plano
   - Usa a integracao Gmail para substituir o convite interno do KanbanBoard por email real.
   - Arquivos:
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
     `services/api/src/main/java/com/planthings/api/plans/PlanController.java`
     `services/api/src/main/java/com/planthings/api/plans/PlanService.java`
     `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java`
     `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java`
     `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
     `apps/web/src/features/workspace/components/InviteNotifications/InviteNotifications.jsx`

6. Inbox da sidebar no KanbanBoard
   - Usa a integracao Gmail para disparar email automatico a partir de um cartao do KanbanBoard.
   - Arquivos:
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

7. Governanca de colaboracao
   - Arquivos:
     `services/api/src/main/java/com/planthings/api/plans/PlanController.java`
     `services/api/src/main/java/com/planthings/api/files/FileController.java`
     `services/api/src/main/java/com/planthings/api/board/BoardService.java`

8. Refino de arquivos e anexos
   - Arquivos:
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
     `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`

9. Settings e entrada no app
   - Arquivos:
     `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

## Opcional e por ultimo

10. Google Calendar
    - Arquivos:
      `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
      `apps/web/src/features/calendar/data/calendarRepository.js`
