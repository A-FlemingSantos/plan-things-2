# Revisao temporaria: integracao mobile + backend

Este arquivo e um handoff temporario para revisao por outro agente. Ele descreve a refatoracao feita para conectar o app mobile ao backend real, mantendo a UI existente o mais intacta possivel.

## Objetivo da refatoracao

O trabalho teve como objetivo tirar o fluxo principal do mobile de dados de demonstracao e passar a operar contra o backend real:

- autenticacao real por e-mail/senha e Google;
- botoes Microsoft, Apple e telefone preservados visualmente, mas sem implementacao real;
- bootstrap de sessao persistida com reidratacao via `GET /api/me`;
- navegacao real no mobile com React Navigation e deep links `planthings://`;
- criacao de camada compartilhavel cross-platform em `packages/shared-client`;
- Home, Plans, Board, Files e Settings usando API real;
- Inbox fora do MVP de integracao real;
- contratos do backend ajustados para diferenciar cliente `web` e `mobile` em OAuth e Gmail.

A regra de UX/UI foi tratar a interface existente como intocavel. As alteracoes foram concentradas em estado, contratos, providers, handlers, navegacao e mapeamento de dados.

## Observacao sobre worktree

Antes das mudancas ja existiam delecoes no worktree:

- `CODESPACES_TRANSITION_PLAN.md`
- `interaction-ui.md`

Essas delecoes foram preservadas e nao fazem parte da refatoracao.

## Pacote compartilhado

Foi criado o pacote:

- `packages/shared-client`

O root `package.json` passou a incluir `packages/*` nos workspaces.

Conteudo principal do pacote:

- `src/apiClient.js`
  - `ApiClientError`;
  - `buildApiUrl`;
  - `apiRequest`;
  - `createApiClient`.
- `src/dates.js`
  - helpers puros para datas, offsets e payloads.
- `src/plans.js`
  - normalizacao de plano;
  - mapeamento de resumo/detalhe;
  - payload de criacao.
- `src/board.js`
  - normalizacao de board, colunas, cartoes, comentarios, checklists e anexos;
  - merge de board view;
  - payload de cartao.
- `src/files.js`
  - mapeamento de arquivos da API;
  - helpers de tipo/tamanho;
  - estrutura de biblioteca.
- `src/settings.js`
  - normalizacao de snapshot de settings.

Tambem existem arquivos de reexport na raiz do pacote, como `api.js`, `board.js`, `plans.js`, `files.js`, `settings.js` e `dates.js`, para facilitar resolucao por Metro/React Native.

Restricao importante: o pacote compartilhado nao deve depender de `window`, `document`, `import.meta`, Vite, anchors de download, `import.meta.glob` ou resolucao web-only de assets.

## Backend: OAuth

Arquivos principais:

- `services/api/src/main/java/com/planthings/api/auth/AuthController.java`
- `services/api/src/main/java/com/planthings/api/auth/OAuthLoginService.java`
- `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateEntity.java`
- `services/api/src/main/java/com/planthings/api/auth/OAuthProperties.java`
- `services/api/src/main/resources/application.yml`
- `services/api/src/main/resources/db/migration/V10__oauth_client_callbacks.sql`

Contrato atualizado:

```http
POST /api/auth/oauth/{provider}/start
Content-Type: application/json

{
  "redirectTo": "string opcional",
  "client": "web" | "mobile"
}
```

Comportamento esperado:

1. `AuthController` recebe `redirectTo` e `client`.
2. `OAuthLoginService.start(...)` normaliza `client`.
3. O estado OAuth salva o cliente em `OAuthLoginStateEntity.client`.
4. O provider externo retorna ao callback backend.
5. O backend escolhe o callback final conforme o cliente:
   - web: `app.oauth.web-callback-url`;
   - mobile: `app.oauth.mobile-callback-url`.
6. Para mobile, o callback esperado e algo como:

```text
planthings://oauth/callback?code=...&redirectTo=...
```

7. O app mobile conclui a sessao chamando:

```http
POST /api/auth/oauth/exchange
```

Notas:

- O backend continua podendo suportar provider `microsoft`, mas o mobile nao implementa esse fluxo nesta entrega.
- O fallback de propriedades preserva compatibilidade com a antiga `frontendCallbackUrl` quando aplicavel.

## Backend: Gmail integration

Arquivos principais:

