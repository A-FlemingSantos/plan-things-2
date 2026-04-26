# Plan Things

Plan Things é um monorepo para uma aplicação de planejamento colaborativo. O produto combina um app web em React com uma API Spring Boot, cobrindo quadros Kanban, planos compartilhados, convites, arquivos, calendário, canvas visual, preferências de usuário e integração Gmail para envio operacional de e-mails.

## Visão geral

- `apps/web`: aplicação Vite + React.
- `services/api`: backend Spring Boot 3.5 com Java 21.
- `apps/mobile`: placeholder para um futuro app mobile.
- `scripts`: automações auxiliares do repositório.

O workspace npm da raiz orquestra principalmente o app web. A API é mantida como serviço Java/Maven dentro do mesmo repositório.

## Funcionalidades atuais

- Autenticação local e OAuth Google com sessão própria do Plan Things.
- Workspace com planos, membros, convites e papéis.
- Quadro Kanban com colunas, cards, responsáveis, comentários, checklists e filtros.
- Convites de plano enviados por Gmail conectado.
- Inbox operacional no KanbanBoard: soltar um card na Inbox envia e-mail por Gmail para membros selecionados, atribui os membros ao card e registra histórico persistente.
- Biblioteca de arquivos, anexos em cards e compartilhamento por plano.
- Calendário e canvas visual.
- Configurações de usuário, tema, página inicial e integração Gmail.

## Stack

**Web**

- React 18
- Vite 5
- React Router
- Vitest + Testing Library
- CSS Modules

**API**

- Java 21
- Spring Boot 3.5
- Spring Security
- Spring Data JPA
- Flyway
- SQL Server
- JWT

## Estrutura

```text
plan-things/
  apps/
    web/
      src/
        features/      Módulos de produto
        shared/        Componentes, contratos, API client e estilos comuns
      vite.config.js
    mobile/            Placeholder
  services/
    api/
      src/main/java/   API Spring Boot
      src/main/resources/db/migration/
      src/test/java/   Testes de integração e unidade da API
      pom.xml
  scripts/
    generate-background-thumbs.mjs
```

## Requisitos

- Node.js 24 e npm 11, alinhados ao ambiente de desenvolvimento atual.
- Java 21.
- Maven disponível no ambiente.
- Docker com Docker Compose para o SQL Server em container, ou SQL Server local acessível pela API.

Por padrão, a API usa `jdbc:sqlserver://localhost:1433;databaseName=plan_things_db;encrypt=false;trustServerCertificate=true`, usuário `sa` e exige `SPRING_DATASOURCE_PASSWORD` por variável de ambiente. Ajuste as configurações por variáveis de ambiente ou pelo arquivo de configuração local quando necessário.

## Como rodar

Instale as dependências npm a partir da raiz:

```sh
npm install
```

Rode a API:

```sh
cd services/api
SPRING_DATASOURCE_PASSWORD=<senha-local> mvn spring-boot:run
```

No PowerShell:

```powershell
cd services/api
$env:SPRING_DATASOURCE_PASSWORD="<senha-local>"
mvn spring-boot:run
```

Em outro terminal, rode o app web a partir da raiz:

```sh
npm run dev
```

O Vite abre o frontend em `http://localhost:5173` e encaminha chamadas `/api` para `http://localhost:8080`.

## Desenvolvimento local com Docker

O repositório inclui um compose de desenvolvimento para SQL Server:

```sh
MSSQL_SA_PASSWORD=ChangeThis-12345 docker compose -f .devcontainer/docker-compose.yml up -d sqlserver sqlserver-init
```

No PowerShell:

```powershell
$env:MSSQL_SA_PASSWORD="ChangeThis-12345"
docker compose -f .devcontainer/docker-compose.yml up -d sqlserver sqlserver-init
```

Depois rode a API e o frontend normalmente. O compose publica o SQL Server em `127.0.0.1:1433`, usa volume Docker para preservar dados de desenvolvimento e cria `plan_things_db` se o banco ainda não existir.

Se usar um SQL Server local já existente, defina `SPRING_DATASOURCE_PASSWORD` antes de iniciar a API.

## GitHub Codespaces

O ambiente Codespaces usa `.devcontainer/devcontainer.json` e `.devcontainer/docker-compose.yml`.

Antes de criar ou reconstruir o Codespace, configure os secrets do Codespaces:

- `MSSQL_SA_PASSWORD`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `APP_INTEGRATION_TOKEN_KEY_B64`
- `APP_JWT_SECRET`

Dentro do Codespace, os comandos principais são:

