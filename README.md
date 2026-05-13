# Plan Things

Monorepo do Plan Things: app web em React, app mobile em Expo e API Spring Boot para autenticação, Kanban, planos compartilhados, arquivos, calendário, preferências e integração Gmail.

## Estrutura

- `apps/web`: frontend Vite + React.
- `apps/mobile`: app Expo para `mobile:web` e Expo Go.
- `services/api`: backend Spring Boot 3.5 / Java 21.
- `packages/shared-client`: cliente e contratos compartilhados.
- `scripts`: automações auxiliares do repositório.

## Stack

- Web: React 18, Vite 5, React Router, Vitest.
- Mobile: Expo 52, React Native 0.76, React Native Web.
- API: Java 21, Spring Boot 3.5, Spring Security, JPA, Flyway, SQL Server, JWT.

## Requisitos

- Node.js 24 + npm 11
- Java 21
- Maven no PATH
- SQL Server local ou em container

O backend usa por padrão:

```text
jdbc:sqlserver://localhost:1433;databaseName=plan_things_db;encrypt=false;trustServerCertificate=true
```

Usuário padrão: `sa`  
Senha obrigatória: `SPRING_DATASOURCE_PASSWORD`

## Instalação

```sh
npm install
```

## Desenvolvimento local no Windows

Os scripts PowerShell em [scripts/powershell/README.md](C:/Users/Arthur%20Fleming/plan-things-2/scripts/powershell/README.md:1) são o caminho recomendado. Se o seu `$PROFILE` já foi configurado, você pode chamar os comandos sem `.ps1`.

### Site web

1. `start-web-backend`
2. `start-web-frontend`

### Mobile web

1. `start-mobile-web-backend`
2. `start-mobile-web-expo`

### Expo Go Android

1. `start-mobile-android-ngrok`
2. `start-mobile-android-backend`
3. `start-mobile-android-expo`

### Cenário completo

1. `start-mobile-android-ngrok`
2. `start-shared-backend`
3. `start-web-frontend`
4. `start-mobile-web-expo`
5. `start-mobile-android-expo`

No cenário completo:

- web: `5173`
- `mobile:web`: `8081`
- Expo Go Android: `8082`

## Desenvolvimento manual

### Backend

```powershell
cd services/api
$env:SPRING_DATASOURCE_PASSWORD="<senha-local>"
mvn spring-boot:run
```

### Web

```powershell
npm run dev
```

### Mobile web

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:8080"
npm run mobile:web
```

Para OAuth e Gmail no `mobile:web`, o backend deve usar:

- `APP_OAUTH_MOBILE_WEB_CALLBACK_URL=http://localhost:8081/oauth/callback`
- `GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL=http://localhost:8081/settings`

### Expo Go Android

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="<url-publica-da-api>"
npm run mobile:android
```

Para OAuth e Gmail no Android local, a API precisa estar acessível por URL pública, normalmente via `ngrok`.

## GitHub Codespaces

No Codespaces, carregue `./.env.codespaces` antes de subir a API ou o app mobile. Ele prepara:

- `EXPO_PUBLIC_API_BASE_URL`
- `APP_FRONTEND_BASE_URL`
- `APP_OAUTH_FRONTEND_CALLBACK_URL`
- `APP_OAUTH_MOBILE_WEB_CALLBACK_URL`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GMAIL_INTEGRATION_FRONTEND_RETURN_URL`
- `GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL`
- `GMAIL_INTEGRATION_REDIRECT_URI`
- `APP_CORS_ALLOWED_ORIGINS`

Exemplo para site web:

```sh
source ./.env.codespaces
cd services/api
mvn spring-boot:run
```

```sh
source ./.env.codespaces
npm run dev
```

Exemplo para `mobile:web`:

```sh
source ./.env.codespaces
cd services/api
mvn spring-boot:run
```

```sh
source ./.env.codespaces
npm run mobile:web
```

Exemplo para Expo Go Android:

```sh
source ./.env.codespaces
cd apps/mobile
npx expo start --tunnel --port "${APP_EXPO_GO_PORT}"
```

