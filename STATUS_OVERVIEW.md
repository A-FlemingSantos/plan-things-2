# Status Consolidado - Colaboração em Planos e Settings

Este documento substitui os antigos:
- `PLANS_COLLABORATION_ROADMAP.md`
- `SETTINGS_STATUS_OVERVIEW.md`

## Visao geral

O projeto ja tem uma base boa em dois blocos:
- colaboracao em planos, com convites, membros e arquivos/anexos
- settings globais, com preferencias aplicadas em runtime e persistencia do que ja faz sentido hoje

A principal diferenca entre "o que existe" e "o que ainda falta" agora esta mais em fechamento de UX, governanca e integrações futuras do que em fundação tecnica.

## Colaboracao em planos

### O que ja esta implementado

- Convites de plano
  - criar convite
  - listar membros
  - aceitar convite
  - recusar convite
  - remover membro
  - revogar convite no backend
- UI do board
  - modal de convite
  - lista/menu de membros
  - remocao de membro
  - tela dedicada para aceitar convite
- Arquivos e anexos
  - arquivos compartilhados com plano
  - anexar arquivo ao cartao
  - remover anexo
  - descompartilhar arquivo do plano
  - regras de permissao por papel

### O que ainda falta ou merece refinamento

- UI para listar convites do plano e revogar convites direto na interface
- UI melhor para recusar convite e para ver convites pendentes
- Melhorias de UX para arquivos e anexos
  - busca
  - paginação
  - ordenacao
  - indicacao mais clara de origem e permissao
- Auditoria de colaboracao
  - quem convidou
  - quem aceitou
  - quem anexou
  - quem removeu
  - quem descompartilhou
- Notificacoes ligadas a eventos reais de colaboracao
- Realtime/presenca, apenas se isso virar prioridade mais adiante

### Ponto importante sobre e-mail automatico

- Nao deve ser tratado como envio por um sistema de e-mail generico.
- O e-mail automatico so entra quando existir uma camada real de integracao com Gmail/Outlook.
- Quando isso acontecer, o envio sera feito pelo proprio fluxo autenticado do usuario/conector, e nao por um SMTP "do sistema" desconectado dessas contas.

## Settings e preferencias globais

### O que ja esta implementado

- Motor de preferencias globais v1 ativo no frontend
- `homePage` e `openLastCtx` aplicados no fluxo de entrada
- ultimo contexto navegavel persistido por usuario
- `locale`, `timeZone`, `dateFormat` e `timeFormat` aplicados em runtime sem reload
- cobertura funcional em Kanban, Calendar e Arquivos
- settings usando provider global como fonte unica em runtime
- auto-save nas secoes nao ligadas a Conta
- botao explicito de salvar apenas em Conta
- backend de settings com persistencia e validacao endurecida de `locale` e `timeZone`
- `collapsedByDefault` com efeito real na sidebar

### O que ainda esta sem regra comportamental

- `emailNotifs`
- `eventReminders`
- `deadlineAlerts`

### O que ficou para depois

- `dailySummary` e `weeklySummary`
- integracoes reais Google/Outlook com OAuth e sync
- upload de avatar para conta/workspace
- silenciar categorias com persistencia real
- `density` com persistencia/aplicacao global
- simplificacao da navegacao inicial do workspace
- privacidade e seguranca avancadas
  - 2FA
  - sessoes reais
  - exportacao/exclusao de dados
  - billing/storage reais

### Observacoes de produto

- Hoje existe sobreposicao entre `homePage`, `openLastCtx` e "Tela inicial do workspace". A tendencia natural e simplificar isso para um modelo unico, deixando apenas um fallback claro quando o ultimo contexto nao existir.
- O projeto ainda opera com um unico workspace por usuario. Isso reduz a urgencia de regras mais complexas de entrada no workspace ate existir multi-workspace de verdade.
- "Silenciar categorias" e comportamento mais inteligente de notificacoes devem esperar a existencia de eventos reais no backend.
- O backend ainda usa mapeamento textual legado em pt-BR via `BrazilDateTimeMapper`.

## Leitura pratica do que falta

### Prioridade 1

- Fechar o ciclo de convites na interface
- Decidir e implementar a experiencia de convites pendentes
- Preparar o caminho para integracao real com Gmail/Outlook antes de qualquer envio automatico de e-mail

### Prioridade 2

- Melhorar governanca e visibilidade da colaboracao
- Adicionar auditoria/atividade
- Melhorar a UX de arquivos e anexos

### Prioridade 3

- Remover redundancias de settings
- Persistir `density` de forma global
- Avancar em integracoes e sync
- Revisitar o modelo de workspace quando existir multi-workspace

## Resumo curto

- Colaboracao: base ja existe; falta fechar UX, auditoria e integracoes
- Settings: base forte; falta consolidar redundancias e tirar placeholders do caminho
- E-mail automatico: somente depois de Gmail/Outlook real, com envio pelo fluxo autenticado do proprio usuario/conector