```sh
cd services/api
mvn spring-boot:run
```

Em outro terminal:

```sh
npm run dev:codespaces --workspace apps/web
```

As portas esperadas são:

- `5173`: frontend Vite, pública.
- `8080`: API Spring Boot, pública para callbacks OAuth/Gmail.
- `1433`: SQL Server, privado.

O frontend continua chamando `/api` por proxy Vite. Em Codespaces, o proxy aponta para `http://localhost:8080` dentro do container de workspace.

## Comandos principais

Na raiz do repositório:

```sh
npm run dev       # inicia o app web
npm run build     # gera build do app web
npm run preview   # serve o build do app web
npm run test      # roda Vitest em modo watch
npm run test:run  # roda Vitest uma vez
npm run thumbs    # regenera thumbnails de backgrounds
```

No backend:

```sh
cd services/api
SPRING_DATASOURCE_PASSWORD=<senha-local> mvn test
SPRING_DATASOURCE_PASSWORD=<senha-local> mvn spring-boot:run
```

No PowerShell:

```powershell
cd services/api
$env:SPRING_DATASOURCE_PASSWORD="<senha-local>"
mvn test
mvn spring-boot:run
```

Também é possível chamar scripts diretamente no workspace web:

```sh
npm --workspace apps/web run dev
npm --workspace apps/web run build
npm --workspace apps/web run test:run
```

## Variáveis e integrações

A API possui defaults para desenvolvimento local, mas algumas integrações precisam de configuração real:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_CORS_ALLOWED_ORIGINS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GMAIL_INTEGRATION_REDIRECT_URI`
- `GMAIL_INTEGRATION_FRONTEND_RETURN_URL`
- `APP_INTEGRATION_TOKEN_KEY_B64`
- `APP_JWT_SECRET`
- `APP_FRONTEND_BASE_URL`
- `APP_OAUTH_FRONTEND_CALLBACK_URL`

A integração Gmail atual usa o escopo `gmail.send`. Leitura real de caixa Gmail e Google Calendar são frentes futuras separadas.

No frontend, o padrão recomendado é usar `/api` via proxy Vite. `VITE_API_PROXY_TARGET` controla o destino do proxy e usa `http://localhost:8080` como default. `VITE_API_BASE_URL` ainda pode ser usado em cenários especiais em que a API não esteja no mesmo host/proxy padrão.

O backend permite CORS para a origem de `APP_FRONTEND_BASE_URL`. Use `APP_CORS_ALLOWED_ORIGINS` somente para origens extras, separadas por virgula, quando o frontend chamar a API diretamente em vez de passar pelo proxy `/api`.

### OAuth Google em ambiente remoto

Use um OAuth Client Google separado para Codespaces/dev remoto. O Google exige redirect URIs exatas, então cada Codespace pode precisar de URIs próprias:

```text
https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api/auth/oauth/google/callback
https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api/settings/integrations/gmail/callback
```

As URLs de retorno do frontend no Codespaces seguem este formato:

```text
APP_FRONTEND_BASE_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}
APP_OAUTH_FRONTEND_CALLBACK_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/oauth/callback
GMAIL_INTEGRATION_FRONTEND_RETURN_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/settings
```

Essas configurações ficam fora do Git: use GitHub Codespaces Secrets, variáveis do shell ou `.env.local` local não versionado.

## Banco de dados

As migrações ficam em:

```text
services/api/src/main/resources/db/migration/
```

O Hibernate está configurado com `ddl-auto: validate`; portanto, o schema esperado deve ser criado e evoluído via Flyway.

## Testes

Frontend:

```sh
npm run test:run
```

Backend:

```sh
cd services/api
SPRING_DATASOURCE_PASSWORD=<senha-local> mvn test
```

No PowerShell:

```powershell
cd services/api
$env:SPRING_DATASOURCE_PASSWORD="<senha-local>"
mvn test
```

Os testes cobrem fluxos de auth, preferências, Kanban, convites, arquivos, Gmail, Inbox e contratos compartilhados entre frontend e backend.

## Estado do produto

O estado detalhado das entregas vive em [STATUS_OVERVIEW.md](STATUS_OVERVIEW.md). A sequência planejada de implementação vive em [IMPLEMENTATION_SEQUENCE.md](IMPLEMENTATION_SEQUENCE.md).

Em resumo, as bases principais de colaboração, OAuth Google, Gmail, convites e Inbox operacional já existem. As próximas frentes descritas no repositório são governança de colaboração, refinamento de arquivos/anexos, ajustes finais de Settings e Google Calendar como integração opcional futura.