Depois, no terminal da API:

```sh
source ./.env.codespaces
export APP_OAUTH_MOBILE_CALLBACK_URL="<EXPO_GO_BASE_URL>"
export GMAIL_INTEGRATION_MOBILE_RETURN_URL="<EXPO_GO_BASE_URL>"

cd services/api
mvn spring-boot:run
```

Use `EXPO_GO_BASE_URL` as the exact `exp://...` URL shown by `npx expo start --tunnel --port "${APP_EXPO_GO_PORT}"`.
The backend will preserve the Expo tunnel query string and derive `/--/oauth/callback` and `/--/settings` automatically for native mobile returns.

Portas esperadas:

- `5173`: web
- `8081`: `mobile:web`
- `8082`: Expo Go Android
- `8080`: API
- `1433`: SQL Server

No cenário completo em Codespaces, rode:

1. API com `source ./.env.codespaces`
2. web em `5173`
3. `mobile:web` em `8081`
4. Expo Go Android com `npx expo start --tunnel --port "${APP_EXPO_GO_PORT}"`

O `mobile:web` usa as URLs configuradas por `.env.codespaces`. O Expo Go Android continua exigindo o `EXPO_GO_BASE_URL` atual do túnel do Expo para sobrescrever `APP_OAUTH_MOBILE_CALLBACK_URL` e `GMAIL_INTEGRATION_MOBILE_RETURN_URL`.

Para OAuth e Gmail remotos, configure secrets/variáveis com os domínios públicos do Codespaces para:

- `APP_FRONTEND_BASE_URL`
- `APP_OAUTH_FRONTEND_CALLBACK_URL`
- `APP_OAUTH_WEB_CALLBACK_URL`
- `APP_OAUTH_MOBILE_WEB_CALLBACK_URL`
- `GMAIL_INTEGRATION_WEB_RETURN_URL`
- `GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GMAIL_INTEGRATION_REDIRECT_URI`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `APP_INTEGRATION_TOKEN_KEY_B64`
- `APP_JWT_SECRET`

## Variáveis principais

### Backend

- `SPRING_DATASOURCE_PASSWORD`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `APP_INTEGRATION_TOKEN_KEY_B64`
- `APP_JWT_SECRET`
- `APP_FRONTEND_BASE_URL`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_OAUTH_WEB_CALLBACK_URL`
- `APP_OAUTH_MOBILE_WEB_CALLBACK_URL`
- `APP_OAUTH_MOBILE_CALLBACK_URL`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GMAIL_INTEGRATION_WEB_RETURN_URL`
- `GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL`
- `GMAIL_INTEGRATION_MOBILE_RETURN_URL`
- `GMAIL_INTEGRATION_REDIRECT_URI`

### Frontend / mobile

- `EXPO_PUBLIC_API_BASE_URL`

## Comandos úteis

Na raiz:

```sh
npm run dev
npm run build
npm run preview
npm run test
npm run test:run
npm run mobile:web
npm run mobile:android
```

No backend:

```powershell
cd services/api
$env:SPRING_DATASOURCE_PASSWORD="<senha-local>"
mvn test
mvn spring-boot:run
```

## Testes

- Frontend/mobile compartilhado: `npm run test:run`
- Backend: `mvn test`

Os testes cobrem auth, Kanban, preferências, arquivos, Gmail, Inbox e contratos compartilhados.

## Banco de dados

As migrações ficam em:

```text
services/api/src/main/resources/db/migration/
```

O Hibernate usa `ddl-auto: validate`, então o schema deve ser criado e evoluído via Flyway.

## Referências

- Estado do produto: [STATUS_OVERVIEW.md](C:/Users/Arthur%20Fleming/plan-things-2/STATUS_OVERVIEW.md:1)
- Sequência planejada: [IMPLEMENTATION_SEQUENCE.md](C:/Users/Arthur%20Fleming/plan-things-2/IMPLEMENTATION_SEQUENCE.md:1)
