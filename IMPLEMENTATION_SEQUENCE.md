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

### 2. Criar a base real de integracao Gmail/Outlook

- Preparar OAuth e vinculacao de conta.
- Definir consentimento e escopo de envio.
- Resolver como o provider autenticado sera selecionado para cada usuario.
- Deixar claro que o sistema nao age como SMTP generico.

Por que vem agora:
- e o alicerce necessario para qualquer envio de convite por e-mail
- sem essa camada, a entrega de email ficaria desalinhada com a regra de produto

### 3. Implementar convite por e-mail

- Disparar o convite por meio da integracao real.
- Tratar falha, retry e feedback de envio.
- Amarrar o email ao estado do convite e ao usuario autenticado.

Por que depende da etapa 2:
- o envio so faz sentido quando existir Gmail/Outlook de verdade
- isso evita uma solucao provisoria que precisaria ser refeita depois

### 4. Melhorar governanca de colaboracao

- Registrar auditoria de acoes importantes.
- Rastrear quem convidou, aceitou, recusou, revogou, anexou e descompartilhou.
- Preparar um historico claro de atividade do plano.

Por que vem depois:
- os eventos centrais ja estao definidos
- a governanca passa a acrescentar visibilidade sem baguncar o fluxo principal

### 5. Refinar arquivos e anexos

- Adicionar busca.
- Adicionar paginacao.
- Adicionar ordenacao.
- Melhorar os sinais de origem e permissao em cada acao.

Por que nesta fase:
- a base funcional ja existe
- agora o ganho e produtividade e escala de uso

### 6. Limpar settings e preferencia inicial

- Simplificar `homePage` + `openLastCtx`.
- Tratar a opcao antiga de barra lateral recolhida por padrao como algo a remover ou substituir.
- Persistir `density` de forma global.
- Tirar ambiguidade da experiencia de entrada no app.

Por que aqui:
- e consolidacao de produto
- reduz complexidade sem depender de integracoes externas

### 7. Avancar em integracoes e seguranca

- Sync real com providers.
- Avatar.
- 2FA.
- Sessoes reais.
- Exportacao e exclusao de dados.
- Multi-workspace.

Por que por ultimo:
- sao itens mais caros e mais dependentes da maturidade da plataforma
- fazem mais sentido depois do nucleo colaborativo estar redondo

## Resumo curto

1. Etapa 1 fechada: convites de plano na UI
2. Base Gmail/Outlook
3. Convite por e-mail
4. Governanca de colaboracao
5. Arquivos e anexos
6. Settings e entrada no app
7. Integracoes e seguranca
