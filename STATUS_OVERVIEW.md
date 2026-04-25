# Status Overview - Colaboracao e Settings

O estado do projeto hoje e este: convites de plano ja funcionam, a sidebar de arquivos no KanbanBoard ja aceita drag-and-drop e o login com Google ja e a identidade real da conta. A proxima fase nao e uma lista solta de pendencias; ela continua essas tres bases. Primeiro vem a integracao Gmail nas Configuracoes, depois o envio de convite por e-mail pelo owner/admin do plano usando essa conexao, depois a Inbox da sidebar no KanbanBoard como gatilho de email automatico a partir do cartao do KanbanBoard, e so depois as frentes de consolidacao. Microsoft, Outlook e SMTP generico nao entram no produto.

## O que ja existe

**Convites de plano.** A funcao dessa parte e controlar o ingresso de pessoas no plano, dar visibilidade ao gestor e deixar o estado do convite claro para quem recebe o link. Na pratica, o owner/admin lista e revoga convites no quadro e o usuario convidado aceita ou recusa pelo link/token. O backend cria, lista, revoga, aceita e recusa convites; o usuario convidado abre o token e responde; e o quadro mostra o que foi enviado.

---

`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

---

**Arquivos e anexos.** A funcao dessa area e servir como biblioteca operacional do plano: qualquer membro pode anexar arquivos a um cartao, os arquivos do `Plano` e da `Biblioteca` podem ser arrastados para o card e o preview custom ajuda a entender o que esta sendo movido. Na pratica, o arquivo sai da sidebar e entra no cartao por drag-and-drop, sem romper o movimento normal dos cards.

---

`services/api/src/main/java/com/planthings/api/files/FileController.java`
`services/api/src/main/java/com/planthings/api/board/BoardService.java`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

---

**Settings e preferencias.** A funcao dessa area e organizar a entrada no app e as preferencias basicas do usuario, nao criar integracao externa. Na pratica, o usuario escolhe a pagina inicial, o app lembra o ultimo contexto e o layout ainda depende de ajustes em `density` e na antiga barra lateral recolhida por padrao, para que a abertura da aplicacao fique previsivel.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`services/api/src/main/java/com/planthings/api/plans/PlanService.java`
`services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java`
`services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java`
`apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
`apps/web/src/features/workspace/components/InviteNotifications/InviteNotifications.jsx`

---

**OAuth e identidade de conta.** A funcao dessa camada e fechar a identidade da conta dentro do proprio Plan Things, usando `AuthService.SessionResponse` e JWT proprio. Na pratica, o usuario clica em Google na tela de login, volta do callback e entra logado com a sessao da aplicacao, sem precisar de uma sessao paralela do provider. Tokens externos nao sao persistidos. Microsoft nao faz parte do roadmap do produto.

---

`apps/web/src/features/auth/pages/Auth/Auth.jsx`
`/oauth/callback`
`AuthContext`

---

## O que ainda falta

**Integracao Gmail nas Configuracoes.** A funcao dessa frente e transformar o Gmail em conexao real e persistida para o owner/admin do plano, porque essa integracao vira a base tecnica das proximas etapas de email. Na pratica, o usuario abre a secao `E-mail e captura`, conecta o card `Gmail` e passa a ter uma conta Gmail real vinculada ao perfil do owner/admin do plano. Hoje isso ainda vive em estado de demo/local state; o objetivo aqui e trocar o mock por conexao confiavel, com falha e retry. Outlook, Microsoft e SMTP generico ficam fora.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

---

**Envio de convite por e-mail pelo owner/admin do plano.** A funcao dessa frente e substituir o convite interno que hoje nasce no modal de convites do `KanbanBoard` (`openInviteModal`/`submitInvite`) e faz `POST /api/plans/{planId}/invites`, guardando apenas convite, token e expiração, por um email real disparado a partir da conta Gmail vinculada ao owner/admin do plano. Na pratica, o owner/admin continua abrindo o modal de convites no `KanbanBoard`, mas agora o envio deixa de ser interno e passa a sair como e-mail real da conta autenticada. O `CardModal` nao participa desse fluxo. Essa etapa depende da integracao Gmail ja existir.

---

`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`services/api/src/main/java/com/planthings/api/plans/PlanService.java`
`services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java`
`services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java`
`apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
`apps/web/src/features/workspace/components/InviteNotifications/InviteNotifications.jsx`

---

**Inbox da sidebar no KanbanBoard.** A funcao dessa area e transformar a sidebar em um gatilho operacional: quando o usuario arrasta um cartao do KanbanBoard (tarefa ou evento) para la, o sistema monta um email com template baseado nas informacoes desse cartao e envia automaticamente para todos os membros atribuidos a esse cartao. Na pratica, o usuario solta o cartao na Inbox, o app gera a mensagem com os dados daquele trabalho e dispara para os destinatarios certos. Ela depende da integracao Gmail ja ativa.

