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

4. Integracao Gmail nas Configuracoes
   - Estado: concluida
   - Conexao real e persistida com Gmail para envio, usando OAuth Google com `gmail.send`, refresh token criptografado e status recuperado pelo backend.
   - Arquivos:
     `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
     `services/api/src/main/java/com/planthings/api/settings/SettingsController.java`
     `services/api/src/main/java/com/planthings/api/settings/SettingsService.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailConnectionRepository.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java`
     `services/api/src/main/java/com/planthings/api/settings/IntegrationTokenCipher.java`
     `services/api/src/main/resources/db/migration/V8__gmail_integrations.sql`
     `services/api/src/test/java/com/planthings/api/GmailIntegrationApiIntegrationTest.java`

5. Envio de convite por e-mail pelo owner/admin do plano
   - Estado: concluida
   - Usa a integracao Gmail conectada pelo owner/admin para enviar convite real por e-mail antes de persistir o convite pendente.
   - Arquivos:
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.invites.test.jsx`
     `services/api/src/main/java/com/planthings/api/plans/PlanController.java`
     `services/api/src/main/java/com/planthings/api/plans/PlanService.java`
     `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java`
     `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java`
     `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java`
     `services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailApiClient.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailConnectionStatusService.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java`
     `services/api/src/test/java/com/planthings/api/PlanInviteGmailIntegrationTest.java`
     `services/api/src/test/java/com/planthings/api/settings/DefaultGmailApiClientTest.java`
     `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
     `apps/web/src/features/workspace/components/InviteNotifications/InviteNotifications.jsx`

6. Inbox da sidebar no KanbanBoard
   - Estado: concluida
   - Usa a integracao Gmail ja concluida para transformar a Inbox em destino de drop: ao soltar um cartao, o sistema envia email pela conta Gmail conectada apenas para novos membros selecionados, atribui esses membros ao cartao, lista os envios de forma persistente e permite limpar o historico pela sidebar.
   - Arquivos:
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`
     `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.inbox.test.jsx`
     `apps/web/src/shared/contracts/backendAdapters.js`
     `services/api/src/main/java/com/planthings/api/board/BoardController.java`
     `services/api/src/main/java/com/planthings/api/board/BoardService.java`
     `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java`
     `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java`
     `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java`
     `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRepository.java`
     `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientRepository.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailMessageSender.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailMimeSupport.java`
     `services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java`
     `services/api/src/main/resources/db/migration/V9__board_card_inbox_deliveries.sql`
     `services/api/src/test/java/com/planthings/api/BoardInboxGmailIntegrationTest.java`

## Proximas etapas

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
