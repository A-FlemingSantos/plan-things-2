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

- Node.js e npm.
- Java 21.
- Maven disponível no ambiente.
- SQL Server local acessível pela API.

Por padrão, a API usa `jdbc:sqlserver://localhost:1433;databaseName=plan_things_db;encrypt=false;trustServerCertificate=true`. Ajuste as configurações por variáveis de ambiente ou pelo arquivo de configuração local quando necessário.

## Como rodar

Instale as dependências npm a partir da raiz:

```sh
npm install
```

Rode a API:

```sh
cd services/api
mvn spring-boot:run
```

Em outro terminal, rode o app web a partir da raiz:

```sh
npm run dev
```

O Vite abre o frontend em `http://localhost:5173` e encaminha chamadas `/api` para `http://localhost:8080`.

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

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GMAIL_INTEGRATION_REDIRECT_URI`
- `GMAIL_INTEGRATION_FRONTEND_RETURN_URL`
- `APP_INTEGRATION_TOKEN_KEY_B64`
- `APP_FRONTEND_BASE_URL`
- `APP_OAUTH_FRONTEND_CALLBACK_URL`

A integração Gmail atual usa o escopo `gmail.send`. Leitura real de caixa Gmail e Google Calendar são frentes futuras separadas.

No frontend, `VITE_API_BASE_URL` pode ser usado quando a API não estiver no mesmo host/proxy padrão.

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
mvn test
```

Os testes cobrem fluxos de auth, preferências, Kanban, convites, arquivos, Gmail, Inbox e contratos compartilhados entre frontend e backend.

## Estado do produto

O estado detalhado das entregas vive em [STATUS_OVERVIEW.md](STATUS_OVERVIEW.md). A sequência planejada de implementação vive em [IMPLEMENTATION_SEQUENCE.md](IMPLEMENTATION_SEQUENCE.md).

Em resumo, as bases principais de colaboração, OAuth Google, Gmail, convites e Inbox operacional já existem. As próximas frentes descritas no repositório são governança de colaboração, refinamento de arquivos/anexos, ajustes finais de Settings e Google Calendar como integração opcional futura.