- `services/api/src/main/java/com/planthings/api/settings/SettingsController.java`
- `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java`
- `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java`
- `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java`
- `services/api/src/main/resources/application.yml`
- `services/api/src/main/resources/db/migration/V10__oauth_client_callbacks.sql`

Contrato atualizado:

```http
POST /api/settings/integrations/gmail/start
Content-Type: application/json

{
  "client": "web" | "mobile"
}
```

Comportamento esperado:

1. `SettingsController` aceita o payload opcional com `client`.
2. `GmailIntegrationService.startAuthorization(client)` normaliza e persiste o cliente no estado Gmail.
3. O callback backend escolhe retorno por cliente:
   - web: `gmail.web-return-url`;
   - mobile: `gmail.mobile-return-url`.
4. Para mobile, o retorno esperado e algo como:

```text
planthings://settings?section=integrations&gmail=connected
```

5. Ao voltar ao app, `SettingsScreen` recarrega `GET /api/settings` para refletir o estado real.

Importante: nao foi implementada leitura real de Gmail/Inbox. A integracao cobre conectar/desconectar e refletir o estado real.

## Migration V10

Arquivo:

- `services/api/src/main/resources/db/migration/V10__oauth_client_callbacks.sql`

Objetivo:

- adicionar coluna `client varchar(20) not null` em `oauth_login_states`;
- adicionar coluna `client varchar(20) not null` em `gmail_oauth_states`;
- preencher registros existentes com `web`.

Detalhe tecnico:

No SQL Server, `ALTER TABLE ... ADD client` seguido de `UPDATE ... SET client` no mesmo batch pode falhar com `Nome de coluna 'client' invalido`, porque o parser valida a coluna antes do `ALTER TABLE` estar efetivo para o batch. A migration foi ajustada para usar `EXEC(...)` nos statements que referenciam a coluna recem-criada.

Validacao feita:

- usando as variaveis do script local `oauth_backend.ps1`, o backend aplicou a V10;
- log observado:
  - `Successfully validated 10 migrations`;
  - `Migrating schema [dbo] to version "10 - oauth client callbacks"`;
  - `Successfully applied 1 migration`;
  - `Started PlanThingsApiApplication`.

## Web: compatibilidade com novos contratos

Arquivos principais:

- `apps/web/src/shared/api/apiClient.js`
- `apps/web/src/features/auth/context/AuthContext.jsx`
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx`
- `apps/web/package.json`

Alteracoes:

- o api client web passou a reaproveitar o `apiRequest` do `@plan-things/shared-client`;
- a camada web continua responsavel por comportamento web-only, como base URL por `import.meta.env`, cookies/credentials e download por blob/anchor;
- OAuth start no web envia `client: "web"`;
- Gmail start no web envia `{ client: "web" }`;
- teste de Gmail settings foi atualizado para o novo payload.

Fluxos web a revisar:

1. Login OAuth web inicia com `{ client: "web" }`.
2. Backend redireciona para `app.oauth.web-callback-url`.
3. Gmail start web inicia com `{ client: "web" }`.
4. Backend redireciona para `gmail.web-return-url`.

## Mobile: fundacao e navegacao

Arquivos principais:

- `apps/mobile/App.js`
- `apps/mobile/package.json`
- `apps/mobile/src/screens/AppShell.js`
- `apps/mobile/src/components/BottomTabs.js`
- `apps/mobile/src/services/api.js`
- `apps/mobile/src/providers/AuthProvider.js`
- `apps/mobile/src/providers/PlansProvider.js`
- `apps/mobile/src/providers/FilesProvider.js`

Dependencias adicionadas ao mobile:

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `expo-secure-store`
- `expo-document-picker`
- `react-native-gesture-handler`
- `react-native-screens`
- `@plan-things/shared-client`

Navegacao:

- substituicao do fluxo improvisado por `useState` por React Navigation;
- uso de native stack para Home/Board;
- uso de bottom tabs com o componente visual existente `BottomTabs`;
- deep linking configurado com prefixo `planthings://`;
- caminhos explicitos:
  - `planthings://oauth/callback`;
  - `planthings://settings`.

Tabs principais:

- Home;
- Arquivos;
- Ajustes.

Inbox ficou fora da navegacao principal do MVP de integracao real.

## Mobile: configuracao de API

Arquivo:

- `apps/mobile/src/services/api.js`

Responsabilidades:

