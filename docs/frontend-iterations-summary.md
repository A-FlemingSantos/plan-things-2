# Frontend Iterations Summary

## Context

Este documento resume as iteracoes concluídas no front-end do projeto antes da implementação futura do back-end.

Objetivo desta fase:

- consolidar a arquitetura do front
- reduzir duplicação
- conectar fluxos reais entre telas
- melhorar consistência visual e estrutural
- preparar a base para integração futura com back-end em Java + Spring Boot + Microsoft SQL Server

## Status Atual

Ao final destas iteracoes, o projeto ficou com:

- roteamento SPA centralizado
- shell compartilhado entre telas do produto
- fluxo real de planos entre `Workspace`, `Board` e `Canvas`
- `Files` estabilizado como biblioteca global
- páginas grandes componentizadas
- acessibilidade e responsividade revisadas
- smoke tests automatizados
- contratos de dados e repositórios mockados preparados para integração futura

Validacoes executadas ao longo da fase:

- `npm run build`
- `npm run test:run`

## Iteracoes Concluídas

### Iteracao 1
Centralização do roteamento com `react-router-dom`.

Foi feito:

- substituição do roteamento manual baseado em `window.location`
- criação de configuração compartilhada de rotas
- adoção de navegação SPA nas telas principais
- manutenção de aliases de URLs antigas para compatibilidade

### Iteracao 2
Extração da sidebar compartilhada.

Foi feito:

- criação de hook compartilhado de navegação
- criação de componente reutilizável de sidebar
- migração de `Workspace`, `Kanban`, `Canvas` e `Files` para a sidebar compartilhada

### Iteracao 3
Conexão real entre `Workspace` e `Board`.

Foi feito:

- criação de contexto global de planos
- adição de rota por `planId` no board
- criação e seleção de planos no estado compartilhado
- board deixando de ser fixo e passando a refletir o plano aberto

### Iteracao 4
Unificação da `FilesPage` em uma única fonte de verdade.

Foi feito:

- substituição dos mocks paralelos por uma árvore única de arquivos
- correção de inconsistências entre favoritar, renomear, excluir e trocar de seção
- navegação por pasta baseada em `id`
- `Trash`, `Starred`, `Recent` e `Shared` derivados da mesma estrutura

### Iteracao 5
Remoção de referências a telas futuras.

Foi feito:

- remoção de `Calendar`, `Inbox` e `Chat` da navegação do produto
- limpeza de mapeamentos e referências órfãs nas telas

### Iteracao 6
Criação de um `AppShell` compartilhado real.

Foi feito:

- extração da estrutura base das telas do produto
- unificação de estado de colapso da sidebar
- criação de `SidebarUserCard`
- redução de duplicação estrutural entre telas principais

### Iteracao 7
Integração do `Canvas` ao fluxo real de planos.

Foi feito:

- rota de canvas por `planId`
- estado de canvas persistido por plano
- navegação coerente entre `Workspace`, `Board` e `Canvas`
- título, breadcrumb e troca de plano refletindo o plano ativo

### Iteracao 8
Unificação do conceito de plano atual.

Foi feito:

- destaque visual do plano atual no `Workspace`
- painel do plano atual com atalhos para board e canvas
- sincronização mais clara entre `Workspace`, `Board` e `Canvas`

### Iteracao 9
Consolidação do store do domínio de planos.

Foi feito:

- ampliação do `PlansContext`
- criação de hook compartilhado para resolução de rota por plano
- centralização da lógica de plano ativo usada por `Board` e `Canvas`

### Iteracao 10
Extração de header compartilhado para páginas de plano.

Foi feito:

- criação de `PlanPageHeader`
- uso compartilhado em `KanbanBoard` e `CanvasPage`
- padronização de breadcrumb, título e meta de topo

### Iteracao 11
Extração de componentes visuais menores compartilhados.

Foi feito:

- criação de `PlanSidebarSection`
- criação de `MemberAvatarStack`
- redução de repetição visual em `Workspace`, `Board` e `Canvas`

### Iteracao 12
Quebra inicial do `KanbanBoard` em hooks.

Foi feito:

