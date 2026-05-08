# Plan Things Mobile

Base mobile demo-first em React Native/Expo para acompanhamento pontual de tarefas e comunicação simples.

## Stack

- Expo SDK 52.0.49
- React 18.3.1
- React Native 0.76.9

Essas versões preservam compatibilidade com o app web em React 18. Evite atualizar para SDKs que puxem React Native com peer de React 19 sem validar o monorepo inteiro.

## Como rodar

Instale as dependências a partir da raiz do repositório:

```sh
npm install
```

Inicie o Expo:

```sh
npm run mobile:start
```

Para Android com Expo Go, inicie o servidor e leia o QR Code no celular:

```sh
npm run mobile:android
```

Esse comando nao exige Android SDK nem `adb`; ele apenas abre o Metro/Expo para o Expo Go.

Para visualizar no navegador:

```sh
npm run mobile:web
```

## Google OAuth no `mobile:web` (preview no navegador)

Se voce rodar o app mobile no navegador (`npm run mobile:web`) e tentar entrar/cadastrar com Google, o fluxo precisa voltar para um callback HTTP (ex.: `http://localhost:8081/oauth/callback`).

Quando o backend esta com a configuracao padrao, ele redireciona o retorno do Google para o deep link nativo `planthings://oauth/callback`.
No navegador isso falha com erro do tipo:

```text
Failed to launch 'planthings://oauth/callback?...' because the scheme does not have a registered handler.
```

### O que configurar

- No backend (`services/api`): defina `APP_OAUTH_MOBILE_CALLBACK_URL` apontando para a URL do Expo web.
- No app mobile (Expo): garanta que o app aponte para o backend correto via `EXPO_PUBLIC_API_BASE_URL` (se necessario).

Exemplo (Linux/macOS), assumindo Expo web em `8081` e backend em `8080`:

```sh
export APP_OAUTH_MOBILE_CALLBACK_URL="http://localhost:8081/oauth/callback"

# (se estiver rodando o backend local)
cd services/api
mvn spring-boot:run

# em outro terminal, rodar o mobile web apontando para o backend
cd ../../
EXPO_PUBLIC_API_BASE_URL="http://localhost:8080" npm run mobile:web
```

Observacoes:

- A porta do Expo web pode variar; use a URL exibida pelo `expo start --web`/`npx expo start --web`.
- Em Android nativo (Expo Go/app instalado), o retorno esperado continua sendo `planthings://oauth/callback`.

Tambem funciona iniciar com `npm run mobile:start` e pressionar `w` no terminal do Expo.

Se quiser abrir automaticamente em um emulador ou dispositivo via cabo, configure o Android SDK e `ANDROID_HOME`, garanta que `adb` esteja no `PATH`, e rode:

```sh
npm run mobile:android:device
```

## Estado atual

Este app é demo-first. Login e cadastro entram no app em modo de desenvolvimento e as telas usam dados locais inspirados no app web. Nenhuma chamada à API real é feita nesta primeira base.
