Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$mobileRoot = Join-Path $repoRoot 'apps\mobile'

Start-PlanThingsScript -Name 'start-mobile-android-eas-build' -Target 'eas android build'
Assert-PlanThingsCommand -Name 'npx'

$profile = Set-PlanThingsEnvVar `
  -Name 'PLAN_THINGS_EAS_PROFILE' `
  -Prompt 'eas_profile' `
  -Default 'development' `
  -UseDefaultIfMissing

$profile = $profile.Trim().ToLowerInvariant()
$allowedProfiles = @('development', 'preview', 'production')
if ($allowedProfiles -notcontains $profile) {
  throw "Profile EAS invalido: $profile. Use development, preview ou production."
}

$null = Set-PlanThingsEnvVar -Name 'GOOGLE_OAUTH_CLIENT_ID' -Prompt 'google_oauth_client_id'
$googleWebClientId = [Environment]::GetEnvironmentVariable('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'Process')
if ([string]::IsNullOrWhiteSpace($googleWebClientId)) {
  $googleWebClientId = [Environment]::GetEnvironmentVariable('GOOGLE_OAUTH_CLIENT_ID', 'Process')
  Set-PlanThingsProcessEnvVar -Name 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID' -Value $googleWebClientId
}

$apiBaseUrl = [Environment]::GetEnvironmentVariable('EXPO_PUBLIC_API_BASE_URL', 'Process')
if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
  $apiBaseUrl = [Environment]::GetEnvironmentVariable('PLAN_THINGS_NGROK_PUBLIC_URL', 'Process')
}
if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
  $apiBaseUrl = Set-PlanThingsEnvVar -Name 'EXPO_PUBLIC_API_BASE_URL' -Prompt 'api_base_url'
}

$apiBaseUrl = Get-PlanThingsTrimmedUrl $apiBaseUrl
Set-PlanThingsProcessEnvVar -Name 'EXPO_PUBLIC_API_BASE_URL' -Value $apiBaseUrl

function Sync-PlanThingsEasEnvVar {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value,
    [Parameter(Mandatory = $true)][string]$Environment
  )

  Write-Host "Sync EAS env: $Name ($Environment)" -ForegroundColor DarkGray
  Invoke-PlanThingsCommand `
    -WorkingDirectory $mobileRoot `
    -FilePath 'npx' `
    -Arguments @(
      'eas-cli@latest', 'env:create',
      '--name', $Name,
      '--value', $Value,
      '--environment', $Environment,
      '--visibility', 'plaintext',
      '--force',
      '--non-interactive'
    )
}

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'eas_profile' $profile),
  (New-PlanThingsConfigRow 'api_base_url' $apiBaseUrl),
  (New-PlanThingsConfigRow 'google_web_client' $googleWebClientId)
)

Sync-PlanThingsEasEnvVar -Name 'EXPO_PUBLIC_API_BASE_URL' -Value $apiBaseUrl -Environment $profile
Sync-PlanThingsEasEnvVar -Name 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID' -Value $googleWebClientId -Environment $profile

Write-PlanThingsRun -Command "npx eas-cli@latest build --profile $profile --platform android"
Invoke-PlanThingsCommand `
  -WorkingDirectory $mobileRoot `
  -FilePath 'npx' `
  -Arguments @('eas-cli@latest', 'build', '--profile', $profile, '--platform', 'android')
