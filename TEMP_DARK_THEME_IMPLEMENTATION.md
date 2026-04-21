# Implementação do “Tema Escuro” (Web) — Handoff/Review

Este arquivo é **temporário** e serve como handoff para revisão por um segundo agente.

## Objetivo e escopo

- Implementar preferência de tema: **`system | light | dark`**.
- Aplicar o tema **apenas no app interno** (Workspace / Kanban / Canvas / Calendar / Files / Settings + bootstrap do app).
- **Não** refatorar Landing/Info/Auth (fora do “app interno”) para consumir tokens, evitando “vazar” o tema para essas rotas.

---

## Visão geral da solução

### 1) Modelo de tema + persistência (anti-flash)

**Fonte de verdade (frontend):**

- `generalPreferences.theme` (em `PreferencesProvider`).
- Valor sempre normalizado para `system|light|dark`.

**Persistência local (instantânea / anti-flash):**

- Chave por usuário: `plan-things:theme:v1:<userId>` (fallback: `plan-things:theme:v1:anonymous`)
  - Implementado em `apps/web/src/features/preferences/context/PreferencesContext.jsx`
  - Helpers:
    - `normalizeThemePreference(value)`
    - `readStoredTheme(userId)`
    - `buildThemeStorageKey(userId)`
    - `writeStoredTheme(userId, theme)`

**Regras implementadas (importante para “sem flash”):**

- No `useState` inicial de `generalPreferences`, o tema é lido **do localStorage** antes de hidratar do backend:
  - Primeiro tenta `readStoredTheme(currentUser?.id)`
  - Depois tenta `readStoredTheme(null)` (anonymous)
  - Se não existir, cai em `DEFAULT_GENERAL_PREFERENCES.theme` (`system`)
- Ao hidratar snapshot do backend (`GET /api/settings`):
  - `theme` vindo do backend entra em `normalizeGeneralPreferences(...)`
  - e o resultado é sincronizado no localStorage via `writeStoredTheme(currentUser?.id, nextGeneral.theme)`
- Ao usuário alterar no Settings:
  - `updateGeneral({ theme: ... })` atualiza o estado **imediatamente**
  - grava `localStorage` **sempre**
  - e quando `backendEnabled`, faz `PATCH /api/settings/preferences` incluindo `theme`

**Notas de escopo backendEnabled:**

- `backendEnabled = isAuthenticated && !isDemoSession`
  - Em demo / não autenticado, persistência fica **somente local** (sem PATCH).

### 2) Aplicação do tema (sem afetar Landing/Info/Auth)

Foi criado um “scope” explícito de tema:

- `apps/web/src/features/preferences/components/AppThemeScope/AppThemeScope.jsx`
  - Resolve `system` usando `matchMedia('(prefers-color-scheme: dark)')`.
  - Só escuta mudanças do sistema quando `themePreference === 'system'`.
  - Aplica os atributos no **container**, não no `html`:
    - `data-theme="light|dark"` (tema efetivo)
    - `data-theme-preference="system|light|dark"` (preferência)
    - `style={{ colorScheme: effectiveTheme }}` (ajuda controles nativos)

O “anti-leak” para rotas fora do app foi implementado em:

- `apps/web/src/App.jsx`
  - `isInternalAppPath(pathname)` decide quando habilitar o scope.
  - `AppBootstrapScreen` é envolto em `<AppThemeScope enabled={enableTheme}>`
    - e o bootstrap usa tokens semânticos (sem hex hardcoded).

Observação: o `AppThemeScope` **não** foi aplicado globalmente em `App()` (rotas). Ele é aplicado no bootstrap + cada tela interna refatorada usa `var(--app-bg)`/`var(--text-1)` etc, evitando mexer na Landing/Info.

### 3) UI de Settings (Sistema / Claro / Escuro)

- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
  - Na seção “Aparência”, o bloco “Tema visual” virou **3 cards**:
    - Sistema / Claro / Escuro
  - Clique chama `handleGeneralFieldChange('theme', opt.value)` → `updateGeneral({ theme })`.
  - Prévia visual usa `data-theme` no próprio preview, para mostrar claro/escuro mesmo no tema atual.

