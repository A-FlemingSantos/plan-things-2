# Status Overview - Colaboracao e Settings

Este arquivo resume o estado atual da base depois das etapas 1 e 2.

## 1. O que ja esta pronto

### Convites de plano

- O backend cria, lista, revoga, aceita e recusa convites de plano.
- O gestor do plano pode ver os convites enviados e remover convites pendentes.
- O usuario convidado pode abrir o convite por token e aceitar ou recusar.
- Existe uma area global de notificacoes de convite em `Workspace`, `Board`, `Calendar` e `Files`.
- O painel de membros do quadro agora tem uma aba de convites com os convites enviados do plano.

### Arquivos e anexos

- Arquivos do plano podem ser listados, compartilhados, descompartilhados e baixados.
- Cartoes aceitam anexos.
- Qualquer membro do plano pode anexar arquivos a um cartao.
- Nao existe restricao de papel para o ato de anexar.
- A sidebar "Arquivos" do KanbanBoard aceita drag-and-drop de arquivos das secoes `Plano` e `Biblioteca`.
- O frontend separa o drag de arquivos do drag de movimentacao de cartoes.
- O frontend tambem controla um drag preview custom para o arquivo arrastado.
- O backend continua validando permissao, compartilhamento automatico da Biblioteca e anexos duplicados.
- Anexos podem ser removidos.
- O backend ainda aplica regras de permissao para compartilhar, descompartilhar e baixar arquivos.

### Settings e preferencias

- `locale`, `timeZone`, `dateFormat`, `timeFormat` e `theme` ja sao persistidos e validados.
- `homePage` e `openLastCtx` ja interferem na rota inicial do usuario.
- O app lembra o ultimo contexto valido e usa isso na entrada.
- `emailNotifs`, `eventReminders` e `deadlineAlerts` ja sao salvos no backend.

### Integrações de conta

- O login OAuth com Google e Microsoft ja existe na pagina de autenticacao.
- A pagina de Configuracoes ja mostra cards separados para `Gmail`, `Outlook Mail`, `Google Calendar` e `Outlook Calendar`.
- Essa camada de UI ainda e demo/local state, mas a estrutura de produtos ja esta no lugar.

## 2. O que ainda falta

### Integracoes Gmail/Outlook nas Configuracoes

- Falta transformar os cards de `Gmail` e `Outlook Mail` em integracoes reais persistidas.
- Falta usar a conta autenticada para envio e leitura contextual.
- Falta tratar retry, falha e feedback de envio nesse fluxo.
- "Convite por e-mail" e o primeiro uso dessa base, nao uma camada separada.

### Caixa de entrada no KanbanBoard

- Falta a sidebar de caixa de entrada para tarefas e eventos.
- Falta gerar e enviar email com template dinamico a partir de um cartao arrastado.
- Falta exibir e-mails recebidos vinculados a tarefas delegadas.

### Governanca de colaboracao

- Falta auditoria de eventos importantes:
  - quem convidou
  - quem aceitou
  - quem recusou
  - quem revogou
  - quem anexou
  - quem descompartilhou
- Falta um historico de atividade mais visivel.
- Realtime e presenca ainda devem ficar para uma fase posterior.

### Arquivos e anexos

- Falta evoluir a experiencia com feedback mais rico de sucesso, falha e contexto.
- Falta busca.
- Falta paginacao.
- Falta ordenacao.
- Falta sinalizar melhor origem e contexto de cada arquivo.

### Settings

- `density` existe na tela, mas ainda nao esta persistida nem aplicada globalmente.
- A opcao `Barra lateral recolhida por padrão` esta desabilitada e so existe como transicao para substituicao.
- `dailySummary` e `weeklySummary` continuam desabilitados.
- `emailNotifs`, `eventReminders` e `deadlineAlerts` ainda nao dirigem uma camada completa de notificacoes do produto.

### Calendarios externos

- Google Calendar e Microsoft Calendar ficam como integracao opcional e por ultimo.
- Falta mapear eventos e tarefas internas para as contas conectadas.
- Falta decidir o nivel de sincronizacao e como tratar conflitos, recorrencia e exclusao.
- A sincronizacao deve usar tempo canonico interno; preferencias de exibicao nao podem dirigir o payload do sync.

## 3. Decisao importante sobre convite por e-mail

- Por agora, "convite por e-mail" significa exclusivamente convite de plano.
- Nao tratar isso como um sistema generico de SMTP.
- O envio de convite por e-mail so deve entrar quando existir integracao real com Gmail/Outlook.
- Quando isso acontecer, o envio deve sair pelo fluxo autenticado do proprio usuario/conector.
- Ate la, o fluxo continua baseado em link/token, notificacao interna e aceitação/recusa.

## 4. O que o produto ainda precisa decidir

- Se `homePage` + `openLastCtx` devem continuar como estao ou se a entrada no app sera simplificada.
- Como a experiencia de settings vai tratar a opcao antiga de barra lateral recolhida por padrao.
- Quando vale conectar notificacoes de settings a eventos reais do produto.
- Se auditoria deve vir antes de realtime.
- Como o app vai evoluir para multi-workspace sem aumentar a complexidade da entrada.
- Como calendarios externos vao converter entre horario canonico e formatos de exibicao sem quebrar preferencia do usuario.

## 5. Leitura pratica

- A etapa de convites de plano ja foi fechada.
- A etapa de arquivos com drag-and-drop tambem ja foi fechada.
- A proxima entrega mais valiosa e o OAuth de Google/Microsoft seguido das integracoes Gmail/Outlook.
- A caixa de entrada no KanbanBoard depende dessa base de comunicacao.
- Calendarios externos ficam para o fim e nao bloqueiam o restante do produto.
- Settings precisa de consolidacao, nao de mais campos soltos.
