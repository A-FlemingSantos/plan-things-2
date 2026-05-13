Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'mvn'

Write-PlanThingsStep 'Configurando backend compartilhado para site web + mobile:web + Expo Go Android'
$webPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_WEB_PORT' -Prompt 'Porta do app web (npm run dev)' -Default '5173'
$expoWebPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_WEB_PORT' -Prompt 'Porta do Expo Web' -Default '8081'
Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'Senha do SQL Server (SPRING_DATASOURCE_PASSWORD)' -Secret

[Environment]::SetEnvironmentVariable('APP_CORS_ALLOWED_ORIGINS', "http://localhost:$expoWebPort,http://127.0.0.1:$expoWebPort,http://localhost:$webPort,http://127.0.0.1:$webPort", 'Process')
[Environment]::SetEnvironmentVariable('APP_OAUTH_MOBILE_WEB_CALLBACK_URL', "http://localhost:$expoWebPort/oauth/callback", 'Process')
[Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL', "http://localhost:$expoWebPort/settings", 'Process')

if (Use-PlanThingsOptionalGoogleSetup -Default $true) {
  $ngrokUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_NGROK_PUBLIC_URL' -Prompt 'URL publica do ngrok (ex.: https://seu-subdominio.ngrok-free.app)'
  $expoGoBaseUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_BASE_URL' -Prompt 'URL base atual do Expo Go (ex.: exp://192.168.1.109:8081)'

  Set-PlanThingsGoogleEnvVars
  [Environment]::SetEnvironmentVariable('GOOGLE_OAUTH_REDIRECT_URI', "$ngrokUrl/api/auth/oauth/google/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_REDIRECT_URI', "$ngrokUrl/api/settings/integrations/gmail/callback", 'Process')
  [Environment]::SetEnvironmentVariable('APP_OAUTH_MOBILE_CALLBACK_URL', "$expoGoBaseUrl/--/oauth/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_MOBILE_RETURN_URL', "$expoGoBaseUrl/--/settings", 'Process')
}

Write-PlanThingsStep 'Subindo o backend compartilhado em services/api'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