---

## Design System / Tokens

### Tokens semânticos (themeáveis) em `globals.css`

- Arquivo: `apps/web/src/shared/styles/globals.css`
- Mantém `--color-*` como **primitivos**.
- Introduz tokens semânticos (consumo pelas telas internas) e override em `[data-theme='dark']`.

**Tokens principais (exemplos):**

- Base / superfícies:
  - `--app-bg`
  - `--surface-1`, `--surface-2`, `--surface-3`
- Texto:
  - `--text-1`, `--text-2`, `--text-3`
  - `--text-inverse`, `--text-on-accent`
- Bordas e interação:
  - `--border-1`, `--border-2`
  - `--hover`, `--active`, `--focus-ring`
- Overlays:
  - `--popover-bg`, `--menu-bg`, `--frosted-bg`, `--overlay-bg`
- Status:
  - `--danger-text`, `--danger-bg`, `--danger-border`
  - `--warning-text`, `--warning-bg`, `--warning-border`
- Tints específicos:
  - `--filetype-*-bg/fg` (Files)
  - `--canvas-card-*-bg/border/accent` (Canvas)

**Tema escuro (decisão implementada):**

- `--app-bg: #000000` (preto puro)
- `--surface-1: #0d0d0d`, `--surface-2: #121212`, `--surface-3: #1a1a1a`
- `--text-1: #f4f4f4`, `--text-2: #d0d0d0`, `--text-3: #a0a0a0`
- Bordas:
  - `--border-1: #222222`, `--border-2: #2a2a2a`
- Interação:
  - `--hover: rgba(255,255,255,.06)`
  - `--active: rgba(255,255,255,.10)`
- Sombras: reequilibradas para reduzir dependência de sombras “pretas” e adicionar “glow”/contorno sutil.

---

## Refatorações por área (frontend)

> Diretriz aplicada: substituir `#fff/#000/rgba(...)` e neutros hardcoded por tokens semânticos (`--app-bg`, `--surface-*`, `--text-*`, `--border-*`, `--hover`, `--active`, `--danger-*`).

Arquivos alterados (lista do diff atual):

- Bootstrap / roteamento: `apps/web/src/App.jsx`
- Preferences:
  - `apps/web/src/features/preferences/context/PreferencesContext.jsx`
  - `apps/web/src/features/preferences/components/AppThemeScope/AppThemeScope.jsx`
- Settings:
  - `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
  - `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.module.css`
- Workspace:
  - `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx`
  - `apps/web/src/features/workspace/pages/Workspace/Workspace.module.css`
- Kanban:
  - `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
  - `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css`
- Canvas:
  - `apps/web/src/features/canvas/pages/CanvasPage/CanvasPage.jsx`
  - `apps/web/src/features/canvas/pages/CanvasPage/CanvasPage.module.css`
  - `apps/web/src/features/canvas/components/ConnectionsSVG/ConnectionsSVG.jsx`
- Calendar:
  - `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx`
  - `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.module.css`
- Files:
  - `apps/web/src/features/files/pages/FilesPage/FilesPage.jsx`
  - `apps/web/src/features/files/pages/FilesPage/FilesPage.module.css`
  - `apps/web/src/features/files/data/libraryRepository.js`
- Shared UI (shell/menus):
  - `apps/web/src/shared/components/PlanSidebarSection/PlanSidebarSection.module.css`
  - `apps/web/src/shared/components/PlanPageHeader/PlanPageHeader.module.css`
  - `apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.module.css`
  - `apps/web/src/shared/components/MemberAvatarStack/MemberAvatarStack.module.css`

### Mudança relevante em Files (tints)

- `apps/web/src/features/files/data/libraryRepository.js`
  - `FILE_TYPES.*` mudou de cores hardcoded para:
    - `var(--filetype-*-fg)`
    - `var(--filetype-*-bg)`
