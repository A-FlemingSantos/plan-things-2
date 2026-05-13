Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'mvn'

Write-PlanThingsStep 'Configurando backend para Expo Go Android'
$null = Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'Senha do SQL Server (SPRING_DATASOURCE_PASSWORD)' -Secret

if (Use-PlanThingsOptionalGoogleSetup -Default $true) {
  $ngrokUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_NGROK_PUBLIC_URL' -Prompt 'URL publica do ngrok (ex.: https://seu-subdominio.ngrok-free.app)'
  $expoGoBaseUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_BASE_URL' -Prompt 'URL base atual do Expo Go (ex.: exp://192.168.1.109:8081)' -Default (Get-PlanThingsExpoGoBaseUrl) -UseDefaultIfMissing

  Set-PlanThingsGoogleEnvVars
  [Environment]::SetEnvironmentVariable('GOOGLE_OAUTH_REDIRECT_URI', "$ngrokUrl/api/auth/oauth/google/callback", 'Process')
  [Environment]::SetEnvironmentVariable('APP_OAUTH_MOBILE_CALLBACK_URL', "$expoGoBaseUrl/--/oauth/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_REDIRECT_URI', "$ngrokUrl/api/settings/integrations/gmail/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_MOBILE_RETURN_URL', "$expoGoBaseUrl/--/settings", 'Process')
}

Write-PlanThingsStep 'Subindo o backend em services/api'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
