# Status Overview - Colaboracao e Settings

Este arquivo resume o estado atual da base depois da etapa 1.

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
- Anexos podem ser removidos.
- O backend ja aplica as regras de permissao por papel do plano.

### Settings e preferencias

- `locale`, `timeZone`, `dateFormat`, `timeFormat` e `theme` ja sao persistidos e validados.
- `homePage` e `openLastCtx` ja interferem na rota inicial do usuario.
- O app lembra o ultimo contexto valido e usa isso na entrada.
- `emailNotifs`, `eventReminders` e `deadlineAlerts` ja sao salvos no backend.

## 2. O que ainda falta

### Convite por e-mail

- Falta a camada real de integracao com Gmail/Outlook.
- Falta ligar o convite ao envio real feito pelo conector autenticado do usuario.
- Falta tratar retry, falha e feedback de envio nesse fluxo.

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

- Falta busca.
- Falta paginacao.
- Falta ordenacao.
- Falta sinalizar melhor origem, permissao e contexto de cada arquivo.

### Settings

- `density` existe na tela, mas ainda nao esta persistida nem aplicada globalmente.
- A opcao `Barra lateral recolhida por padrão` esta desabilitada e so existe como transicao para substituicao.
- `dailySummary` e `weeklySummary` continuam desabilitados.
- `emailNotifs`, `eventReminders` e `deadlineAlerts` ainda nao dirigem uma camada completa de notificacoes do produto.

## 3. Decisao importante sobre convite por e-mail

- Por agora, "convite por e-mail" significa exclusivamente convite de plano.
- Nao tratar isso como um sistema genérico de SMTP.
- O envio de convite por e-mail so deve entrar quando existir integracao real com Gmail/Outlook.
- Quando isso acontecer, o envio deve sair pelo fluxo autenticado do proprio usuario/conector.
- Ate la, o fluxo continua baseado em link/token, notificacao interna e aceitação/recusa.

## 4. O que o produto ainda precisa decidir

- Se `homePage` + `openLastCtx` devem continuar como estao ou se a entrada no app sera simplificada.
- Como a experiencia de settings vai tratar a opcao antiga de barra lateral recolhida por padrao.
- Quando vale conectar notificacoes de settings a eventos reais do produto.
- Se auditoria deve vir antes de realtime.
- Como o app vai evoluir para multi-workspace sem aumentar a complexidade da entrada.

## 5. Leitura pratica

- A etapa de convites de plano ja foi fechada.
- O proximo passo relevante e a infraestrutura real de Gmail/Outlook para convite por e-mail.
- Settings precisa de consolidacao, nao de mais campos soltos.
- O foco agora e reduzir ambiguidades e preparar a base para integracoes futuras.
