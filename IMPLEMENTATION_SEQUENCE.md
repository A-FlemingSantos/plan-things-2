# Sequencia de Implementacoes

## Etapa 1 concluida

### 1. Fechar convites de plano na UI

- Listar convites do plano.
- Revogar convite direto na interface.
- Exibir convites pendentes do usuario em mais de um ponto da aplicacao.
- Permitir aceitar e recusar convite pelo fluxo de link/token.
- Mostrar o estado do convite no painel do plano.

Por que esta etapa foi fechada:
- o backend ja suportava o ciclo de convite
- a interface passou a expor criacao, listagem, revogacao, aceitacao e recusa
- o fluxo ficou usavel no dia a dia, nao apenas disponivel via API

## Etapa 2 concluida

### 2. Sidebar "Arquivos" no KanbanBoard

- Permitir arrastar arquivos listados na sidebar para um cartao.
- Anexar o arquivo ao cartao por drag-and-drop.
- Dar feedback claro de sucesso, falha e permissao.
- Manter a experiencia simples para qualquer membro do plano.

Por que esta etapa foi fechada:
- arquivos das secoes `Plano` e `Biblioteca` ja podem ser arrastados para cartoes
- o backend continua validando permissao e evitando anexos duplicados
- o comportamento de mover cartoes entre colunas foi preservado

## Proximas etapas

### 3. OAuth com Google/Microsoft

- Consolidar o login com Google e Microsoft como base de conta.
- Manter esse fluxo separado das integracoes funcionais do app.
- Garantir que a autenticacao suporte a vinculacao posterior das contas.

Por que vem antes:
- a autenticacao e a porta de entrada para as integracoes de Gmail/Outlook
- sem isso, nao ha conexao confiavel com as contas externas

### 4. Integracoes Gmail/Outlook nas configuracoes

- Tornar reais os cards de Gmail e Outlook na pagina de Configuracoes.
- Persistir a conexao por provider em vez de usar estado de demo.
- Usar essa camada para habilitar envio autenticado e leitura contextual.
- Tratar "convite por e-mail" como um primeiro uso dessa integracao.

Por que vem depois do OAuth:
- o login com Google/Microsoft ja existe e pode servir de base
- a UI de Settings ja mostra esses providers, mas ainda em modo demo
- essa etapa transforma os cards em integracoes de verdade

### 5. Sidebar "Caixa de entrada" no KanbanBoard

- Permitir arrastar um cartao de tarefa ou evento para a sidebar.
- Gerar e enviar um e-mail com template dinamico para os membros do cartao.
- Exibir e-mails recebidos vinculados a tarefas delegadas.
- Separar visualmente mensagens de tarefas e mensagens comuns.

Por que vem depois:
- depende das integracoes Gmail/Outlook ja ativas
- precisa de modelagem de conversa, rastreio e permissao mais madura
- faz mais sentido quando a comunicacao por email ja estiver estabilizada

### 6. Melhorar governanca de colaboracao

- Registrar auditoria de acoes importantes.
- Rastrear quem convidou, aceitou, recusou, revogou, anexou e descompartilhou.
- Preparar um historico claro de atividade do plano.

Por que vem depois:
- os eventos centrais ja estao definidos
- a governanca passa a acrescentar visibilidade sem baguncar o fluxo principal

### 7. Refinar arquivos e anexos

- Adicionar busca.
- Adicionar paginacao.
- Adicionar ordenacao.
- Melhorar os sinais de origem e contexto em cada acao.

Por que nesta fase:
- a base funcional ja existe
- agora o ganho e produtividade e escala de uso

### 8. Limpar settings e preferencia inicial

- Simplificar `homePage` + `openLastCtx`.
- Tratar a opcao antiga de barra lateral recolhida por padrao como algo a remover ou substituir.
- Persistir `density` de forma global.
- Tirar ambiguidade da experiencia de entrada no app.

Por que aqui:
- e consolidacao de produto
- reduz complexidade sem depender de integracoes externas

### 9. Avancar em integracoes e seguranca

- Avatar.
- 2FA.
- Sessoes reais.
- Exportacao e exclusao de dados.
- Multi-workspace.
- Consolidação de integracoes de conta ja existentes.

Por que por ultimo:
- sao itens mais caros e mais dependentes da maturidade da plataforma
- fazem mais sentido depois do nucleo colaborativo estar redondo

### 10. Calendarios externos, opcional e por ultimo

- Adicionar Google Calendar e Microsoft Calendar como fontes externas.
- Sincronizar tarefas e eventos com as contas conectadas.
- Resolver mapeamento entre eventos internos e externos.
- Usar um modelo temporal canonico interno (`UTC`/`ISO-8601`) e deixar `locale`, `dateFormat`, `timeFormat` e `timeZone` apenas para exibicao.
- Tratar essa integracao como opcional, nao como dependencia do fluxo principal.

Por que fica por ultimo:
- e a parte mais pesada e mais sensivel de toda a cadeia de integracoes
- o produto ja pode entregar muito valor sem isso
- faz sentido so depois do restante estar maduro

## Resumo curto

1. Etapa 1 fechada: convites de plano na UI
2. Etapa 2 fechada: sidebar de arquivos com drag-and-drop
3. OAuth com Google/Microsoft
4. Integracoes Gmail/Outlook nas configuracoes
5. Caixa de entrada no KanbanBoard
6. Governanca de colaboracao
7. Arquivos e anexos
8. Settings e entrada no app
9. Integracoes e seguranca
10. Calendarios externos opcionais