- definir base URL do backend;
- usar `EXPO_PUBLIC_API_BASE_URL` quando presente;
- fallback para Android emulator com `10.0.2.2`;
- fallback local para `localhost`;
- expor `mobileApiRequest`;
- expor `mobileApiUrl`.

Ponto de verificacao:

- em dispositivo fisico, `localhost` nao aponta para a maquina dev. Para teste real em device, usar `EXPO_PUBLIC_API_BASE_URL` apontando para o IP acessivel da maquina/backend.

## Mobile: AuthProvider

Arquivo:

- `apps/mobile/src/providers/AuthProvider.js`

Responsabilidades:

- persistir sessao;
- usar SecureStore em ambiente nativo;
- usar localStorage no web preview;
- bootstrap com sessao persistida;
- reidratar usuario/workspace via `GET /api/me`;
- limpar sessao automaticamente se token estiver invalido;
- login e cadastro por e-mail/senha;
- start OAuth Google com `{ client: "mobile" }`;
- escutar deep link `planthings://oauth/callback`;
- em web preview, aceitar tambem callback HTTP em `/oauth/callback`;
- chamar `POST /api/auth/oauth/exchange`;
- logout;
- `patchSession` para sincronizar dados locais apos ajustes de settings.

Fluxo de bootstrap:

```text
App start
  -> AuthProvider le sessao persistida
  -> se nao houver token: mostra AuthScreen
  -> se houver token: GET /api/me
      -> sucesso: seta usuario/workspace e entra no app
      -> 401/erro de token: remove sessao e volta para AuthScreen
```

Fluxo Google mobile:

```text
AuthScreen
  -> continueWithGoogle()
  -> POST /api/auth/oauth/google/start { client: "mobile", redirectTo }
  -> abre URL externa do provider
  -> backend callback
  -> planthings://oauth/callback?code=...
  -> AuthProvider recebe deep link
  -> POST /api/auth/oauth/exchange
  -> sessao persistida
  -> PlansProvider/AppShell
```

Fluxo Google no mobile web/Expo web:

```text
AuthScreen rodando no navegador
  -> continueWithGoogle()
  -> POST /api/auth/oauth/google/start { client: "mobile", redirectTo }
  -> abre Google no navegador
  -> backend callback
  -> http://localhost:<porta-do-expo>/oauth/callback?code=...
  -> AuthProvider detecta URL HTTP no web preview
  -> POST /api/auth/oauth/exchange
  -> history.replaceState("/", sem preservar o code na barra)
  -> PlansProvider/AppShell
```

Para esse fluxo web funcionar, o backend precisa ser iniciado com:

```powershell
$env:APP_OAUTH_MOBILE_CALLBACK_URL="http://localhost:<porta-do-expo>/oauth/callback"
```

No app Android instalado, manter:

```powershell
$env:APP_OAUTH_MOBILE_CALLBACK_URL="planthings://oauth/callback"
```

Correcao aplicada apos debug: `AuthProvider` usa uma `sessionRef` para evitar corrida de logout. Antes, se `SettingsScreen` disparasse uma requisicao e o usuario clicasse em `Sair`, uma resposta atrasada podia chamar `patchSession` e regravar a sessao antiga no storage, fazendo o app voltar automaticamente para Home. Agora `logout` zera `sessionRef` imediatamente e `patchSession` so persiste se ainda houver sessao atual.

## Mobile: AuthScreen

Arquivo:

- `apps/mobile/src/screens/AuthScreen.js`

Alteracoes:

- removeu dependencia de `demoSession` no fluxo principal;
- `Entrar` chama login real por e-mail/senha;
- `Cadastrar-se` chama cadastro real;
- `Continuar com Google` chama OAuth real;
- `Microsoft`, `Apple` e `telefone` seguem visiveis e mostram placeholder curto `Em breve`;
- nao ha chamada de rede para Microsoft/Apple/telefone.

Ponto de verificacao:

- confirmar que nenhuma credencial demo voltou para campos, payloads ou auto-login.

## Mobile: PlansProvider

Arquivo:

- `apps/mobile/src/providers/PlansProvider.js`

Responsabilidades:

- carregar planos via `GET /api/plans`;
- criar plano via `POST /api/plans`;
- carregar detalhe quando necessario;
- carregar board;
- carregar membros e etiquetas:
  - `GET /api/plans/{planId}/members`;
  - `GET /api/plans/{planId}/labels`;
