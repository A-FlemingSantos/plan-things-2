# Plano de Transicao Hibrida Local + GitHub Codespaces

Este documento mapeia a transicao do projeto para continuar rodando em Windows/localhost e tambem em GitHub Codespaces/Ubuntu. Ele registra decisoes, arquivos impactados, variaveis, riscos e fases de implementacao. Nao implementa `.devcontainer` ainda.

## Decisoes

- Frontend no Codespaces deve usar proxy Vite relativo `/api`, evitando `VITE_API_BASE_URL` dinamico e reduzindo necessidade de CORS no browser.
- OAuth Google em Codespaces/dev remoto deve usar um OAuth Client separado do client local.
- SQL Server no Codespaces deve rodar em container com volume Docker simples, mantendo dados durante o uso do Codespace sem compromisso de persistencia de producao.
- A proxima entrega deve ser implementacao planejada e incremental, depois deste documento.

## Estado Atual

- Backend Spring Boot fica em `services/api`.
- Frontend Vite/React fica em `apps/web`.
- Banco atual e SQL Server em `localhost:1433`.
- Login Google, conexao Gmail em Settings e envio de convite por Gmail ja existem.
- O frontend ja tem cliente HTTP com suporte a `VITE_API_BASE_URL`, mas hoje pode operar por URL relativa.
- O Vite usa proxy `/api` fixo para `http://localhost:8080`.
- O backend habilita CORS via Spring Security, mas nao ha uma configuracao explicita de origens.
- Nao existe `.devcontainer/`, compose Docker, `.env.example` ou script de bootstrap para Codespaces.

## Arquivos Que Precisarao Mudar

### Backend Config

- `services/api/src/main/resources/application.yml`
  - Parametrizar `spring.datasource.url`, `spring.datasource.username` e `spring.datasource.password` com env vars.
  - Trocar `app.jwt.secret` hardcoded por `${APP_JWT_SECRET:...}` ou exigir env fora de dev local.
  - Manter defaults localhost para local Windows.
  - Confirmar env vars para URLs absolutas:
    - `APP_FRONTEND_BASE_URL`
    - `APP_OAUTH_FRONTEND_CALLBACK_URL`
    - `GOOGLE_OAUTH_REDIRECT_URI`
    - `GMAIL_INTEGRATION_REDIRECT_URI`
    - `GMAIL_INTEGRATION_FRONTEND_RETURN_URL`
  - Manter `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` e `APP_INTEGRATION_TOKEN_KEY_B64` sem default sensivel.

- `services/api/src/test/resources/application-test.yml`
  - Remover dependencia rigida de `localhost:1433` e senha fixa para permitir container/CI/dev remoto.
  - Manter defaults locais aceitaveis para testes em Windows.

- `services/api/src/main/java/com/planthings/api/auth/OAuthProperties.java`
  - Revisar defaults Java de localhost para alinhar com `application.yml`.
  - Risco GitNexus: MEDIUM para `OAuthProperties`.

- `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java`
  - Revisar defaults Java de localhost para alinhar com env/config.
  - Risco GitNexus: LOW.

- `services/api/src/main/java/com/planthings/api/config/SecurityConfiguration.java`
  - Se o proxy Vite relativo for mantido como padrao, CORS pode continuar minimalista.
  - Ainda assim, preparar uma configuracao opcional por env para cenarios em que o frontend chame a API diretamente.
  - Risco GitNexus: LOW para `securityFilterChain`.

- `services/api/src/main/java/com/planthings/api/config/DatasourceSafetyGuard.java`
  - Avaliar se o guard deve aceitar apenas `databaseName=plan_things_db` fora do profile `test`.
  - Para Codespaces, pode continuar igual se o container usar a mesma base `plan_things_db`.
  - Risco GitNexus: LOW.

### Backend Links e OAuth

- `services/api/src/main/java/com/planthings/api/plans/PlanService.java`
  - Usa `app.frontend-base-url` para links de convite.
  - Garantir que Codespaces injete `APP_FRONTEND_BASE_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`.
  - Risco GitNexus: LOW para a classe.

- `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java`
  - Usa `app.frontend-base-url` para links de cards enviados por Gmail.
  - Mesmo tratamento de `APP_FRONTEND_BASE_URL`.
  - Risco GitNexus: LOW para a classe.

