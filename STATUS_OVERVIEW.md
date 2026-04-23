# Status Overview - Collaboracao e Settings

Este arquivo resume o estado atual do projeto com foco no que ja existe, no que ainda falta e no que deve ficar para depois.

## 1. O que ja esta pronto

### Colaboracao em planos

- Convites de plano funcionam no backend e na UI.
- Um `OWNER` ou `ADMIN` pode convidar, listar membros e remover membros.
- O convidado pode aceitar ou recusar o convite.
- Existe tela dedicada para aceitar convite.
- O board mostra membros do plano quando o backend devolve esses dados.

### Arquivos e anexos

- Arquivos do plano podem ser listados, baixados, compartilhados e descompartilhados.
- Cartoes aceitam anexos de arquivo.
- Anexos podem ser removidos.
- O backend ja respeita regras de permissao por papel do plano.

### Settings e preferencias

- `homePage` e `openLastCtx` ja funcionam no fluxo de entrada.
- O ultimo contexto valido do usuario e persistido.
- `locale`, `timeZone`, `dateFormat` e `timeFormat` ja sao aplicados em runtime.
- Preferencias globais ja impactam Kanban, Calendar e Arquivos.
- O backend de settings ja persiste e valida `locale` e `timeZone`.
- `collapsedByDefault` ja tem efeito real na sidebar.

## 2. O que ainda falta

### Convites

- Falta UI para listar convites do plano.
- Falta UI para revogar convite diretamente na interface.
- Falta uma experiencia mais clara para convites pendentes do usuario.
- Falta deixar a recusa de convite mais visivel e fluida na UI.

### Arquivos e anexos

- Falta busca.
- Falta paginação.
- Falta ordenacao.
- Falta indicar melhor a origem do arquivo e a permissao de cada acao.

### Colaboracao futura

- Falta auditoria de eventos importantes:
  - quem convidou
  - quem aceitou
  - quem anexou
  - quem removeu
  - quem descompartilhou
- Falta notificacoes baseadas em eventos reais de colaboracao.
- Realtime/presenca ainda deve ficar para uma fase posterior.

### Settings

- `emailNotifs`, `eventReminders` e `deadlineAlerts` existem, mas ainda nao dirigem comportamento real.
- `dailySummary` e `weeklySummary` continuam fora do escopo pratico.
- `density` ainda nao esta persistida/aplicada globalmente.
- A navegacao inicial do workspace ainda tem redundancias.

## 3. Decisao importante sobre convite por e-mail

- Por agora, "convite por e-mail" significa exclusivamente o envio de convites de plano.
- Nao tratar isso como um sistema separado de SMTP.
- O envio de convite por e-mail so deve entrar quando existir integracao real com Gmail/Outlook.
- Quando isso acontecer, o envio deve ocorrer pelo fluxo autenticado do proprio usuario/conector.
- Sem essa camada, o roadmap de convites deve parar em link/token e UX de aceite/recusa.

## 4. O que o produto ainda precisa decidir

- Se o fluxo inicial vai continuar com `homePage` + `openLastCtx` ou se isso sera simplificado.
- Como o workspace unico sera tratado quando existir multi-workspace.
- Quando a equipe vai querer evoluir notificacoes para regras reais e nao apenas toggles.
- Se a colaboracao vai ganhar auditoria antes de qualquer camada de realtime.

## 5. Leitura pratica

- A fundacao de colaboracao ja existe.
- O valor agora esta em fechar o fluxo que o usuario enxerga e usa.
- Settings precisa de consolidacao, nao de mais campos soltos.
- Integracoes e automacoes devem vir depois da base de Gmail/Outlook.