- mapear respostas usando `@plan-things/shared-client`;
- expor acoes de board para telas.

Acoes de board cobertas:

- criar coluna;
- editar coluna;
- remover coluna;
- criar cartao;
- editar cartao;
- remover cartao;
- mover cartao;
- editar titulo, descricao e data;
- atribuir membros;
- selecionar etiquetas;
- enviar comentarios;
- criar checklist;
- criar item de checklist;
- atualizar item de checklist;
- anexar arquivo existente;
- upload direto para cartao;
- remover anexo.

Ponto de revisao:

- verificar se todos os endpoints usados no provider batem exatamente com os nomes/verbos do backend atual.
- como a UI existente nao tinha todos os seletores completos, alguns handlers preservam o comportamento visual e fazem a menor adaptacao possivel.

## Mobile: HomeScreen

Arquivo:

- `apps/mobile/src/screens/HomeScreen.js`

Alteracoes:

- lista planos reais do provider;
- busca local sobre planos carregados;
- cria plano real;
- abre plano selecionado via stack navigation;
- usa estado autenticado real.

Fluxo:

```text
HomeScreen mount
  -> PlansProvider ja carrega /api/plans
  -> usuario pesquisa localmente
  -> criar plano chama POST /api/plans
  -> abrir plano navega para Board com planId
```

## Mobile: Board

Arquivo:

- `apps/mobile/src/screens/MobileKanbanBoard.js`

Alteracoes:

- remove origem fake do fluxo principal;
- carrega board real por `planId`;
- usa membros/etiquetas reais do plano;
- persiste mudancas de colunas/cartoes/comentarios/checklists;
- integra anexos com FilesProvider/API real;
- preserva a UI visual existente o maximo possivel.

Fluxo de abertura:

```text
Home seleciona plano
  -> navigation.navigate("Board", { planId })
  -> Board chama loadPlan(planId)
  -> provider busca detalhe, board, membros e etiquetas
  -> tela renderiza usando adapters normalizados
```

Fluxo de anexos:

```text
Biblioteca
  -> usa lista real de arquivos carregados
  -> anexa arquivo existente ao card

Meu dispositivo
  -> DocumentPicker
  -> upload real
  -> attach ao card
```

Pontos de revisao:

- confirmar endpoints exatos de anexos de card no backend;
- confirmar se a UI precisa futuramente de seletor de arquivo/plano mais explicito. Nesta entrega, a regra foi nao redesenhar.

## Mobile: FilesProvider e FilesScreen

Arquivos:

- `apps/mobile/src/providers/FilesProvider.js`
- `apps/mobile/src/screens/FilesScreen.js`

Fontes de dados:

- `GET /api/files`;
- `GET /api/files?trash=true`;
- `GET /api/files/plans/{planId}` quando necessario.

Acoes reais implementadas na camada de comportamento:

- criar pasta;
- upload;
- download;
- favoritar/desfavoritar;
- mover para lixeira;
- restaurar;
- compartilhar com plano;
- descompartilhar do plano.

Views preservadas:

- Meus arquivos;
- Compartilhado;
- Favoritos;
- Lixeira;
- Recentes como filtro/ordenacao local.

Pontos de revisao:

- comportamento de "Recentes" e local, a partir dos arquivos carregados;
- fluxo de compartilhar usa a estrutura existente da UI, sem redesenho;
- se algum comando visual existente nao tiver endpoint correspondente no backend, ele deve permanecer sem fake data e sem prometer persistencia inexistente.

## Mobile: SettingsScreen

Arquivo:

- `apps/mobile/src/screens/SettingsScreen.js`

Fonte de dados:

- `GET /api/settings`.

Acoes reais:

- `PATCH /api/settings/account`;
- `PATCH /api/settings/preferences`;
- `PATCH /api/settings/notifications`;
- `PATCH /api/settings/password`;
- `PATCH /api/workspace`;
- `POST /api/settings/integrations/gmail/start`;
- `DELETE /api/settings/integrations/gmail`.

Gmail mobile:

```text
SettingsScreen
  -> POST /api/settings/integrations/gmail/start { client: "mobile" }
  -> abre URL externa
  -> backend retorna para planthings://settings?section=integrations&gmail=connected
  -> SettingsScreen detecta deep link
  -> recarrega GET /api/settings
  -> UI mostra estado real
```

