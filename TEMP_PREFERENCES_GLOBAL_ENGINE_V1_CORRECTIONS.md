# Handoff Temporario - Preferences Global Engine v1 (Versao Final Atualizada)

Data: 2026-04-19
Workspace: `C:\Users\Arthur Fleming\plan-things-2`
Arquivo: `TEMP_PREFERENCES_GLOBAL_ENGINE_V1_CORRECTIONS.md`

## 1) Estado geral

As inconsistencias reportadas em todas as rodadas de review foram tratadas.

Validacao atual:

- Frontend: `npm run test:run` -> 41/41 testes passando.
- Frontend: `npm run build` -> build concluido com sucesso.

## 2) Correcoes consolidadas

### 2.1 Timezone e serializacao temporal

1. Removido hardcode de offset `-03:00` na serializacao.
2. Calendar e board agora serializam com offset derivado de `timeZone` (incluindo DST quando aplicavel).
3. Parsing de data reforcado para `yyyy-MM-dd`, `dd/MM/yyyy` e `MM/dd/yyyy`.

Arquivos:

- `apps/web/src/shared/contracts/backendAdapters.js`
- `apps/web/src/features/calendar/hooks/useCalendarEvents.js`
- `apps/web/src/features/workspace/hooks/useBoardColumns.js`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

### 2.2 UI de tempo e dia civil

1. Horarios de parede no Calendar/Kanban passaram a usar formatter de relogio sem conversao indevida (`formatClockTime`).
2. Calendar principal foi alinhado para semantica civil consistente (grade, selecao, "Hoje", range e keys de dia).
3. Labels de weekday do Calendar foram estabilizados para nao deslocar conforme timezone do navegador.
4. Planner do Kanban agora calcula `todayKey` no timezone preferido, nao no timezone local do browser.

Arquivos:

- `apps/web/src/features/preferences/context/PreferencesContext.jsx`
- `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

### 2.3 Simetria de leitura/escrita no board

1. Reidratacao de cards passou a receber `timeZone`, `dateFormat` e `locale`.
2. `mapBoardCard`, `mapBoardViewToColumns` e `mergeBoardIntoPlan` agora propagam opcoes de preferencia.
3. `PlansContext` passou a fornecer `boardMappingOptions` com base em `generalPreferences`.

Arquivos:

- `apps/web/src/shared/contracts/backendAdapters.js`
- `apps/web/src/features/workspace/context/PlansContext.jsx`

### 2.4 Isolamento e restauracao local

1. Rota inicial deixou de herdar preferencia local de usuario anterior.
2. Erros obsoletos de autosave nao sobrescrevem mais o estado final.
3. Chave de sidebar e por usuario (`plan-things:sidebar-collapsed:v1:<userId|anonymous>`).
4. `restoreLocalDefaults` remove override da sidebar.
5. Sidebar agora so persiste override quando ha toggle manual do usuario.
6. `restoreLocalDefaults` agora ressincroniza imediatamente a instancia ativa do shell (via sinal de restore no contexto), mesmo quando `collapsedByDefault` nao muda.

Arquivos:

- `apps/web/src/features/preferences/context/PreferencesContext.jsx`
- `apps/web/src/shared/components/ProductAppShell/ProductAppShell.jsx`

## 3) Testes adicionados/ajustados

Arquivos:

- `apps/web/src/shared/contracts/backendAdapters.test.js`
- `apps/web/src/features/preferences/context/PreferencesContext.test.jsx`

Cobertura relevante:

1. Mapeamento de eventos por timezone preferido.
2. Serializacao calendar/board sem offset fixo.
3. Roundtrip de board com preferencias aplicadas.
4. Formatter de horario civil (`formatClockTimeWithPreferences`).

## 4) Arquivos diretamente tocados nas rodadas de correcoes

- `apps/web/src/features/preferences/context/PreferencesContext.jsx`
- `apps/web/src/features/preferences/context/PreferencesContext.test.jsx`
- `apps/web/src/shared/components/ProductAppShell/ProductAppShell.jsx`
- `apps/web/src/shared/contracts/backendAdapters.js`
- `apps/web/src/shared/contracts/backendAdapters.test.js`
- `apps/web/src/features/calendar/hooks/useCalendarEvents.js`
- `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx`
- `apps/web/src/features/workspace/context/PlansContext.jsx`
- `apps/web/src/features/workspace/hooks/useBoardColumns.js`
- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`

## 5) Fora de escopo (mantido)

1. Execucao real de notificacoes (scheduler/envio).
2. Traducao textual completa da UI por locale.
3. `dailySummary` e `weeklySummary`.
4. Integracoes OAuth reais e recursos avancados (billing/storage/seguranca).

---

Documento temporario consolidado apos a ultima rodada de findings.
