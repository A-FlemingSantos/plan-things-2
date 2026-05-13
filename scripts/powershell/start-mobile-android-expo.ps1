Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$mobileRoot = Join-Path $repoRoot 'apps\\mobile'

Start-PlanThingsScript -Name 'start-mobile-android-expo' -Target 'expo android'
Assert-PlanThingsCommand -Name 'npx'

$expoGoPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_PORT' -Prompt 'expo_go_port' -Default '8082' -UseDefaultIfMissing

$apiBaseUrl = [Environment]::GetEnvironmentVariable('PLAN_THINGS_ANDROID_API_BASE_URL', 'Process')
if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
  $apiBaseUrl = [Environment]::GetEnvironmentVariable('PLAN_THINGS_NGROK_PUBLIC_URL', 'Process')
}

if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
  $apiBaseUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_ANDROID_API_BASE_URL' -Prompt 'api_base_url'
}

$apiBaseUrl = Get-PlanThingsTrimmedUrl $apiBaseUrl
Set-PlanThingsProcessEnvVar -Name 'EXPO_PUBLIC_API_BASE_URL' -Value $apiBaseUrl

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'expo_go_port' $expoGoPort),
  (New-PlanThingsConfigRow 'api_base_url' $apiBaseUrl)
)
Write-PlanThingsRun -Command "npx expo start --port $expoGoPort"
Invoke-PlanThingsCommand -WorkingDirectory $mobileRoot -FilePath 'npx' -Arguments @('expo', 'start', '--port', $expoGoPort)
