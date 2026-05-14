Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Start-PlanThingsScript -Name 'start-shared-backend' -Target 'web + mobile:web + expo android'
Assert-PlanThingsCommand -Name 'mvn'

$webPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_WEB_PORT' -Prompt 'web_port' -Default '5173' -UseDefaultIfMissing
$expoWebPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_WEB_PORT' -Prompt 'expo_web_port' -Default '8081' -UseDefaultIfMissing
$expoGoPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_PORT' -Prompt 'expo_go_port' -Default '8082' -UseDefaultIfMissing
$androidClient = Set-PlanThingsAndroidClientEnvVar
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
$ngrokUrl = ''
$expoGoBaseUrl = ''
$mobileOAuthReturnUrl = ''
$mobileGmailReturnUrl = ''

if ($googleOAuth) {
  $ngrokUrl = Get-PlanThingsTrimmedUrl (Set-PlanThingsEnvVar -Name 'PLAN_THINGS_NGROK_PUBLIC_URL' -Prompt 'ngrok_url')

  Set-PlanThingsGoogleEnvVars
  Set-PlanThingsProcessEnvVar -Name 'GOOGLE_OAUTH_REDIRECT_URI' -Value "$ngrokUrl/api/auth/oauth/google/callback"
  Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_REDIRECT_URI' -Value "$ngrokUrl/api/settings/integrations/gmail/callback"

  if ($androidClient -eq 'dev-build') {
    $mobileOAuthReturnUrl = 'planthings://oauth/callback'
    $mobileGmailReturnUrl = 'planthings://settings'
  } else {
    $expoGoBaseUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_BASE_URL' -Prompt 'expo_go_base' -Default (Get-PlanThingsExpoGoBaseUrl) -UseDefaultIfMissing
    $expoGoBaseUrl = Get-PlanThingsTrimmedUrl $expoGoBaseUrl
    $mobileOAuthReturnUrl = $expoGoBaseUrl
    $mobileGmailReturnUrl = $expoGoBaseUrl
  }

  Set-PlanThingsProcessEnvVar -Name 'APP_OAUTH_MOBILE_CALLBACK_URL' -Value $mobileOAuthReturnUrl
  Set-PlanThingsProcessEnvVar -Name 'GMAIL_INTEGRATION_MOBILE_RETURN_URL' -Value $mobileGmailReturnUrl
}

$configRows = @(
  (New-PlanThingsConfigRow 'web_port' $webPort),
  (New-PlanThingsConfigRow 'expo_web_port' $expoWebPort),
  (New-PlanThingsConfigRow 'expo_go_port' $expoGoPort),
  (New-PlanThingsConfigRow 'android_client' $androidClient),
  (New-PlanThingsConfigRow 'spring_db_password' 'loaded'),
  (New-PlanThingsConfigRow 'google_oauth' ($(if ($googleOAuth) { 'on' } else { 'off' })))
)

if ($googleOAuth) {
  $configRows += New-PlanThingsConfigRow 'ngrok_url' $ngrokUrl
  $configRows += New-PlanThingsConfigRow 'oauth_mobile' $mobileOAuthReturnUrl
  $configRows += New-PlanThingsConfigRow 'gmail_mobile' $mobileGmailReturnUrl
}

$configRows += New-PlanThingsConfigRow 'web_callback' "http://localhost:$webPort/oauth/callback"
$configRows += New-PlanThingsConfigRow 'web_gmail_return' "http://localhost:$webPort/settings"
$configRows += New-PlanThingsConfigRow 'mobile_web_callback' "http://localhost:$expoWebPort/oauth/callback"
$configRows += New-PlanThingsConfigRow 'mobile_web_gmail' "http://localhost:$expoWebPort/settings"

Write-PlanThingsConfig -Rows $configRows
Write-PlanThingsRun -Command 'mvn spring-boot:run'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