- `services/api/src/main/java/com/planthings/api/auth/OAuthLoginService.java`
  - Usa `providerConfig.getRedirectUri()` no authorization URL e `app.oauth.frontend-callback-url` para retorno ao frontend.
  - Em Codespaces, esses valores precisam ser URLs publicas de forwarded ports.
  - Risco GitNexus: LOW para `start` e `buildFrontendCallback`.

- `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java`
  - Usa `gmailProperties.getRedirectUri()` e `gmailProperties.getFrontendReturnUrl()`.
  - Em Codespaces, redirect URI deve apontar para porta 8080 publica, retorno para porta 5173 publica.
  - Risco GitNexus: LOW para `startAuthorization`.

### Frontend

- `apps/web/vite.config.js`
  - Configurar servidor Vite para escutar em `0.0.0.0` no Codespaces.
  - Manter proxy relativo `/api`.
  - Tornar alvo do proxy configuravel, por exemplo `VITE_API_PROXY_TARGET`, com default `http://localhost:8080`.

- `apps/web/package.json`
  - Opcional: adicionar script `dev:codespaces` com `vite --host 0.0.0.0`.
  - Alternativa: manter comando explicito `npm run dev -- --host 0.0.0.0`.

- `apps/web/src/shared/api/apiClient.js`
  - Preferir nao mexer, pois ja suporta URL relativa.
  - Se mexer, impacto GitNexus e CRITICAL: `apiRequest`/`buildUrl` afetam quase todo o frontend.

### Testes

- `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java`
  - Hoje cria banco em `localhost:1433` com `sa` e senha fixa.
  - Parametrizar por env vars de teste, mantendo defaults locais.

- Testes com URLs localhost:
  - `services/api/src/test/java/com/planthings/api/OAuthApiIntegrationTest.java`
  - `services/api/src/test/java/com/planthings/api/GmailIntegrationApiIntegrationTest.java`
  - `services/api/src/test/java/com/planthings/api/PlanInviteGmailIntegrationTest.java`
  - `services/api/src/test/java/com/planthings/api/BoardInboxGmailIntegrationTest.java`
  - `services/api/src/test/java/com/planthings/api/DatasourceSafetyGuardTest.java`
  - `services/api/src/test/java/com/planthings/api/auth/DefaultOidcProviderClientTest.java`

### Devcontainer e Documentacao

- `.devcontainer/devcontainer.json`
  - Novo arquivo futuro.

- `.devcontainer/docker-compose.yml`
  - Novo arquivo futuro para SQL Server com volume.

- `.devcontainer/postCreateCommand.sh`
  - Novo arquivo futuro para instalar deps, validar Java/Node/Maven e mostrar URLs.

- `.devcontainer/codespaces.env.example`
  - Novo arquivo futuro com variaveis sem secrets reais.

- `README.md`
  - Documentar local Windows e Codespaces.
  - Documentar OAuth clients separados, ports e secrets.

- `.gitignore`
  - Garantir ignore de `.env`, `.env.local`, `.env.*.local` e arquivos de secret.

## Pontos Com Localhost, Portas Fixas e Secrets

- `services/api/src/main/resources/application.yml`
  - `jdbc:sqlserver://localhost:1433`
  - usuario `sa`
  - senha `sa-9MNP6LI`
  - JWT secret hardcoded
  - frontend `http://localhost:5173`
  - backend callbacks `http://localhost:8080`

- `services/api/src/test/resources/application-test.yml`
  - `jdbc:sqlserver://localhost:1433`
  - senha `sa-9MNP6LI`
  - JWT secret hardcoded

- `apps/web/vite.config.js`
  - proxy target `http://localhost:8080`

- `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java`
  - `SQL_SERVER_HOST = "localhost:1433"`
  - `SQL_SERVER_USER = "sa"`
  - `SQL_SERVER_PASSWORD = "sa-9MNP6LI"`

- `services/api/src/main/java/com/planthings/api/auth/OAuthProperties.java`
  - default `http://localhost:5173/oauth/callback`

- `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java`
  - default `http://localhost:8080/api/settings/integrations/gmail/callback`
  - default `http://localhost:5173/settings`

