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

### Expo Go Android

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="<url-publica-da-api>"
npm run mobile:android
```

Para OAuth e Gmail no Android local, a API precisa estar acessível por URL pública, normalmente via `ngrok`.

## GitHub Codespaces

No Codespaces, rode a API e o frontend em terminais separados:

```sh
cd services/api
mvn spring-boot:run
```

```sh
npm run dev
```

Portas esperadas:

- `5173`: web
- `8080`: API
- `1433`: SQL Server

Para OAuth e Gmail remotos, configure secrets/variáveis com os domínios públicos do Codespaces para:

- `APP_FRONTEND_BASE_URL`
- `APP_OAUTH_WEB_CALLBACK_URL`
- `GMAIL_INTEGRATION_WEB_RETURN_URL`
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
