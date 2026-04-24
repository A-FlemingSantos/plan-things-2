# Sequencia de Implementacoes

Este documento organiza o que vem depois das etapas ja concluidas no projeto.

Termos usados aqui:
- `Convite por e-mail` = convite de membro do plano enviado pelo Gmail conectado.
- `Gmail` = integracao funcional usada para enviar convites e, depois, ler mensagens ligadas ao plano.
- `Inbox da sidebar` = area do KanbanBoard para mensagens ligadas a tarefas e eventos delegados.
- `Google Calendar` = integracao externa opcional, deixada para o fim.
- `Microsoft` / `Outlook` = fora de escopo.

## Etapas concluindas

### 1. Fechar convites de plano na UI

Escopo:
- listar convites do plano.
- revogar convite direto na interface.
- exibir convites pendentes do usuario em mais de um ponto da aplicacao.
- permitir aceitar e recusar convite pelo fluxo de link/token.
- mostrar o estado do convite no painel do plano.

O que isso fechou:
- o backend ja suportava o ciclo de convite.
- a interface passou a expor criacao, listagem, revogacao, aceitacao e recusa.
- o fluxo ficou usavel no dia a dia, nao apenas disponivel via API.

### 2. Sidebar "Arquivos" no KanbanBoard

Escopo:
- arrastar arquivos listados na sidebar para um cartao.
- anexar o arquivo ao cartao por drag-and-drop.
- mostrar feedback claro de sucesso, falha e permissao.
- manter a experiencia simples para qualquer membro do plano.

O que isso fechou:
- arquivos das secoes `Plano` e `Biblioteca` ja podem ser arrastados para cartoes.
- o backend continua validando permissao e evitando anexos duplicados.
- o comportamento de mover cartoes entre colunas foi preservado.

### 3. OAuth com Google como identidade de login da conta

Escopo:
- usar Google como identidade de login da conta.
- manter esse fluxo separado das integracoes funcionais do app.
- garantir vinculacao posterior da conta ao usuario local.
- manter a sessao interna do Plan Things com `AuthService.SessionResponse` e JWT proprio.
- nao persistir tokens externos.

O que isso fechou:
- o fluxo OAuth/OIDC agora existe para Google.
- o backend suporta criacao de usuario, reutilizacao de identidade e vinculo seguro por e-mail confiavel.
- o frontend inicia OAuth real, trata o callback e conclui o login com a sessao interna.
- o fluxo ficou coberto por testes e validacao manual.
- Microsoft nao sera implementado e saiu do escopo do produto.

## Proximas etapas

### 4. Gmail nas Configuracoes e convite por e-mail do plano

Escopo:
- transformar o card de `Gmail` na pagina de Configuracoes em integracao real.
- persistir a conexao Gmail em vez de usar estado de demo.
- usar essa conexao para enviar convites de membros do plano.
- tratar `convite por e-mail` como o primeiro uso dessa integracao.

Nao entra aqui:
- Outlook.
- Microsoft.
- envio generico de SMTP.

Por que vem agora:
- o login com Google ja esta pronto e serve de base para a conta externa.
- a UI de Settings ja mostra Gmail, mas ainda em modo demo.
- o convite por e-mail depende de uma conexao Gmail real.

### 5. Inbox da sidebar no KanbanBoard

Escopo:
- arrastar um cartao de tarefa ou evento para a sidebar.
- gerar e enviar um e-mail com template dinamico para os membros do cartao.
- exibir e-mails recebidos vinculados a tarefas delegadas.
- separar visualmente mensagens de tarefas e mensagens comuns.

Nao entra aqui:
- fluxo geral de notificacoes por e-mail.
- calendarios externos.

Por que vem depois:
- depende da integracao Gmail ja ativa.
- exige modelagem de conversa, rastreio e permissao mais madura.
- faz mais sentido quando a comunicacao por e-mail ja estiver estabilizada.

### 6. Governanca de colaboracao

Escopo:
- registrar auditoria de acoes importantes.
- rastrear quem convidou, aceitou, recusou, revogou, anexou e descompartilhou.
- preparar um historico claro de atividade do plano.

Por que vem depois:
- os eventos centrais ja estao definidos.
- a governanca passa a acrescentar visibilidade sem baguncar o fluxo principal.

### 7. Refinar arquivos e anexos

Escopo:
- adicionar busca.
- adicionar paginacao.
- adicionar ordenacao.
- melhorar os sinais de origem e contexto em cada acao.

Por que nesta fase:
- a base funcional ja existe.
- agora o ganho e produtividade e escala de uso.

### 8. Limpar settings e preferencia inicial

Escopo:
- simplificar `homePage` + `openLastCtx`.
- tratar a opcao antiga de barra lateral recolhida por padrao como algo a remover ou substituir.
- persistir `density` de forma global.
- tirar ambiguidade da experiencia de entrada no app.

Por que aqui:
- e consolidacao de produto.
- reduz complexidade sem depender de integracoes externas.

### 9. Avancar em integracoes e seguranca

Escopo:
- avatar.
- 2FA.
- sessoes reais.
- exportacao e exclusao de dados.
- multi-workspace.
- consolidacao de integracoes de conta ja existentes.

Por que por ultimo:
- sao itens mais caros e mais dependentes da maturidade da plataforma.
- fazem mais sentido depois do nucleo colaborativo estar redondo.

### 10. Google Calendar, opcional e por ultimo

Escopo:
- adicionar Google Calendar como fonte externa.
- sincronizar tarefas e eventos com a conta conectada.
- resolver mapeamento entre eventos internos e externos.
- usar um modelo temporal canonico interno (`UTC`/`ISO-8601`) e deixar `locale`, `dateFormat`, `timeFormat` e `timeZone` apenas para exibicao.

Nao entra aqui:
- Microsoft Calendar.
- Outlook Calendar.

Por que fica por ultimo:
- e a parte mais pesada e mais sensivel da cadeia de integracoes.
- o produto ja pode entregar muito valor sem isso.
- faz sentido so depois do restante estar maduro.

## Resumo curto

1. Etapa 1 fechada: convites de plano na UI
2. Etapa 2 fechada: sidebar de arquivos com drag-and-drop
3. Etapa 3 fechada: OAuth com Google como identidade de login da conta
4. Gmail nas Configuracoes e convite por e-mail do plano
5. Inbox da sidebar no KanbanBoard
6. Governanca de colaboracao
7. Arquivos e anexos
8. Settings e entrada no app
9. Integracoes e seguranca
10. Google Calendar opcional