Pontos de revisao:

- confirmar que textos/estrutura visual foram preservados;
- confirmar que estados de toggle nao fazem optimistic update inconsistente quando API falha;
- confirmar que snapshot retornado pelo backend contem campos esperados pelo normalizador.

## Inbox

Inbox nao faz parte do core inicial da integracao real.

Estado atual:

- retirada da navegacao principal;
- nao foi implementada leitura real de Gmail;
- qualquer dado demo remanescente fica isolado da navegacao principal.

Ponto de revisao:

- confirmar que nao ha import de `demoSession` ou `demoData` em Auth/Home/Board/Files/Settings.

## Deep links esperados

OAuth mobile:

```text
planthings://oauth/callback?code=...&redirectTo=...
```

OAuth mobile web/Expo web:

```text
http://localhost:<porta-do-expo>/oauth/callback?code=...&redirectTo=...
```

Esse callback HTTP e somente para o preview web do app mobile no navegador. Em build nativo Android, o retorno correto continua sendo o scheme `planthings://`.

Settings/Gmail mobile:

```text
planthings://settings?section=integrations&gmail=connected
```

Pontos de verificacao:

- app instalado deve registrar o scheme `planthings`;
- `NavigationContainer` deve aceitar os prefixes;
- `AuthProvider` deve processar initial URL e eventos de URL;
- `AuthProvider` deve processar `window.location.href` em web preview quando o callback HTTP cair diretamente em `/oauth/callback`;
- `SettingsScreen` deve recarregar snapshot ao receber retorno de Gmail.

Armadilhas observadas:

- Em celular Android fisico, `localhost` no navegador e o proprio celular. Portanto `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/...` falha com `ERR_CONNECTION_REFUSED` apos escolher a conta. Usar IP acessivel do PC ou tunel publico e cadastrar exatamente essa URL no Google Cloud Console.
- Em navegador do proprio computador rodando o mobile web, `planthings://oauth/callback` nao e consumido pelo Expo web. Para esse cenario, usar `APP_OAUTH_MOBILE_CALLBACK_URL=http://localhost:<porta-do-expo>/oauth/callback`.

## Variaveis e script local

O arquivo local mencionado durante debug:

- `C:/Users/Arthur Fleming/OneDrive/Área de Trabalho/oauth_backend.ps1`

Contem variaveis uteis para rodar o backend local, incluindo:

- OAuth Google client id/secret;
- chave de token de integracao;
- URL JDBC;
- usuario e senha do SQL Server;
- comando `mvn clean spring-boot:run`.

Nao reproduzir segredos em logs, docs permanentes ou commits publicos.

## Validacoes ja executadas

Backend:

- `mvn -DskipTests compile`
  - passou.
- boot check usando variaveis do `oauth_backend.ps1`
  - Flyway validou 10 migrations;
  - V10 foi aplicada;
  - Tomcat iniciou;
  - aplicacao chegou em `Started PlanThingsApiApplication`.

Web:

- `npm --workspace apps/web run build`
  - passou.
- `npm --workspace apps/web run test:run src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx`
  - passou.

Mobile:

- `npm --workspace apps/mobile exec -- expo export --platform web --output-dir dist-check`
  - passou apos ajustes iniciais.
  - passou novamente apos a correcao de corrida no logout.
  - passou novamente apos suporte ao callback HTTP `/oauth/callback` no mobile web.
  - o diretorio temporario de export foi removido.

GitNexus:

- impactos foram rodados antes das alteracoes principais;
- `gitnexus_detect_changes(scope=all)` foi executado ao final;
- risco reportado como `CRITICAL`, esperado pelo escopo amplo da refatoracao cross-stack.

## Validacoes ainda pendentes ou manuais

Backend:

- OAuth start retorna URL valida para web e mobile em ambiente real;
- callback OAuth redireciona para URL correta conforme `client`;
- exchange OAuth mobile cria sessao valida;
- Gmail start/callback respeitam `client`;
- Gmail disconnect atualiza snapshot.

Mobile:

