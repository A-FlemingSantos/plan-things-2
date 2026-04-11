# Plan Things

Plan Things está organizado como um monorepo npm com workspaces. O código funcional atual vive na aplicação web, enquanto os diretórios do app mobile e do serviço de API estão reservados para implementação futura.

## Estrutura do Projeto

```text
plan-things/
  apps/
    web/        Aplicação Vite + React
    mobile/     Placeholder para um futuro app mobile
  services/
    api/        Placeholder para um futuro backend/API
  docs/         Notas de verificação e documentação do projeto
```

O `package.json` da raiz funciona como orquestrador dos workspaces. Ele não concentra as dependências da aplicação diretamente; em vez disso, delega os comandos para o workspace relevante.

## Aplicação Web

A aplicação atual está em `apps/web`.

Arquivos importantes:

- `apps/web/src/`: código-fonte React
- `apps/web/index.html`: entrypoint HTML do Vite
- `apps/web/vite.config.js`: configuração do Vite e do Vitest
- `apps/web/package.json`: scripts e dependências da aplicação web

A aplicação web usa imports relativos dentro de `src`, então mover o app inteiro para `apps/web` preserva a estrutura atual dos imports.

## Como Começar

Instale as dependências a partir da raiz do repositório:

```sh
npm install
```

Rode o servidor de desenvolvimento:

```sh
npm run dev
```

Gere o build da aplicação web:

```sh
npm run build
```

Rode a suíte de testes:

```sh
npm run test:run
```

Os scripts da raiz atualmente delegam para `apps/web`. Por exemplo, `npm run build` executa o build do workspace web.

## Comandos de Workspace

Os comandos também podem ser executados diretamente no workspace web:

```sh
npm --workspace apps/web run dev
npm --workspace apps/web run build
npm --workspace apps/web run test:run
```

Prefira os comandos da raiz para o desenvolvimento do dia a dia, a menos que a tarefa esteja especificamente limitada a um workspace.

## Considerações Futuras

`apps/mobile` e `services/api` são placeholders intencionalmente vazios por enquanto. Antes de adicionar código nessas áreas, vale decidir a stack e o contrato de workspace de cada uma:

- Mobile: framework, requisitos de build nativo, tratamento de ambiente e se haverá compartilhamento de código com `apps/web`.
- API: runtime, framework, camada de banco de dados, modelo de autenticação e destino de deploy.
- Código compartilhado: se web, mobile e API precisarem de contratos ou utilitários comuns, considere adicionar um pacote dedicado, como `packages/shared`, em vez de importar diretamente entre apps.
- Variáveis de ambiente: mantenha arquivos `.env` específicos de cada app dentro do respectivo workspace e evite commitar segredos.
- Outputs de build e dependências: pastas geradas, como `dist/` e `node_modules/`, devem continuar ignoradas pelo Git.

Quando novos workspaces forem adicionados, atualize os scripts da raiz apenas para comandos que devem estar disponíveis a partir da raiz do repositório.


