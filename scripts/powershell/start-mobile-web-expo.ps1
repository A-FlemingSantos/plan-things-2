Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot

Start-PlanThingsScript -Name 'start-mobile-web-expo' -Target 'mobile:web'
Assert-PlanThingsCommand -Name 'npm'

$apiBaseUrl = [Environment]::GetEnvironmentVariable('PLAN_THINGS_MOBILE_WEB_API_BASE_URL', 'Process')
if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
  $apiBaseUrl = Get-PlanThingsBackendBaseUrl
} else {
  $apiBaseUrl = Get-PlanThingsTrimmedUrl $apiBaseUrl
}

Set-PlanThingsProcessEnvVar -Name 'EXPO_PUBLIC_API_BASE_URL' -Value $apiBaseUrl

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'api_base_url' $apiBaseUrl)
)
Write-PlanThingsRun -Command 'npm run mobile:web'
Invoke-PlanThingsCommand -WorkingDirectory $repoRoot -FilePath 'npm' -Arguments @('run', 'mobile:web')