- bootstrap com sessao valida entra no app;
- bootstrap com token invalido limpa storage e volta para auth;
- logout em Settings limpa storage e nao volta automaticamente para Home apos respostas atrasadas;
- login e cadastro por e-mail/senha;
- Google OAuth em dispositivo/emulador real;
- Google OAuth no navegador do PC com `APP_OAUTH_MOBILE_CALLBACK_URL` apontando para `/oauth/callback`;
- placeholders Microsoft/Apple/telefone sem rede;
- listagem/criacao/abertura de planos;
- board persiste coluna/cartao/comentario/checklist;
- board move cartoes e mantem ordenacao esperada;
- board atribui membros e etiquetas reais;
- anexar arquivo por biblioteca;
- upload direto de arquivo para card;
- Files lista arquivos reais;
- Files upload/download/favorito/lixeira/restore/share/unshare;
- Settings carrega snapshot real;
- Settings persiste conta, preferencias, notificacoes, senha e workspace;
- Gmail retorna por deep link e atualiza estado visual.

Web:

- login OAuth web completo apos novo payload;
- Gmail web start/callback completo apos novo payload.

## Falhas/alertas conhecidos de validacao ampla

- `mvn test` nao foi usado como validacao final completa em algumas rodadas porque exige senha/configuracao de banco em variaveis de ambiente. Com o script local, o boot real foi validado.
- O smoke test amplo do web tinha falhas em calendario nao relacionadas ao contrato OAuth/Gmail alterado:
  - evento `Sync diario de produto` nao encontrado;
  - botao de calendario correspondente nao encontrado.
- `expo-doctor` reclamava que `.expo` nao estava ignorado porque arquivos `.expo` ja estavam rastreados em `apps/mobile`. Foram adicionados ignores, mas remover rastreamento existente exigiria decisao separada.

## Checklist para segundo agente

Contratos backend:

- revisar `AuthController.OAuthStartRequest`;
- revisar `OAuthLoginService.start`;
- revisar selecao de callback web/mobile;
- revisar persistencia de `client` em `OAuthLoginStateEntity`;
- revisar `SettingsController.GmailStartRequest`;
- revisar `GmailIntegrationService.startAuthorization`;
- revisar selecao de retorno Gmail web/mobile;
- revisar migration V10 em SQL Server.

Shared client:

- confirmar ausencia de APIs browser-only;
- confirmar exports consumiveis por web e mobile;
- confirmar normalizadores tolerantes a campos ausentes;
- confirmar mapeamento de datas/timezones.

Mobile:

- revisar `App.js` e linking config;
- revisar `AuthProvider` para initial URL, listener, callback HTTP web preview, `sessionRef` contra corrida de logout e storage;
- revisar `AppShell`/`BottomTabs` para preservacao visual;
- revisar `PlansProvider` contra endpoints reais;
- revisar `FilesProvider` contra endpoints reais;
- revisar `SettingsScreen` contra contrato real de settings;
- confirmar que `demoSession`/`demoData` nao participam do fluxo principal.

Web:

- confirmar payload `{ client: "web" }` em OAuth;
- confirmar payload `{ client: "web" }` em Gmail;
- confirmar que download/blob e Vite env seguem fora do pacote compartilhado.

Manual QA:

- rodar `oauth_backend.ps1`;
- rodar mobile com `EXPO_PUBLIC_API_BASE_URL` adequado;
- testar deep links no ambiente alvo;
- testar Google OAuth com redirect URI configurada no provider;
- para Android fisico, testar com `GOOGLE_OAUTH_REDIRECT_URI` acessivel pelo celular, nao `localhost`;
- para mobile web no navegador, testar com `APP_OAUTH_MOBILE_CALLBACK_URL=http://localhost:<porta-do-expo>/oauth/callback`;
- testar logout em Settings enquanto Settings ainda pode ter requests pendentes;
- testar Gmail OAuth com return URL mobile/web configurada.

## Comandos uteis

Backend compile:

```powershell
cd C:\Users\Arthur Fleming\plan-things-2\services\api
mvn -DskipTests compile
```

Backend local com env do script:

```powershell
& "C:\Users\Arthur Fleming\OneDrive\Área de Trabalho\oauth_backend.ps1"
```

Web build:

```powershell
cd C:\Users\Arthur Fleming\plan-things-2
npm --workspace apps/web run build
```

Mobile export check:

```powershell
cd C:\Users\Arthur Fleming\plan-things-2
npm --workspace apps/mobile exec -- expo export --platform web --output-dir dist-check
```

Teste Gmail settings web:

```powershell
cd C:\Users\Arthur Fleming\plan-things-2
npm --workspace apps/web run test:run src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx
```
