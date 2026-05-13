Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot

Start-PlanThingsScript -Name 'start-mobile-android-expo' -Target 'expo android'
Assert-PlanThingsCommand -Name 'npm'

$null = Set-PlanThingsEnvVar -Name 'EXPO_PUBLIC_API_BASE_URL' -Prompt 'api_base_url'
$apiBaseUrl = [Environment]::GetEnvironmentVariable('EXPO_PUBLIC_API_BASE_URL', 'Process')

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'api_base_url' $apiBaseUrl)
)
Write-PlanThingsRun -Command 'npm run mobile:android'
Invoke-PlanThingsCommand -WorkingDirectory $repoRoot -FilePath 'npm' -Arguments @('run', 'mobile:android')
