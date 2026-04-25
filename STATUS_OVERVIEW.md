# Status Overview - Colaboracao e Settings

O estado do projeto hoje e este: convites de plano ja funcionam, a sidebar de arquivos no KanbanBoard ja aceita drag-and-drop, o login com Google ja e a identidade real da conta, a integracao Gmail nas Configuracoes ja existe como conexao real e o convite por e-mail pelo owner/admin ja e enviado via Gmail conectado. A proxima fase nao e uma lista solta de pendencias; ela continua essas bases. Agora vem a Inbox da sidebar no KanbanBoard como gatilho de email automatico a partir do cartao do KanbanBoard, depois as frentes de consolidacao e, por ultimo, integracoes externas opcionais. Microsoft, Outlook e SMTP generico nao entram no produto.

## O que ja existe

**Convites de plano.** A funcao dessa parte e controlar o ingresso de pessoas no plano, dar visibilidade ao gestor e deixar o estado do convite claro para quem recebe o link. Na pratica, o owner/admin lista e revoga convites no quadro, envia novos convites por Gmail conectado e o usuario convidado aceita ou recusa pelo link/token recebido por e-mail. O backend cria o convite somente depois do envio Gmail bem-sucedido, lista, revoga, aceita e recusa convites; o quadro mostra confirmacao de envio e nao expoe mais o token como copia manual.

---

`services/api/src/main/java/com/planthings/api/plans/PlanController.java`
`services/api/src/main/java/com/planthings/api/plans/PlanService.java`
`services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java`
`services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java`
`services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java`
`apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.invites.test.jsx`
`services/api/src/test/java/com/planthings/api/PlanInviteGmailIntegrationTest.java`

---

**Arquivos e anexos.** A funcao dessa area e servir como biblioteca operacional do plano: qualquer membro pode anexar arquivos a um cartao, os arquivos do `Plano` e da `Biblioteca` podem ser arrastados para o card e o preview custom ajuda a entender o que esta sendo movido. Na pratica, o arquivo sai da sidebar e entra no cartao por drag-and-drop, sem romper o movimento normal dos cards.

---

`services/api/src/main/java/com/planthings/api/files/FileController.java`
`services/api/src/main/java/com/planthings/api/board/BoardService.java`
`apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

---

**Settings e preferencias.** A funcao dessa area e organizar a entrada no app, as preferencias basicas do usuario e as conexoes externas aprovadas. Na pratica, o usuario escolhe a pagina inicial, o app lembra o ultimo contexto e o card Gmail na secao `E-mail e captura` conecta uma conta Google real para envio. A conexao Gmail e persistida no backend, exige o mesmo e-mail da conta Plan Things, usa `gmail.send`, guarda refresh token criptografado e mostra status conectado/desconectado/erro. Outlook, Microsoft e SMTP generico ficam fora.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
`services/api/src/main/java/com/planthings/api/settings/SettingsController.java`
`services/api/src/main/java/com/planthings/api/settings/SettingsService.java`
`services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java`
`services/api/src/main/java/com/planthings/api/settings/GmailConnectionRepository.java`
`services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java`
`services/api/src/main/java/com/planthings/api/settings/IntegrationTokenCipher.java`
`services/api/src/main/resources/db/migration/V8__gmail_integrations.sql`
`services/api/src/test/java/com/planthings/api/GmailIntegrationApiIntegrationTest.java`
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

**Inbox da sidebar no KanbanBoard.** A funcao dessa area e transformar a sidebar em um gatilho operacional: quando o usuario arrasta um cartao do KanbanBoard (tarefa ou evento) para la, o sistema monta um email com template baseado nas informacoes desse cartao e envia automaticamente para todos os membros atribuidos a esse cartao. Na pratica, o usuario solta o cartao na Inbox, o app gera a mensagem com os dados daquele trabalho e dispara para os destinatarios certos. Ela agora pode reutilizar a integracao Gmail ativa e o cliente de envio ja criado para convites.

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

Por agora, `convite por e-mail` significa exclusivamente o envio de convite do plano pelo owner/admin usando a conta Gmail conectada. Esse fluxo ja substituiu a copia manual do token no modal do `KanbanBoard`: o backend renova o access token via refresh token criptografado, monta uma mensagem MIME em PT-BR, envia por `users.messages.send` e so persiste o convite pendente quando o Gmail confirma o envio. A aceitacao ou recusa continua acontecendo pelo link publico `/plans/invites/{token}`.

## Calendarios externos

Google Calendar fica como integracao opcional e por ultimo. A funcao dessa frente e sincronizar tarefas e eventos com uma conta conectada usando `UTC` e `ISO-8601` como base temporal interna, deixando `locale`, `dateFormat`, `timeFormat` e `timeZone` apenas para exibicao. Na pratica, o usuario conecta a conta Google Calendar e o app passa a refletir tarefas e eventos nessa fonte externa sem misturar o formato de tela com o formato de sync. Microsoft Calendar e Outlook Calendar nao entram.

---

`apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
`apps/web/src/features/calendar/data/calendarRepository.js`

---

## Leitura pratica

Se eu resumir a situacao sem perder a funcao de cada parte, a proxima entrega util e a Inbox da sidebar no KanbanBoard para disparar email automatico a partir do cartao usando a integracao Gmail ja concluida. Depois entram governanca de colaboracao, refino de arquivos/anexos, ajustes finais de Settings e, por fim, Google Calendar como extensao opcional. O que ja existe hoje precisa ser consolidado e tornado mais visivel, nao reescrito do zero.

## Leitura futura da Inbox Gmail

A Inbox atual da sidebar deve continuar sendo, primeiro, um destino operacional para disparo de email a partir de cards. A leitura real da caixa Gmail e uma implementacao futura separada, porque muda o tipo de permissao Google e adiciona infraestrutura de sincronizacao. Na pratica, quando essa frente entrar, o produto deixa de apenas enviar emails e passa tambem a importar mensagens selecionadas da conta Gmail conectada para dentro do contexto do plano.

O caminho direto para implementar isso e expandir a integracao Gmail ja existente em `Settings`: adicionar um novo consentimento com escopo de leitura minimo (`gmail.readonly` ou `gmail.metadata`, conforme a necessidade real), salvar os escopos concedidos, criar uma tabela de mensagens importadas com `gmailMessageId`, remetente, assunto, snippet, data e vinculo opcional ao plano/card, e expor endpoints para listar, atualizar e marcar mensagens como processadas. Para sincronizacao continua, usar `users.watch` da Gmail API com Google Cloud Pub/Sub, guardar `historyId` por conta conectada e renovar o watch periodicamente; para uma primeira versao mais simples, fazer sync manual por botao usando `messages.list` + `messages.get`, sem Pub/Sub.

Essa frente deve ser tratada como etapa propria depois da Inbox de disparo por Gmail estar estavel. Ela exige revisao da tela de consentimento do Google, porque leitura de Gmail envolve escopos mais sensiveis/restritos que `gmail.send`, e nao deve ser misturada com a entrega de convite por email ou com a Inbox de disparo automatico do KanbanBoard.
