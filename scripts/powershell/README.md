# PowerShell scripts (Windows)

Scripts prontos para os cenarios locais mais comuns:

- `start-web-backend.ps1`: backend local para usar com `npm run dev`
- `start-web-frontend.ps1`: roda `npm run dev`
- `start-mobile-web-backend.ps1`: backend para `mobile:web`
- `start-mobile-web-expo.ps1`: roda `npm run mobile:web`
- `start-mobile-android-ngrok.ps1`: sobe `ngrok http 8080`
- `start-mobile-android-expo.ps1`: roda `npm run mobile:android`
- `start-mobile-android-backend.ps1`: backend para Expo Go Android
- `start-shared-backend.ps1`: backend unico para site web + `mobile:web` + Expo Go Android

Todos pedem apenas o que faltar no ambiente atual.

Exemplos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\powershell\start-web-backend.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\powershell\start-web-frontend.ps1
```
