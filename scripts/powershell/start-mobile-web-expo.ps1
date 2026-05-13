Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiBaseUrl = [Environment]::GetEnvironmentVariable('EXPO_PUBLIC_API_BASE_URL', 'Process')
if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
  $apiBaseUrl = 'http://localhost:8080'
}

Start-PlanThingsScript -Name 'start-mobile-web-expo' -Target 'mobile:web'
Assert-PlanThingsCommand -Name 'npm'

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'api_base_url' $apiBaseUrl)
)
Write-PlanThingsRun -Command 'npm run mobile:web'
Invoke-PlanThingsCommand -WorkingDirectory $repoRoot -FilePath 'npm' -Arguments @('run', 'mobile:web')
