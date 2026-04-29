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

Tambem funciona iniciar com `npm run mobile:start` e pressionar `w` no terminal do Expo.

Se quiser abrir automaticamente em um emulador ou dispositivo via cabo, configure o Android SDK e `ANDROID_HOME`, garanta que `adb` esteja no `PATH`, e rode:

```sh
npm run mobile:android:device
```

## Estado atual

Este app é demo-first. Login e cadastro entram no app em modo de desenvolvimento e as telas usam dados locais inspirados no app web. Nenhuma chamada à API real é feita nesta primeira base.
