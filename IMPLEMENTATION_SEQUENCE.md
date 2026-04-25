# Sequencia de Implementacoes

Este arquivo lista a proxima fila de trabalho do projeto. Cada etapa diz onde mexer no repositorio, o que entra, o que nao entra e de qual etapa anterior ela depende.

## Etapas concluindas

### 1. Convites de plano na UI

Onde isso vive no projeto:
- backend de convites em `services/api/src/main/java/com/planthings/api/plans/PlanController.java`
- aceita/recusa por token em `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx`
- painel de membros e convites no `KanbanBoard` em `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

O que esta pronto:
- criar, listar, revogar, aceitar e recusar convites de plano
- remover membro do plano
- mostrar convites no painel do quadro

O que nao entra aqui:
- convite por e-mail ainda nao depende de Gmail real; isso vem na etapa 4

### 2. Sidebar "Arquivos" no KanbanBoard

Onde isso vive no projeto:
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- `apps/web/src/features/workspace/components/KanbanColumn/KanbanColumn.jsx`
- `apps/web/src/features/workspace/components/KanbanCard/KanbanCard.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`
- `apps/web/src/features/workspace/components/KanbanCard/KanbanCard.test.jsx`

O que esta pronto:
- arrastar arquivos das secoes `Plano` e `Biblioteca` para um cartao
- soltar o arquivo no cartao para anexar
- mostrar preview visual do arquivo arrastado
- preservar o drag de mover cartoes entre colunas

O que nao entra aqui:
- restricao por papel para anexar; qualquer membro pode anexar
- remover o fluxo de anexar pelo modal do cartao

### 3. OAuth com Google como login da conta

Onde isso vive no projeto:
- tela de login em `apps/web/src/features/auth/pages/Auth/Auth.jsx`
- rota `/oauth/callback`
- contexto de autenticacao do frontend (`AuthContext` e persistencia local)
- endpoints OAuth/OIDC do backend e troca do completion code pela sessao do Plan Things

O que esta pronto:
- usar Google como identidade de login da conta
- manter a sessao interna do Plan Things com `AuthService.SessionResponse` e JWT proprio
- nao persistir tokens externos
- criar usuario, reutilizar identidade externa existente e vincular conta local quando o e-mail e confiavel
- fechar o login no frontend depois do callback

O que nao entra aqui:
- Microsoft e Outlook nao fazem parte do roadmap do produto

## Proximas etapas

### 4. Gmail nas Configuracoes e convite por e-mail do plano

Onde isso vive no projeto:
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
- funcao `renderIntegrations()`
- `SectionGroup title="E-mail e captura"`
- card `Gmail` dentro dessa secao
- fluxo de convites do plano no backend, que sera o consumidor desse envio

O que entra:
- transformar o card `Gmail` em integracao real persistida
- conectar essa conta Gmail ao envio de convites de plano
- usar a integracao para enviar convite por e-mail com a conta autenticada do usuario
- registrar falha, retry e estado de conexao

O que nao entra:
- Outlook
- Microsoft
- SMTP generico do sistema

Dependencia:
- precisa da etapa 3 pronta, porque o Gmail vai usar a conta autenticada do usuario

### 5. Inbox da sidebar no KanbanBoard

Onde isso vive no projeto:
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- funcao `renderInboxPanel()`
- aside com `id="board-inbox-panel"`

O que entra:
- arrastar um cartao de tarefa ou evento para a sidebar
- gerar e enviar um e-mail com template dinamico para os membros do cartao
- exibir e-mails recebidos ligados a tarefas delegadas
- separar visualmente mensagens de tarefas e mensagens comuns

O que nao entra:
- calendarios externos
- notificacao geral de sistema

Dependencia:
- precisa da etapa 4 pronta, porque a inbox depende da integracao Gmail ja ativa

### 6. Governanca de colaboracao

Onde isso deve viver:
- backend de plan invites, arquivos e eventos de colaboracao
- trilha de auditoria do plano

O que entra:
- registrar quem convidou, aceitou, recusou e revogou
- registrar quem anexou e quem descompartilhou arquivos
- manter historico visivel de atividade do plano

Por que vem depois:
- os eventos centrais ja existem
- a governanca melhora visibilidade sem mudar o fluxo principal

### 7. Refinar arquivos e anexos

Onde isso vive no projeto:
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`, funcao `renderFilesPanel()`
- `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`
- backend de arquivos e anexos

O que entra:
- busca
- paginacao
- ordenacao
- melhor sinalizacao de origem e contexto do arquivo

Por que vem agora:
- a base funcional ja existe
- a proxima melhoria e produtividade, nao estrutura

### 8. Limpar settings e preferencia inicial

Onde isso vive no projeto:
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
- secoes de preferencia, tela inicial, layout e notificacoes

O que entra:
- simplificar `homePage` + `openLastCtx`
- decidir o que fazer com a opcao antiga de barra lateral recolhida por padrao
- persistir `density` globalmente
- tirar ambiguidade da entrada no app

Por que vem depois:
- e consolidacao de produto
- reduz complexidade sem depender de integracao externa

### 9. Avancar em integracoes e seguranca

Onde isso deve viver:
- areas de conta, perfil, sessoes, exportacao e exclusao de dados
- fluxo de autenticacao e seguranca do usuario

O que entra:
- avatar
- 2FA
- sessoes reais
- exportacao e exclusao de dados
- multi-workspace
- consolidacao de integracoes de conta ja existentes

Por que fica por ultimo:
- sao itens mais caros e mais dependentes da maturidade da plataforma
- fazem mais sentido depois do nucleo colaborativo estar redondo

### 10. Google Calendar, opcional e por ultimo

Onde isso vive no projeto:
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
- `SectionGroup title="Calendarios"`
- card `Google Calendar`
- `apps/web/src/features/calendar/data/calendarRepository.js`

O que entra:
- adicionar Google Calendar como fonte externa
- sincronizar tarefas e eventos com a conta conectada
- resolver mapeamento entre eventos internos e externos
- usar `UTC` + `ISO-8601` como modelo temporal canonico interno
- deixar `locale`, `dateFormat`, `timeFormat` e `timeZone` apenas para exibicao

O que nao entra:
- Microsoft Calendar
- Outlook Calendar

Por que fica por ultimo:
- e a parte mais pesada e mais sensivel da cadeia de integracoes
- o produto ja entrega bastante valor sem isso
- faz sentido so depois do restante estar maduro

## Resumo curto

1. Etapa 1 fechada: convites de plano na UI
2. Etapa 2 fechada: sidebar de arquivos com drag-and-drop
3. Etapa 3 fechada: OAuth com Google como login da conta
4. Gmail nas Configuracoes e convite por e-mail do plano
5. Inbox da sidebar no KanbanBoard
6. Governanca de colaboracao
7. Arquivos e anexos
8. Settings e entrada no app
9. Integracoes e seguranca
10. Google Calendar opcional