- `services/api/src/main/java/com/planthings/api/plans/PlanService.java`
  - fallback `http://localhost:5173`

- `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java`
  - fallback `http://localhost:5173`

## Variaveis Necessarias

### Backend

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_FRONTEND_BASE_URL`
- `APP_OAUTH_FRONTEND_CALLBACK_URL`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GMAIL_INTEGRATION_REDIRECT_URI`
- `GMAIL_INTEGRATION_FRONTEND_RETURN_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `APP_INTEGRATION_TOKEN_KEY_B64`
- `APP_JWT_SECRET`

### Frontend

- `VITE_API_BASE_URL`
  - Nao recomendado para Codespaces neste projeto, pois a decisao e usar proxy relativo `/api`.
  - Pode continuar disponivel para cenarios especiais.

- `VITE_API_PROXY_TARGET`
  - Variavel nova sugerida para o `vite.config.js`.
  - Default local: `http://localhost:8080`.

## OAuth Google em Codespaces

Google OAuth exige redirect URIs exatas. Como Codespaces gera hosts publicos por Codespace, o caminho mais limpo e usar um OAuth Client separado para dev remoto.

### Client Local

URIs locais a manter no client local:

- `http://localhost:8080/api/auth/oauth/google/callback`
- `http://localhost:8080/api/settings/integrations/gmail/callback`

### Client Codespaces

URIs a registrar no client Codespaces/dev remoto para cada Codespace usado:

- `https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api/auth/oauth/google/callback`
- `https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api/settings/integrations/gmail/callback`

Valores de retorno frontend no ambiente Codespaces:

- `APP_FRONTEND_BASE_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
- `APP_OAUTH_FRONTEND_CALLBACK_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/oauth/callback`
- `GMAIL_INTEGRATION_FRONTEND_RETURN_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/settings`

Portas:

- `5173`: publica, para o usuario abrir o frontend.
- `8080`: publica, porque Google precisa chamar os callbacks.
- `1433`: privada, apenas para backend/container.

## Estrutura Sugerida de `.devcontainer`

```text
.devcontainer/
  devcontainer.json
  docker-compose.yml
  postCreateCommand.sh
  codespaces.env.example
```

### `devcontainer.json`

Responsabilidades futuras:

- Usar imagem com Java 21, Node.js, npm, Maven e Docker CLI.
- Subir `docker-compose.yml`.
- Encaminhar portas `5173` e `8080`.
- Deixar `1433` privada.
- Rodar `npm install` no `postCreateCommand`.
- Expor instrucoes para configurar secrets do Codespaces.

### `docker-compose.yml`

Responsabilidades futuras:

- Servico `sqlserver`.
- Imagem SQL Server Linux.
- `ACCEPT_EULA=Y`.
- `MSSQL_SA_PASSWORD` vindo de env/secret.
- Volume Docker para `/var/opt/mssql`.
- Porta `1433` acessivel para o backend dentro do Codespace.

### `postCreateCommand.sh`

Responsabilidades futuras:

- Validar `java -version`, `node -v`, `npm -v` e `mvn -v`.
- Rodar `npm install`.
- Mostrar URLs esperadas para frontend e backend.
- Nao gravar secrets.

## Comandos Esperados

### Local Windows

```powershell
npm install

cd services/api
mvn spring-boot:run

cd ..\..\
npm run dev
```

Opcional com env local:

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:sqlserver://localhost:1433;databaseName=plan_things_db;encrypt=false;trustServerCertificate=true"
$env:SPRING_DATASOURCE_USERNAME="sa"
$env:SPRING_DATASOURCE_PASSWORD="<senha-local>"
$env:APP_FRONTEND_BASE_URL="http://localhost:5173"
$env:APP_OAUTH_FRONTEND_CALLBACK_URL="http://localhost:5173/oauth/callback"
$env:GOOGLE_OAUTH_REDIRECT_URI="http://localhost:8080/api/auth/oauth/google/callback"
$env:GMAIL_INTEGRATION_REDIRECT_URI="http://localhost:8080/api/settings/integrations/gmail/callback"
$env:GMAIL_INTEGRATION_FRONTEND_RETURN_URL="http://localhost:5173/settings"
```

### GitHub Codespaces

