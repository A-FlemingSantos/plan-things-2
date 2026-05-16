# Kanban Handoff

## Context

- Branch: `codex/web-app-features`
- Commit de referência: `7c689d8` (`Stabilize Kanban board local state updates`)
- Objetivo da rodada:
  - reduzir reloads completos do board para mutações locais do Kanban;
  - eliminar o efeito de flash/reajuste global dos cartões;
  - estabilizar o contador do cabeçalho e o ciclo de carregamento do board.

## Arquivos alterados no commit

- `apps/web/src/features/workspace/context/PlansContext.jsx`
- `apps/web/src/features/workspace/context/PlansContext.test.jsx`
- `apps/web/src/features/workspace/hooks/useBoardColumns.js`
- `apps/web/src/features/workspace/hooks/useBoardColumns.test.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
- `apps/web/src/features/workspace/components/KanbanColumn/KanbanColumn.jsx`
- `apps/web/src/features/workspace/components/KanbanCard/KanbanCard.jsx`
- `apps/web/src/shared/contracts/backendAdapters.js`
- `apps/web/src/shared/contracts/planContracts.js`

## O que foi mudado

### 1. Provider de planos / board

- `updatePlanBoard` não passa mais por `normalizePlanRecord()` quando a mudança é só em `boardColumns`.
- `PlansContext` agora usa `plansByIdRef` para manter `getPlanById`, `ensurePlanDetails`, `refreshPlanDetails` e `loadPlanBoard` estáveis sem recriar callbacks a cada update local.
- O ref é sincronizado na própria renderização do provider, não via `useEffect`, para evitar usar snapshot atrasado durante o carregamento inicial do board.

### 2. Merge local no board

- `useBoardColumns` faz merge local para:
  - `updateCard`
  - `addCardComment`
  - `addCard`
  - `deleteCard`
  - `deleteColumn`
  - `createChecklist`
  - `deleteChecklist`
  - `createChecklistItem`
  - `updateChecklistItem`
- A criação de card agora respeita `position` retornado pela API; o card não é mais forçado para o topo.

### 3. Preservação de metadados dos cards

- `normalizeBoardCard` e `normalizeBoardColumn` passaram a preservar propriedades extras já existentes no objeto.
- `mapBoardCard` agora inclui `position`.
- Isso foi feito porque o board estava perdendo `attachments`, `checklists`, `isCompleted` e outros metadados no ciclo de atualização local.

### 4. Tentativas de contenção de rerender

- `KanbanColumn` e `KanbanCard` estão com `memo(...)`.
- `KanbanBoard` estabiliza algumas props com `useCallback` / `useMemo`, como `handleBoardCardClick`, `togglePlannerCardCompleted` e `boardColumnIcons`.
- Essas mudanças continuam no commit e devem ser reavaliadas só se algum sintoma residual apontar que elas estão atrapalhando.

## Sintomas que motivaram essas mudanças

- Ao criar/excluir/editar qualquer card:
  - outros cards de outras listas pareciam atualizar;
  - metadados da UI dos cards sumiam e voltavam em flash;
  - contador do cabeçalho fazia ciclos como `10 -> 11 -> 10 -> 11`;
  - card novo aparecia no topo da lista e depois se reajustava.

## Hipótese principal já corrigida

- O board estava sendo renormalizado inteiro em `PlansContext`, recriando todos os objetos de coluna/card.
- Além disso, `loadPlanBoard` mudava de identidade com updates locais, o que podia disparar reload involuntário via `useEffect` do `KanbanBoard`.

## Verificações comportamentais para o segundo agente

### Fluxo principal do board

1. Abrir um plano backend com board carregado.
2. Confirmar que o skeleton do board desaparece normalmente.
3. Confirmar que o cabeçalho mostra o nome do plano e a contagem correta.

### Criação de card

1. Criar um card em uma lista com vários cards.
2. Verificar se o card nasce direto na posição correta, sem saltar para o topo.
3. Verificar se o contador do cabeçalho incrementa uma vez só, sem `flash`.
4. Verificar se cartões de outras listas não piscam nem perdem ícones/metadados.

### Edição de card

1. Alterar título, descrição, membros, etiqueta e data.
2. Confirmar que o card salvo continua exibindo:
  - membros;
  - etiqueta;
  - data;
  - anexos;
  - checklist;
  - comentários.
3. Confirmar que o contador do cabeçalho não oscila durante a edição.

### Exclusão de card

1. Excluir um card.
2. Verificar se a contagem do cabeçalho decrementa uma vez só.
3. Verificar se outras listas não “reajustam” visualmente.

### Checklist e comentários

1. Criar checklist.
2. Criar item de checklist.
3. Marcar item como concluído.
4. Adicionar comentário.
5. Confirmar ausência de `GET /board` desnecessário nesses fluxos, se estiver usando network inspector.

### Casos ainda sensíveis

1. Anexar arquivo ao card.
2. Remover anexo.
3. Compartilhar/descompartilhar arquivo do plano.

Observação:
- Esses fluxos ainda chamam `loadPlanBoard()` no `KanbanBoard` para ressincronizar attachments. Vale observar se algum flash residual ficou restrito a esse grupo.

## Testes executados nesta rodada

- `npm --workspace apps/web run test:run -- useBoardColumns PlansContext backendAdapters`
- `npm --workspace apps/web run test:run -- PlansContext useBoardColumns KanbanBoard`

Ambos passaram.

## Estado do working tree após o commit

- Este arquivo `KANBAN_HANDOFF_TMP.md` está propositalmente fora do commit.
- `AGENTS.md` e `CLAUDE.md` continuam modificados localmente e não entraram no commit.
