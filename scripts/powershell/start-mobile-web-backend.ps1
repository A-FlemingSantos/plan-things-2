Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Start-PlanThingsScript -Name 'start-mobile-web-backend' -Target 'mobile:web api'
Assert-PlanThingsCommand -Name 'mvn'

$expoWebPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_WEB_PORT' -Prompt 'expo_web_port' -Default '8081' -UseDefaultIfMissing
$webPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_WEB_PORT' -Prompt 'web_port' -Default '5173' -UseDefaultIfMissing
$null = Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'spring_db_password' -Secret
$backendBaseUrl = Get-PlanThingsBackendBaseUrl

Set-PlanThingsProcessEnvVar -Name 'APP_CORS_ALLOWED_ORIGINS' -Value "http://localhost:$expoWebPort,http://127.0.0.1:$expoWebPort,http://localhost:$webPort,http://127.0.0.1:$webPort"
Set-PlanThingsProcessEnvVar -Name 'APP_OAUTH_WEB_CALLBACK_URL' -Value "http://localhost:$webPort/oauth/callback"
Set-PlanThingsProcessEnvVar -Name 'APP_OAUTH_MOBILE_WEB_CALLBACK_URL' -Value "http://localhost:$expoWebPort/oauth/callback"
Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_WEB_RETURN_URL' -Value "http://localhost:$webPort/settings"
Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL' -Value "http://localhost:$expoWebPort/settings"
Set-PlanThingsProcessEnvVar -Name 'GOOGLE_OAUTH_REDIRECT_URI' -Value "$backendBaseUrl/api/auth/oauth/google/callback"
Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_REDIRECT_URI' -Value "$backendBaseUrl/api/settings/integrations/gmail/callback"

Clear-PlanThingsEnvVars -Names @(
  'APP_OAUTH_MOBILE_CALLBACK_URL',
  'GMAIL_INTEGRATION_MOBILE_RETURN_URL'
)

$googleOAuth = Use-PlanThingsOptionalGoogleSetup -Default $true
if ($googleOAuth) {
  Set-PlanThingsGoogleEnvVars
}

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'web_port' $webPort),
  (New-PlanThingsConfigRow 'expo_web_port' $expoWebPort),
  (New-PlanThingsConfigRow 'web_callback' "http://localhost:$webPort/oauth/callback"),
  (New-PlanThingsConfigRow 'web_gmail_return' "http://localhost:$webPort/settings"),
  (New-PlanThingsConfigRow 'mobile_web_callback' "http://localhost:$expoWebPort/oauth/callback"),
  (New-PlanThingsConfigRow 'mobile_web_gmail' "http://localhost:$expoWebPort/settings"),
  (New-PlanThingsConfigRow 'spring_db_password' 'loaded'),
  (New-PlanThingsConfigRow 'google_oauth' ($(if ($googleOAuth) { 'on' } else { 'off' })))
)
Write-PlanThingsRun -Command 'mvn spring-boot:run'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