---

`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

---

**Governanca de colaboracao.** A funcao dessa camada e registrar quem convidou, aceitou, recusou e revogou, alem de quem anexou e descompartilhou arquivos, para que a colaboracao tenha rastreabilidade real. Na pratica, cada evento importante do plano precisa aparecer no historico de atividade com contexto suficiente para auditoria.

---

`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`services/api/src/main/java/com/planthings/api/files/FileController.java`
`services/api/src/main/java/com/planthings/api/board/BoardService.java`

---

**Refino de arquivos e anexos.** A funcao dessa frente e dar escala ao uso da biblioteca com busca, paginacao, ordenacao e melhor sinalizacao de origem e contexto. Na pratica, o usuario precisa encontrar, filtrar e reconhecer arquivos sem depender de listas longas ou de abrir cada item.

---

`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
`apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`

---

**Settings e entrada no app.** A funcao aqui e reduzir ambiguidade na entrada do app, simplificar `homePage` + `openLastCtx`, decidir o destino da antiga barra lateral recolhida por padrao e persistir `density` de forma global. Na pratica, o usuario ajusta preferencia de entrada, layout e comportamento inicial sem opcoes que se sobrepoem.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

---

## Fora de escopo

Microsoft, Outlook e SMTP generico nao fazem parte do produto. Eles nao sao o proximo passo e nao devem aparecer como pendencia a ser perseguida.

## Convite por e-mail

Por agora, `convite por e-mail` significa exclusivamente o envio de convite do plano pelo owner/admin usando a conta Gmail conectada. Ate a integracao Gmail existir de verdade, o fluxo continua baseado em link/token, notificacao interna e aceitacao ou recusa. Depois que a integracao existir, esse passo substitui o convite interno do `KanbanBoard` por email real.

## Calendarios externos

Google Calendar fica como integracao opcional e por ultimo. A funcao dessa frente e sincronizar tarefas e eventos com uma conta conectada usando `UTC` e `ISO-8601` como base temporal interna, deixando `locale`, `dateFormat`, `timeFormat` e `timeZone` apenas para exibicao. Na pratica, o usuario conecta a conta Google Calendar e o app passa a refletir tarefas e eventos nessa fonte externa sem misturar o formato de tela com o formato de sync. Microsoft Calendar e Outlook Calendar nao entram.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
`apps/web/src/features/calendar/data/calendarRepository.js`

---

## Leitura pratica

Se eu resumir a situacao sem perder a funcao de cada parte, a proxima entrega util e primeiro a integracao Gmail nas Configuracoes. Depois vem o envio de convite por e-mail pelo owner/admin do plano usando essa integracao, depois a Inbox da sidebar no KanbanBoard para disparar email automatico a partir do cartao do KanbanBoard e, por fim, Google Calendar como extensao opcional. O que ja existe hoje precisa ser consolidado e tornado mais visivel, nao reescrito do zero.

## Leitura futura da Inbox Gmail

A Inbox atual da sidebar deve continuar sendo, primeiro, um destino operacional para disparo de email a partir de cards. A leitura real da caixa Gmail e uma implementacao futura separada, porque muda o tipo de permissao Google e adiciona infraestrutura de sincronizacao. Na pratica, quando essa frente entrar, o produto deixa de apenas enviar emails e passa tambem a importar mensagens selecionadas da conta Gmail conectada para dentro do contexto do plano.

O caminho direto para implementar isso e expandir a integracao Gmail ja existente em `Settings`: adicionar um novo consentimento com escopo de leitura minimo (`gmail.readonly` ou `gmail.metadata`, conforme a necessidade real), salvar os escopos concedidos, criar uma tabela de mensagens importadas com `gmailMessageId`, remetente, assunto, snippet, data e vinculo opcional ao plano/card, e expor endpoints para listar, atualizar e marcar mensagens como processadas. Para sincronizacao continua, usar `users.watch` da Gmail API com Google Cloud Pub/Sub, guardar `historyId` por conta conectada e renovar o watch periodicamente; para uma primeira versao mais simples, fazer sync manual por botao usando `messages.list` + `messages.get`, sem Pub/Sub.

Essa frente deve ser tratada como etapa propria depois do envio por Gmail estar estavel. Ela exige revisao da tela de consentimento do Google, porque leitura de Gmail envolve escopos mais sensiveis/restritos que `gmail.send`, e nao deve ser misturada com a entrega de convite por email ou com a Inbox de disparo automatico do KanbanBoard.