- Os valores dos tokens (incluindo overrides no dark) estão em `globals.css`.

### Mudança relevante em Canvas (conexões)

- `apps/web/src/features/canvas/components/ConnectionsSVG/ConnectionsSVG.jsx`
  - Setas/linhas passaram a usar:
    - `stroke="var(--border-2)"` / `fill="var(--text-3)"`
    - e no modo delete `var(--danger-text)`

---

## Backend (persistência e API)

### Estado atual (schema real vs plano original)

O plano original citava:

- coluna `theme` em `user_settings`
- migration `V6__user_settings_theme.sql`

Porém, **o banco de dev local (`plan_things_db`) já estava com V6 aplicada** como:

- script em `flyway_schema_history`: `V6__settings_theme_mode.sql`
- coluna existente: `theme_mode` (NVARCHAR(10), NOT NULL, default `'system'`)

Isso levou a uma inconsistência: a migration V6 aplicada no DB **não existia no repo**, e ao adicionar uma V6 “nova” com outro conteúdo/nome, o Flyway falhava na validação.

### O que foi implementado no código (compatível com `theme_mode`)

- Controller: `services/api/src/main/java/com/planthings/api/settings/SettingsController.java`
  - `PATCH /api/settings/preferences` aceita `theme` (string) opcional no body.
- Service: `services/api/src/main/java/com/planthings/api/settings/SettingsService.java`
  - `SettingsSnapshot.preferences` inclui `theme`.
  - `updatePreferences(...)` chama:
    - `resolveTheme(theme, userSettings.getTheme())`
    - valida com `requireTheme(...)` (`system|light|dark`)
    - erro padrão: `BadRequestException("TEMA_INVALIDO", "...")`
  - Canonicalização: `trim().toLowerCase()` (somente para `theme`; locale/timezone têm validações próprias).
- Entity: `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java`
  - Campo `theme` mapeado para a coluna **`theme_mode`**:
    - `@Column(name = "theme_mode", nullable = false, length = 10)`

### Migration adicionada ao repo (restauração do “V6”)

- `services/api/src/main/resources/db/migration/V6__settings_theme_mode.sql`
  - Conteúdo atual adiciona a coluna `theme_mode`.

**Importante (Flyway/ambiente já migrado):**

- Se alguém já tem um DB com a V6 aplicada (checksum antigo), e o arquivo no repo tiver conteúdo/encoding/line-endings diferentes, o Flyway pode acusar:
  - `Migration checksum mismatch for migration version 6`
- Nesse cenário, existem 2 caminhos:
  1) Recuperar o **arquivo original exato** (mesmo checksum) usado quando o DB foi migrado e commitá-lo.
  2) Rodar `flyway repair` para atualizar o checksum no `flyway_schema_history` (apenas se o conteúdo do arquivo continua semanticamente equivalente ao que foi aplicado).

---

## Testes adicionados/atualizados

### Frontend (Vitest)

- `apps/web/src/features/preferences/components/AppThemeScope/AppThemeScope.test.jsx`
  - Garante:
    - `dark` aplica `data-theme="dark"`
    - `system` respeita `matchMedia` e reage a mudanças
- `apps/web/src/features/preferences/context/PreferencesThemePersistence.test.jsx`
  - Garante:
    - Ao setar tema, grava `localStorage` (`plan-things:theme:v1:<userId>`)
    - Com backend habilitado, chama `PATCH /api/settings/preferences` com `theme`

### Backend (JUnit / MockMvc)

- `services/api/src/test/java/com/planthings/api/SettingsApiIntegrationTest.java`
  - Snapshot inclui `preferences.theme` default `'system'`
  - PATCH atualiza `theme` para `'dark'`
  - Tema inválido → 400 com `TEMA_INVALIDO`

---

## Problemas encontrados (e como foram tratados)

### 1) Flyway: “checksum mismatch” na V6

Sintoma ao rodar `mvn spring-boot:run` (dev local):

- `Migration checksum mismatch for migration version 6`
  - DB já tinha V6 aplicada com checksum diferente.

