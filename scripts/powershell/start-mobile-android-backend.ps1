Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Start-PlanThingsScript -Name 'start-mobile-android-backend' -Target 'expo android api'
Assert-PlanThingsCommand -Name 'mvn'

$expoGoPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_PORT' -Prompt 'expo_go_port' -Default '8082' -UseDefaultIfMissing
$null = Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'spring_db_password' -Secret
$backendBaseUrl = Get-PlanThingsBackendBaseUrl

Set-PlanThingsProcessEnvVar -Name 'GOOGLE_OAUTH_REDIRECT_URI' -Value "$backendBaseUrl/api/auth/oauth/google/callback"
Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_REDIRECT_URI' -Value "$backendBaseUrl/api/settings/integrations/gmail/callback"

Clear-PlanThingsEnvVars -Names @(
  'APP_CORS_ALLOWED_ORIGINS',
  'APP_OAUTH_WEB_CALLBACK_URL',
  'APP_OAUTH_MOBILE_WEB_CALLBACK_URL',
  'GMAIL_INTEGRATION_WEB_RETURN_URL',
  'GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL',
  'APP_OAUTH_MOBILE_CALLBACK_URL',
  'GMAIL_INTEGRATION_MOBILE_RETURN_URL'
)

$googleOAuth = Use-PlanThingsOptionalGoogleSetup -Default $true
$ngrokUrl = ''
$expoGoBaseUrl = ''

if ($googleOAuth) {
  $ngrokUrl = Get-PlanThingsTrimmedUrl (Set-PlanThingsEnvVar -Name 'PLAN_THINGS_NGROK_PUBLIC_URL' -Prompt 'ngrok_url')
  $expoGoBaseUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_BASE_URL' -Prompt 'expo_go_base' -Default (Get-PlanThingsExpoGoBaseUrl) -UseDefaultIfMissing
  $expoGoBaseUrl = Get-PlanThingsTrimmedUrl $expoGoBaseUrl

  Set-PlanThingsGoogleEnvVars
  Set-PlanThingsProcessEnvVar -Name 'GOOGLE_OAUTH_REDIRECT_URI' -Value "$ngrokUrl/api/auth/oauth/google/callback"
  Set-PlanThingsProcessEnvVar -Name 'APP_OAUTH_MOBILE_CALLBACK_URL' -Value "$expoGoBaseUrl/--/oauth/callback"
  Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_REDIRECT_URI' -Value "$ngrokUrl/api/settings/integrations/gmail/callback"
  Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_MOBILE_RETURN_URL' -Value "$expoGoBaseUrl/--/settings"
}

$configRows = @(
  (New-PlanThingsConfigRow 'expo_go_port' $expoGoPort),
  (New-PlanThingsConfigRow 'spring_db_password' 'loaded'),
  (New-PlanThingsConfigRow 'google_oauth' ($(if ($googleOAuth) { 'on' } else { 'off' })))
)

if ($googleOAuth) {
  $configRows += New-PlanThingsConfigRow 'expo_go_base' $expoGoBaseUrl
  $configRows += New-PlanThingsConfigRow 'ngrok_url' $ngrokUrl
  $configRows += New-PlanThingsConfigRow 'oauth_callback' "$expoGoBaseUrl/--/oauth/callback"
  $configRows += New-PlanThingsConfigRow 'gmail_return' "$expoGoBaseUrl/--/settings"
}

Write-PlanThingsConfig -Rows $configRows
Write-PlanThingsRun -Command 'mvn spring-boot:run'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
