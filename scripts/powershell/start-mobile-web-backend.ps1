Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'mvn'

Write-PlanThingsStep 'Configurando backend para mobile:web'
$expoWebPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_WEB_PORT' -Prompt 'Porta do Expo Web' -Default '8081'
$webPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_WEB_PORT' -Prompt 'Porta do app web (npm run dev)' -Default '5173'

Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'Senha do SQL Server (SPRING_DATASOURCE_PASSWORD)' -Secret
[Environment]::SetEnvironmentVariable('APP_OAUTH_MOBILE_CALLBACK_URL', "http://localhost:$expoWebPort/oauth/callback", 'Process')
[Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_MOBILE_RETURN_URL', "http://localhost:$expoWebPort/settings", 'Process')
[Environment]::SetEnvironmentVariable('APP_CORS_ALLOWED_ORIGINS', "http://localhost:$expoWebPort,http://127.0.0.1:$expoWebPort,http://localhost:$webPort,http://127.0.0.1:$webPort", 'Process')

if (Use-PlanThingsOptionalGoogleSetup -Default $true) {
  Set-PlanThingsGoogleEnvVars
}

Write-PlanThingsStep 'Subindo o backend em services/api'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