- extração da lógica de colunas e cards
- extração da lógica de drag and drop
- redução de acoplamento interno da página

### Iteracao 13
Quebra inicial do `CanvasPage` em hooks.

Foi feito:

- separação entre estado persistido e interações efêmeras
- extração de lógica de pan, zoom, cards e conexões

### Iteracao 14
Componentização visual do `Canvas`.

Foi feito:

- criação de `CanvasCard`
- criação de `ConnectionsSVG`
- criação de `CanvasToolbar`
- criação de `CanvasEmptyHint`

### Iteracao 15
Componentização visual principal do `KanbanBoard`.

Foi feito:

- criação de `KanbanCard`
- criação de `ColMenu`
- criação de `KanbanColumn`

### Iteracao 16
Componentização adicional do `KanbanBoard`.

Foi feito:

- criação de `BoardHeaderActions`
- criação de `AddColumnComposer`
- organização adicional da tela sem alterar o layout

### Iteracao 17
Extração do modal de card do board.

Foi feito:

- criação de `CardModal`
- isolamento do maior bloco restante do `KanbanBoard`

### Iteracao 18
Rodada inicial de acessibilidade.

Foi feito:

- melhoria de semântica em sidebar, headers e seções
- adição de `aria-*`, `type="button"` e `aria-current`
- melhor suporte de teclado para cards e modal

### Iteracao 19
Rodada de responsividade.

Foi feito:

- ajustes em `Workspace`, `Kanban`, `Canvas` e `Files`
- melhoria de comportamento em larguras menores
- refinamento de headers, toolbars, modais, painéis e listas

### Iteracao 20
Adição de testes de smoke do front.

Foi feito:

- configuração de `vitest`
- setup de testes com `jsdom`
- helper de renderização do app real
- testes cobrindo:
  - redirecionamento de rota legada
  - abertura do board
  - abertura do canvas
  - renderização de `Files`
  - criação de novo plano

### Iteracao 21
Preparação da camada de dados para o back-end futuro.

Foi feito:

- criação de contratos compartilhados para planos e arquivos
- criação de utilitário compartilhado de geração de IDs client-side
- criação de repositório mockado para planos
- criação de repositório mockado para biblioteca de arquivos
- normalização de dados no `PlansContext`
- desacoplamento maior entre UI e dados mockados

### Iteracao 22
Polimento final de UX.

Foi feito:

- melhoria da busca e empty state do `Workspace`
- feedback visual ao criar plano
- feedback curto nas ações do header do board
- melhora de toasts e feedbacks em `Files`
- limpeza de timers e pequenos refinamentos de uso

## Arquitetura Resultante

### Domínio de Planos

Abrange:

- `Workspace`
- `Board`
- `Canvas`

Base atual:

- `PlansContext`
- contratos de plano
- repositório mockado de planos

### Biblioteca Global de Arquivos

Abrange:

- `Files`

Base atual:

- repositório mockado da biblioteca
- contrato compartilhado de arquivos
- helpers de navegação e mutação da árvore

### Shared Layer

Abrange:

- rotas
- shell compartilhado
- sidebar
- headers
- componentes reutilizáveis
- contratos
- utilitários

## Preparação Para o Back-end Futuro

O front foi deixado pronto para a próxima fase com:

- fronteiras de dados mais claras
- normalização centralizada
- estado menos acoplado a mocks embutidos nas páginas
- estrutura favorável para substituir snapshots mockados por chamadas REST

Direção futura esperada:

- back-end em Java + Spring Boot
- persistência em Microsoft SQL Server
- troca gradual dos repositórios mockados por clients de API

## Commits de Checkpoint

Durante a fase, foram criados estes checkpoints principais:

- `c800bbd` - `chore: checkpoint frontend polish through iteration 20`
- `c3ce376` - `refactor: prepare frontend data contracts and polish ux flows`

## Observação Final

Esta fase foi concluída com foco em preservar a experiência visual do produto enquanto a base interna era reorganizada e consolidada.

O resultado é um front-end mais previsível, mais testável, mais componentizado e melhor preparado para a futura integração com o back-end.
