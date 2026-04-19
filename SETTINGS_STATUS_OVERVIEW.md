# Status Atual — Settings e Preferências Globais

## Estado atual (implementado)
- Motor de Preferências Globais v1 ativo no frontend.
- `homePage` + `openLastCtx` aplicados no fluxo de entrada (`/app` e pós-login), com precedência de último contexto válido.
- Último contexto navegável persistido por usuário.
- `locale`, `timeZone`, `dateFormat`, `timeFormat` aplicados em runtime (sem reload).
- Cobertura funcional aplicada em Kanban, Calendar e Arquivos.
- Settings usando provider global como fonte única em runtime.
- Auto-save nas seções não-Conta; botão explícito de salvar apenas em Conta.
- Backend de settings com persistência e validação endurecida de `locale`/`timeZone`.
- `collapsedByDefault` com efeito real na sidebar.

## Persistem, mas sem regra comportamental (por enquanto)
- `emailNotifs`, `eventReminders`, `deadlineAlerts`.

## Fora do escopo atual / para depois
- `dailySummary` e `weeklySummary` (desabilitados).
- Integrações reais Google/Outlook (OAuth + sync).
- Upload de avatar (conta/workspace).
- Tema escuro.
- “Silenciar categorias” com persistência/regra real.
- `density` com persistência/aplicação global (hoje local da tela).
- “Tela inicial do workspace” (campo ainda só UI).
- Privacidade/segurança avançada (2FA, sessões reais, exportação/exclusão de dados, billing/storage reais).
- Backend ainda possui mapeamento textual legado fixo em pt-BR via `BrazilDateTimeMapper`.

## Validação recente
- Frontend: testes de Preferences + smoke passaram (`25/25`).
- Backend: `SettingsApiIntegrationTest` passou (`4/4`).
