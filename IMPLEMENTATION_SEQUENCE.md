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
- a interface agora expoe criacao, listagem, revogacao, aceitacao e recusa
- o fluxo ficou usavel no dia a dia, nao apenas disponivel via API

## Proximas etapas

### 2. Sidebar "Arquivos" no KanbanBoard

- Permitir arrastar arquivos listados na sidebar para um cartao.
- Anexar o arquivo ao cartao por drag-and-drop.
- Dar feedback claro de sucesso, falha e permissao.
- Manter a experiencia simples para qualquer membro do plano.

Por que vem agora:
- a base de arquivos ja existe
- o ganho de produtividade e imediato
- nao existe restricao por papel para anexar em cartoes

### 3. Criar a base real de integracao Gmail/Outlook

- Preparar OAuth e vinculacao de conta.
- Definir consentimento e escopo de envio.
- Resolver como o provider autenticado sera selecionado para cada usuario.
- Deixar claro que o sistema nao age como SMTP generico.

Por que vem antes do convite por e-mail:
- e o alicerce necessario para qualquer envio autenticado
- sem essa camada, a entrega de email ficaria desalinhada com a regra de produto

### 4. Implementar convite por e-mail

- Disparar o convite por meio da integracao real.
- Tratar falha, retry e feedback de envio.
- Amarrar o email ao estado do convite e ao usuario autenticado.

Por que depende da etapa 3:
- o envio so faz sentido quando existir Gmail/Outlook de verdade
- isso evita uma solucao provisoria que precisaria ser refeita depois

### 5. Sidebar "Caixa de entrada" no KanbanBoard

- Permitir arrastar um cartao de tarefa ou evento para a sidebar.
- Gerar e enviar um e-mail com template dinamico para os membros do cartao.
- Exibir e-mails recebidos vinculados a tarefas delegadas.
- Separar visualmente mensagens de tarefas e mensagens comuns.

Por que vem depois:
- depende da base real de email
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
2. Sidebar de arquivos com drag-and-drop
3. Base Gmail/Outlook
4. Convite por e-mail
5. Caixa de entrada no KanbanBoard
6. Governanca de colaboracao
7. Arquivos e anexos
8. Settings e entrada no app
9. Integracoes e seguranca
10. Calendarios externos opcionais
