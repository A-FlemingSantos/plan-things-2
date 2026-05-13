Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Start-PlanThingsScript -Name 'start-web-backend' -Target 'web api'
Assert-PlanThingsCommand -Name 'mvn'

$null = Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'spring_db_password' -Secret
$googleOAuth = Use-PlanThingsOptionalGoogleSetup
if ($googleOAuth) {
  Set-PlanThingsGoogleEnvVars
}

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'web_port' '5173'),
  (New-PlanThingsConfigRow 'spring_db_password' 'loaded'),
  (New-PlanThingsConfigRow 'google_oauth' ($(if ($googleOAuth) { 'on' } else { 'off' })))
)
Write-PlanThingsRun -Command 'mvn spring-boot:run'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