```sh
export WEB_URL="https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
export API_URL="https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"

docker compose -f .devcontainer/docker-compose.yml up -d sqlserver

cd services/api
mvn spring-boot:run

cd ../../apps/web
npm run dev -- --host 0.0.0.0
```

Env esperado no Codespaces:

```sh
export SPRING_DATASOURCE_URL="jdbc:sqlserver://sqlserver:1433;databaseName=plan_things_db;encrypt=false;trustServerCertificate=true"
export SPRING_DATASOURCE_USERNAME="sa"
export SPRING_DATASOURCE_PASSWORD="$MSSQL_SA_PASSWORD"
export APP_FRONTEND_BASE_URL="$WEB_URL"
export APP_OAUTH_FRONTEND_CALLBACK_URL="$WEB_URL/oauth/callback"
export GOOGLE_OAUTH_REDIRECT_URI="$API_URL/api/auth/oauth/google/callback"
export GMAIL_INTEGRATION_REDIRECT_URI="$API_URL/api/settings/integrations/gmail/callback"
export GMAIL_INTEGRATION_FRONTEND_RETURN_URL="$WEB_URL/settings"
export VITE_API_PROXY_TARGET="http://localhost:8080"
```

## Riscos

- `apps/web/src/shared/api/apiClient.js` tem impacto CRITICAL no GitNexus. Evitar alterar se o proxy relativo resolver o problema.
- OAuth Google com Codespaces depende de URLs publicas exatas; cada Codespace pode exigir cadastro/atualizacao de redirect URI no Google Cloud.
- Porta `8080` precisa estar publica para callbacks externos do Google. Se estiver privada, OAuth e Gmail falham.
- SQL Server em container precisa de senha forte e tempo de inicializacao; o backend pode subir antes do banco estar pronto se nao houver healthcheck/wait.
- `DatasourceSafetyGuard` bloqueia bases que nao sejam `plan_things_db` fora do profile `test`; o compose deve usar esse nome ou o guard precisa de ajuste deliberado.
- Secrets hardcoded atuais precisam sair do caminho antes de compartilhar ambiente remoto.
- CORS pode continuar irrelevante com proxy relativo, mas vira bloqueio se alguem usar `VITE_API_BASE_URL` direto para `8080`.
- Testes backend hoje assumem SQL Server em `localhost:1433`; precisam aceitar host/container por env.

## Plano de Implementacao

1. Preparar configuracao por ambiente.
   - Parametrizar datasource e JWT em `application.yml`.
   - Criar exemplos de env sem secrets reais.
   - Manter defaults localhost para Windows.

2. Ajustar frontend dev server.
   - Configurar Vite para aceitar `--host 0.0.0.0`.
   - Tornar proxy target configuravel com default local.
   - Evitar alterar `apiClient.js`.

3. Preparar SQL Server em container.
   - Criar compose com volume Docker.
   - Usar database `plan_things_db`.
   - Documentar healthcheck ou tempo de espera.

4. Criar `.devcontainer`.
   - Adicionar `devcontainer.json`, compose e bootstrap.
   - Forward publico para `5173` e `8080`.
   - Manter `1433` privado.

5. Configurar OAuth remoto.
   - Criar OAuth Client Google separado para Codespaces/dev remoto.
   - Registrar redirect URIs publicas da porta `8080`.
   - Configurar Codespaces Secrets.

6. Adaptar testes e documentacao.
   - Parametrizar `ApiIntegrationTestSupport`.
   - Atualizar README com local Windows e Codespaces.
   - Rodar testes backend/frontend.

7. Validar ponta a ponta.
   - Local Windows: login Google, conexao Gmail, convite Gmail e Inbox por Gmail.
   - Codespaces: mesmos fluxos com URLs publicas.

## Checklist de Validacao Futura

- `npm run test:run`
- `cd services/api && mvn test`
- Local Windows abre `http://localhost:5173`.
- Codespaces abre porta publica `5173`.
- Frontend chama `/api` via proxy.
- Login Google redireciona para callback publico correto no Codespaces.
- Gmail Settings conecta e retorna para `/settings`.
- Convite por Gmail gera link com host frontend correto.
- Inbox por Gmail gera link de card com host frontend correto.
- SQL Server container preserva dados durante o ciclo de vida do Codespace.
