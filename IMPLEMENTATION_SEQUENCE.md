# Sequencia de Implementacoes

As etapas 1, 2 e 3 ja estao fechadas. O que vem depois continua essa ordem: primeiro a integracao Gmail nas Configuracoes, depois o envio de convite por e-mail pelo owner/admin do plano usando essa conexao, e depois a Inbox da sidebar no KanbanBoard como gatilho de e-mail automatico a partir do cartao do KanbanBoard. Microsoft, Outlook e SMTP generico nao entram no produto.

## Etapas concluídas

**1. Convites de plano na UI.** A funcao dessa etapa e abrir e fechar a porta de entrada da colaboracao do plano, deixando o owner/admin enxergar quem foi convidado e deixando o convidado entender o que precisa fazer com o link recebido. Na pratica, o owner/admin lista e revoga convites no painel do plano, e o usuario convidado aceita ou recusa o convite na tela de token. O convite por e-mail ainda nao depende de Gmail real; isso vem na etapa 4.

---

`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

---

**2. Sidebar "Arquivos" no KanbanBoard.** A funcao dessa etapa e transformar arquivos da `Biblioteca` e do `Plano` em anexos reais de cartoes do board, sem quebrar o drag que ja existe para mover cartoes entre colunas. Na pratica, o usuario arrasta um arquivo da sidebar para um cartao, solta para anexar e segue usando o board sem perder o fluxo de mover cards. Qualquer membro pode anexar; nao existe restricao de papel.

---

`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
`apps/web/src/features/workspace/components/KanbanColumn/KanbanColumn.jsx`
`apps/web/src/features/workspace/components/KanbanCard/KanbanCard.jsx`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`
`apps/web/src/features/workspace/components/KanbanCard/KanbanCard.test.jsx`

---

**3. OAuth com Google como login da conta.** A funcao dessa camada e usar Google como identidade da conta, concluir a sessao dentro do proprio Plan Things com `AuthService.SessionResponse` e JWT proprio, e nao persistir tokens externos. Na pratica, o usuario clica no botao Google na tela de autenticacao, passa pelo callback `/oauth/callback` e volta logado com a sessao da aplicacao, sem sair do fluxo do app. Microsoft nao faz parte do roadmap do produto.

---

`apps/web/src/features/auth/pages/Auth/Auth.jsx`
`/oauth/callback`
`AuthContext`

---

## Proximas etapas

**Integracao Gmail nas Configuracoes.** A funcao dessa etapa e ligar a colaboracao do plano a uma conta Gmail autenticada, com falha, retry e estado de conexao bem tratados, porque essa conexao vira a base tecnica das proximas duas etapas de email. Na pratica, o usuario abre a secao `E-mail e captura`, conecta o card `Gmail` e passa a ter uma conta Gmail real vinculada ao perfil do owner/admin do plano. Hoje isso ainda e area de demo/local state; o foco aqui e trocar o mock por conexao persistida e confiavel. Outlook, Microsoft e SMTP generico nao entram.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

---

**Envio de convite por e-mail pelo owner/admin do plano.** A funcao dessa etapa e substituir o convite interno que hoje nasce no modal de convites do `KanbanBoard` (`openInviteModal`/`submitInvite`) e faz `POST /api/plans/{planId}/invites`, guardando apenas convite, token e expiração, por um email real disparado a partir da conta Gmail vinculada ao owner/admin do plano. Na pratica, o owner/admin continua abrindo o modal de convites no `KanbanBoard`, mas agora o envio deixa de ser interno e passa a sair como e-mail real da conta autenticada. O `CardModal` nao participa desse fluxo. Essa etapa depende da integracao Gmail ja existir.

---

`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`services/api/src/main/java/com/planthings/api/plans/PlanService.java`
`services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java`
`services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java`
`apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
`apps/web/src/features/workspace/components/InviteNotifications/InviteNotifications.jsx`

---

**Inbox da sidebar no KanbanBoard.** A funcao dessa experiencia e receber um cartao do KanbanBoard (tarefa ou evento) por drag-and-drop na sidebar, compor automaticamente um e-mail com template a partir das informacoes desse cartao e enviar essa mensagem para todos os membros aos quais o cartao foi atribuido. Na pratica, o usuario arrasta o cartao do KanbanBoard para a Inbox, o sistema monta o email com os dados daquele cartao e dispara o envio para os destinatarios corretos. Essa etapa depende da integracao Gmail ja estar ativa, porque ela e a base de envio autenticado e leitura contextual.

---

`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

---

**Governanca de colaboracao.** A funcao dessa frente e registrar quem convidou, aceitou, recusou e revogou, alem de quem anexou ou descompartilhou arquivos, para que a colaboracao tenha rastreabilidade real e nao apenas um historico disperso de acoes. Na pratica, cada evento importante do plano precisa cair no historico de atividade de forma legivel, com contexto suficiente para entender o que aconteceu depois.

---

`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`services/api/src/main/java/com/planthings/api/files/FileController.java`
`services/api/src/main/java/com/planthings/api/board/BoardService.java`

---

**Refino de arquivos e anexos.** A funcao dessa frente e tornar a biblioteca util no uso diario: busca, paginacao, ordenacao e melhor sinalizacao de origem e contexto, sem mudar o fluxo principal que ja existe. Na pratica, o usuario precisa conseguir encontrar, filtrar e reconhecer arquivos sem depender de rolar listas longas ou abrir cada item.

---

`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
`apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`

---

**Settings e entrada no app.** A funcao aqui e reduzir ambiguidade na entrada do app, simplificar `homePage` + `openLastCtx`, decidir o destino da antiga opcao de barra lateral recolhida por padrao e persistir `density` de forma global. Na pratica, o usuario ajusta preferencia de entrada, layout e comportamento inicial sem ficar preso a opcoes que se sobrepoem.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

---

## Opcional e por ultimo

**Google Calendar.** A funcao dessa integracao e sincronizar tarefas e eventos com uma conta conectada usando `UTC` e `ISO-8601` como base temporal interna, deixando `locale`, `dateFormat`, `timeFormat` e `timeZone` apenas para exibicao. Na pratica, o usuario conecta a conta Google Calendar e o app passa a refletir tarefas e eventos nessa fonte externa sem misturar o formato de tela com o formato de sync. Microsoft Calendar e Outlook Calendar nao entram.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
`apps/web/src/features/calendar/data/calendarRepository.js`

---

## Ordem pratica

Se eu resumir sem transformar isso em lista seca, a sequencia real e: primeiro conectar Gmail nas Configuracoes, depois usar essa base para substituir o convite interno do `KanbanBoard` por envio de e-mail real pelo owner/admin do plano, depois usar a mesma base para a Inbox da sidebar no KanbanBoard e, por fim, deixar Google Calendar como extensao opcional por ultimo. O resto sao etapas de consolidacao do que o usuario ja faz hoje, nao de criar um fluxo novo do zero.
