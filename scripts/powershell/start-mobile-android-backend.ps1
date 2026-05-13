Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Start-PlanThingsScript -Name 'start-mobile-android-backend' -Target 'expo android api'
Assert-PlanThingsCommand -Name 'mvn'

$null = Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'spring_db_password' -Secret

$googleOAuth = Use-PlanThingsOptionalGoogleSetup -Default $true
$ngrokUrl = ''
$expoGoBaseUrl = ''

if ($googleOAuth) {
  $ngrokUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_NGROK_PUBLIC_URL' -Prompt 'ngrok_url'
  $expoGoBaseUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_BASE_URL' -Prompt 'expo_go_base' -Default (Get-PlanThingsExpoGoBaseUrl) -UseDefaultIfMissing

  Set-PlanThingsGoogleEnvVars
  [Environment]::SetEnvironmentVariable('GOOGLE_OAUTH_REDIRECT_URI', "$ngrokUrl/api/auth/oauth/google/callback", 'Process')
  [Environment]::SetEnvironmentVariable('APP_OAUTH_MOBILE_CALLBACK_URL', "$expoGoBaseUrl/--/oauth/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_REDIRECT_URI', "$ngrokUrl/api/settings/integrations/gmail/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_MOBILE_RETURN_URL', "$expoGoBaseUrl/--/settings", 'Process')
}

$configRows = @(
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
