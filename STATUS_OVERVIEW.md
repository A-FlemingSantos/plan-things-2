# Status Overview - Colaboracao e Settings

Este documento resume o estado real do projeto depois das etapas 1, 2 e 3. O foco aqui e dizer onde cada coisa mora no codigo e qual e o estado atual de cada area.

## 1. O que ja existe hoje

### Convites de plano

Onde isso vive no projeto:
- backend de convites em `services/api/src/main/java/com/planthings/api/plans/PlanController.java`
- aceitação e recusa por token em `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
- painel de membros e convites em `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

Estado atual:
- o backend cria, lista, revoga, aceita e recusa convites de plano
- o gestor do plano consegue ver convites enviados e remover convites pendentes
- o usuario convidado consegue abrir o convite por token e aceitar ou recusar
- existe notificacao global de convite em `Workspace`, `Board`, `Calendar` e `Files`
- o quadro tem uma aba de convites para os convites enviados do plano

### Arquivos e anexos

Onde isso vive no projeto:
- arquivos do plano em `services/api/src/main/java/com/planthings/api/files/FileController.java`
- suporte a anexos em `services/api/src/main/java/com/planthings/api/board/BoardService.java`
- sidebar de arquivos no quadro em `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- componentes de cartao e coluna em `apps/web/src/features/workspace/components/KanbanCard/KanbanCard.jsx` e `apps/web/src/features/workspace/components/KanbanColumn/KanbanColumn.jsx`

Estado atual:
- arquivos do plano podem ser listados, compartilhados, descompartilhados e baixados
- cartoes aceitam anexos
- qualquer membro do plano pode anexar arquivos a um cartao
- nao existe restricao de papel para anexar
- a sidebar `Arquivos` aceita drag-and-drop de arquivos das secoes `Plano` e `Biblioteca`
- o frontend separa o drag de arquivos do drag de mover cartoes
- o frontend controla um preview custom do arquivo arrastado
- o backend continua validando permissao, compartilhamento automatico da Biblioteca e anexos duplicados
- anexos podem ser removidos

### Settings e preferencias

Onde isso vive no projeto:
- pagina de settings em `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
- seção de preferencia inicial, layout e notificacoes na mesma pagina

Estado atual:
- `locale`, `timeZone`, `dateFormat`, `timeFormat` e `theme` ja sao persistidos e validados
- `homePage` e `openLastCtx` interferem na rota inicial do usuario
- o app lembra o ultimo contexto valido e usa isso na entrada
- `emailNotifs`, `eventReminders` e `deadlineAlerts` ja sao salvos no backend

### OAuth e identidade de conta

Onde isso vive no projeto:
- tela de login em `apps/web/src/features/auth/pages/Auth/Auth.jsx`
- rota `/oauth/callback`
- contexto de autenticacao do frontend
- endpoints OAuth/OIDC do backend e troca do completion code pela sessao do Plan Things

Estado atual:
- o fluxo OAuth/OIDC com Google existe para identidade de login da conta
- o backend usa Authorization Code Flow com escopos minimos `openid profile email`
- a sessao interna continua sendo a do Plan Things, com `AuthService.SessionResponse` e JWT proprio
- tokens externos nao sao persistidos
- o frontend inicia o OAuth real, trata o callback e conclui o login na sessao da aplicacao
- Microsoft nao faz parte do roadmap do produto

Observacao importante:
- a tela de login ainda pode mostrar botao de Microsoft como artefato visual, mas isso nao deve ser tratado como suporte de produto

## 2. O que ainda falta agora

### Gmail nas Configuracoes e convite por e-mail do plano

Onde isso vive no projeto:
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
- funcao `renderIntegrations()`
- `SectionGroup title="E-mail e captura"`
- card `Gmail`
- fluxo de convite de plano no backend, que sera o consumidor desse envio

O que falta:
- transformar o card `Gmail` em integracao real persistida
- usar a conta autenticada para envio e leitura contextual
- tratar retry, falha e feedback de envio
- conectar o convite por e-mail ao Gmail real

O que nao entra:
- Outlook
- Microsoft
- SMTP generico do sistema

### Inbox da sidebar no KanbanBoard

Onde isso vive no projeto:
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- funcao `renderInboxPanel()`
- aside com `id="board-inbox-panel"`

O que falta:
- arrastar um cartao de tarefa ou evento para a sidebar
- gerar e enviar e-mail com template dinamico para os membros do cartao
- exibir e-mails recebidos ligados a tarefas delegadas
- separar visualmente mensagens de tarefas e mensagens comuns

### Governanca de colaboracao

Onde isso deve viver:
- backend de convites, anexos e compartilhamento
- trilha de auditoria do plano

O que falta:
- registrar quem convidou, aceitou, recusou e revogou
- registrar quem anexou e quem descompartilhou
- manter historico visivel de atividade do plano

### Arquivos e anexos

Onde isso vive no projeto:
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`, funcao `renderFilesPanel()`
- `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`
- backend de arquivos e anexos

O que falta:
- busca
- paginacao
- ordenacao
- melhor sinalizacao de origem e contexto de cada arquivo

### Settings

Onde isso vive no projeto:
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

O que falta:
- `density` ainda nao esta persistida nem aplicada globalmente
- a opcao `Barra lateral recolhida por padrao` esta desabilitada e funciona como transicao
- `dailySummary` e `weeklySummary` continuam desabilitados
- `emailNotifs`, `eventReminders` e `deadlineAlerts` ainda nao dirigem uma camada completa de notificacoes do produto

### Calendarios externos

Onde isso vive no projeto:
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
- `SectionGroup title="Calendarios"`
- `apps/web/src/features/calendar/data/calendarRepository.js`

O que falta:
- Google Calendar como integracao opcional e por ultimo
- mapear eventos e tarefas internas para a conta conectada
- decidir nivel de sincronizacao, conflitos, recorrencia e exclusao
- garantir um modelo temporal canonico interno com `UTC` + `ISO-8601`

O que nao entra:
- Microsoft Calendar
- Outlook Calendar

## 3. O que fica fora de escopo

- Microsoft
- Outlook
- SMTP generico

## 4. Decisao importante sobre convite por e-mail

- `convite por e-mail` significa apenas convite de plano
- o envio usa Gmail conectado
- quando essa etapa entrar, o envio sai pelo fluxo autenticado do proprio usuario
- ate la, o fluxo continua baseado em link/token, notificacao interna e aceitacao/recusa

## 5. O que o produto ainda precisa decidir

- se `homePage` + `openLastCtx` continuam do jeito atual ou se a entrada no app sera simplificada
- como a experiencia de settings vai tratar a opcao antiga de barra lateral recolhida por padrao
- quando vale conectar notificacoes de settings a eventos reais do produto
- se auditoria deve vir antes de realtime
- como o app vai evoluir para multi-workspace sem aumentar a complexidade da entrada
- como o calendario externo vai converter entre horario canonico e formatos de exibicao sem quebrar a preferencia do usuario

## 6. Leitura pratica

- convites de plano ja estao prontos
- arquivos com drag-and-drop ja estao prontos
- OAuth com Google ja esta pronto
- a proxima entrega util e Gmail nas Configuracoes, porque e isso que viabiliza convite por e-mail
- depois disso vem a Inbox da sidebar
- Google Calendar fica para o fim
