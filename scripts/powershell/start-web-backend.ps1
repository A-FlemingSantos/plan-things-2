Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Start-PlanThingsScript -Name 'start-web-backend' -Target 'web api'
Assert-PlanThingsCommand -Name 'mvn'

$webPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_WEB_PORT' -Prompt 'web_port' -Default '5173' -UseDefaultIfMissing
$null = Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'spring_db_password' -Secret
[Environment]::SetEnvironmentVariable('APP_OAUTH_WEB_CALLBACK_URL', "http://localhost:$webPort/oauth/callback", 'Process')
[Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_WEB_RETURN_URL', "http://localhost:$webPort/settings", 'Process')
$googleOAuth = Use-PlanThingsOptionalGoogleSetup
if ($googleOAuth) {
  Set-PlanThingsGoogleEnvVars
}

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'web_port' $webPort),
  (New-PlanThingsConfigRow 'web_callback' "http://localhost:$webPort/oauth/callback"),
  (New-PlanThingsConfigRow 'web_gmail_return' "http://localhost:$webPort/settings"),
  (New-PlanThingsConfigRow 'spring_db_password' 'loaded'),
  (New-PlanThingsConfigRow 'google_oauth' ($(if ($googleOAuth) { 'on' } else { 'off' })))
)
Write-PlanThingsRun -Command 'mvn spring-boot:run'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
