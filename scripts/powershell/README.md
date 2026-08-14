# PowerShell scripts (Windows)

Scripts prontos para os cenarios locais mais comuns:

- `start-web-backend.ps1`: backend local para usar com `npm run dev`
- `start-web-frontend.ps1`: roda `npm run dev`
- `start-mobile-web-backend.ps1`: backend para `mobile:web`
- `start-mobile-web-expo.ps1`: roda `npm run mobile:web`
- `start-mobile-android-ngrok.ps1`: sobe `ngrok http 8080`
- `start-mobile-android-expo.ps1`: roda o Metro do app Android em `apps/mobile`
- `start-mobile-android-backend.ps1`: backend para Android via Expo Go ou development build
- `start-mobile-android-eas-build.ps1`: dispara `eas build` Android (profiles `development` / `preview` / `production`)
- `start-shared-backend.ps1`: backend unico para site web + `mobile:web` + Android

Todos pedem apenas o que faltar no ambiente atual.

Use `$env:PLAN_THINGS_ANDROID_CLIENT="dev-build"` para development build (padrao) ou
`$env:PLAN_THINGS_ANDROID_CLIENT="expo-go"` para Expo Go.

Para EAS, use `$env:PLAN_THINGS_EAS_PROFILE="development"` (padrao do script de build)
ou `preview` / `production`. O script sincroniza `EXPO_PUBLIC_API_BASE_URL` e
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` no environment EAS correspondente (via `eas env:create`)
antes de disparar o build remoto.

No modo Expo Go, informe `PLAN_THINGS_EXPO_GO_BASE_URL` como a URL base exata
`exp://...` mostrada pelo Expo. Os scripts passam essa base ao backend; o
backend deriva `/--/oauth/callback` e `/--/settings` sem quebrar query string
do tunnel.

No modo development build (padrao), os scripts usam `planthings://oauth/callback` e
`planthings://settings`, e o Metro sobe com `--dev-client`.

No modo Expo Go, o Metro sobe com `--go`.

Segredos locais ficam em `local.secrets.ps1`. Variaveis ja definidas no
processo atual tem prioridade sobre esse arquivo local.

Exemplos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\powershell\start-web-backend.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\powershell\start-web-frontend.ps1
```