Causa raiz:

- O DB já tinha uma V6 aplicada cujo arquivo não existia/estava diferente no repo.

Mitigação usada no ambiente local:

- Foi necessário executar um “repair” (equivalente) para atualizar o checksum no `flyway_schema_history`.
  - Observação: isso é **estado local de DB** e não “corrige” outros ambientes automaticamente.

Recomendação para o time:

- Padronizar: **nunca alterar migrations já aplicadas**; se a V6 original se perdeu, recuperar de outra máquina/branch e commitar exatamente.

### 2) Flyway: “Found more than one migration with version 6”

Durante os testes, ocorreu quando havia uma migration antiga ainda presente no `target/classes/db/migration`.

Mitigação:

- Rodar `mvn clean` antes do `spring-boot:run` para limpar `target/`.

### 3) Porta 8080 em uso

Quando o `spring-boot:run` foi interrompido (timeout), o processo Java ficou segurando 8080.

Mitigação:

- Finalizar o processo que está ouvindo em 8080 antes de reiniciar.

### 4) Auditoria por `rg` falhou neste ambiente

O plano previa auditoria por ripgrep (`rg`), mas neste ambiente o `rg.exe` falhou com **“Acesso negado”**.

Alternativas recomendadas:

- `git grep -n "<regex>"`
- PowerShell:
  - `Get-ChildItem -Recurse -Include *.css,*.jsx | Select-String -Pattern "<regex>"`

### 5) Arquivos locais/untracked

- `.mvn-home/` apareceu como untracked (provavelmente artefato local).
  - Recomenda-se adicionar ao `.gitignore` se for recorrente.

---

## Checklist de revisão (polimento)

### Visual / UX (manual smoke)

Em **light** e **dark**:

- Workspace / Kanban / Canvas / Calendar / Files / Settings:
  - fundo do app: `#000` no dark (via `--app-bg`)
  - superfícies distinguíveis (`--surface-1/2/3`)
  - textos legíveis (`--text-1/2/3`)
  - bordas suaves e consistentes (`--border-1/2`)
  - hover/active perceptíveis e não “lavados”
  - menus/popovers sem “quadrados brancos” (tokens `--menu-bg`/`--popover-bg`)
  - foco (keyboard): `--focus-ring` consistente e visível
- Estados “danger”:
  - botões delete / áreas destrutivas no dark usando `--danger-*` (sem vermelho neon ou contraste baixo)

### Auditoria de hardcodes de cor (frontend)

Rodar auditoria **restrita ao app interno**:

- Buscar por hex: `#[0-9a-fA-F]{3,8}`
- Buscar por `rgb/rgba/hsl` em CSS modules do app
- Buscar por casos comuns: `#fff`, `#ffffff`, `#000`, `rgba(255,255,255`

Critério:

- Se for cor “semântica” (fundo, superfície, borda, texto, hover), deve virar token.
- Exceções aceitáveis:
  - cores de marca/ilustração deliberadas
  - gradientes intencionais (idealmente ainda baseados em tokens)

### Backend / migrações

- Confirmar com o time qual é a migration V6 “canônica”.
  - Se a V6 original existia com checksum diferente, recuperar e commitar o arquivo original para evitar `flyway repair` manual em cada máquina.
- Validar que a coluna usada em produção/dev é realmente `theme_mode` (e não `theme`) e alinhar documentação.

### Robustez

- Garantir que `theme` inválido recebido do backend não quebra o app:
  - `normalizeThemePreference` já normaliza/faz fallback; revisar se todos os caminhos usam isso.
- Verificar se rotas de Landing/Info continuam intactas:
  - `AppThemeScope` só habilita no bootstrap quando a rota é interna.

---

## Comandos úteis

- Frontend tests:
  - `npm --workspace apps/web run test:run`
- Backend tests:
  - `cd services/api; mvn test`
- Backend run (recomendado sempre com clean enquanto houver mudanças em migrations):
  - `cd services/api; mvn clean spring-boot:run`

