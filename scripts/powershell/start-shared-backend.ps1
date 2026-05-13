Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Start-PlanThingsScript -Name 'start-shared-backend' -Target 'web + mobile:web + expo android'
Assert-PlanThingsCommand -Name 'mvn'

$webPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_WEB_PORT' -Prompt 'web_port' -Default '5173' -UseDefaultIfMissing
$expoWebPort = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_WEB_PORT' -Prompt 'expo_web_port' -Default '8081' -UseDefaultIfMissing
$null = Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'spring_db_password' -Secret

[Environment]::SetEnvironmentVariable('APP_CORS_ALLOWED_ORIGINS', "http://localhost:$expoWebPort,http://127.0.0.1:$expoWebPort,http://localhost:$webPort,http://127.0.0.1:$webPort", 'Process')
[Environment]::SetEnvironmentVariable('APP_OAUTH_WEB_CALLBACK_URL', "http://localhost:$webPort/oauth/callback", 'Process')
[Environment]::SetEnvironmentVariable('APP_OAUTH_MOBILE_WEB_CALLBACK_URL', "http://localhost:$expoWebPort/oauth/callback", 'Process')
[Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_WEB_RETURN_URL', "http://localhost:$webPort/settings", 'Process')
[Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_MOBILE_WEB_RETURN_URL', "http://localhost:$expoWebPort/settings", 'Process')

$googleOAuth = Use-PlanThingsOptionalGoogleSetup -Default $true
$ngrokUrl = ''
$expoGoBaseUrl = ''

if ($googleOAuth) {
  $ngrokUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_NGROK_PUBLIC_URL' -Prompt 'ngrok_url'
  $expoGoBaseUrl = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_EXPO_GO_BASE_URL' -Prompt 'expo_go_base' -Default (Get-PlanThingsExpoGoBaseUrl) -UseDefaultIfMissing

  Set-PlanThingsGoogleEnvVars
  [Environment]::SetEnvironmentVariable('GOOGLE_OAUTH_REDIRECT_URI', "$ngrokUrl/api/auth/oauth/google/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_REDIRECT_URI', "$ngrokUrl/api/settings/integrations/gmail/callback", 'Process')
  [Environment]::SetEnvironmentVariable('APP_OAUTH_MOBILE_CALLBACK_URL', "$expoGoBaseUrl/--/oauth/callback", 'Process')
  [Environment]::SetEnvironmentVariable('GMAIL_INTEGRATION_MOBILE_RETURN_URL', "$expoGoBaseUrl/--/settings", 'Process')
}

$configRows = @(
  (New-PlanThingsConfigRow 'web_port' $webPort),
  (New-PlanThingsConfigRow 'expo_web_port' $expoWebPort),
  (New-PlanThingsConfigRow 'spring_db_password' 'loaded'),
  (New-PlanThingsConfigRow 'google_oauth' ($(if ($googleOAuth) { 'on' } else { 'off' })))
)

if ($googleOAuth) {
  $configRows += New-PlanThingsConfigRow 'expo_go_base' $expoGoBaseUrl
  $configRows += New-PlanThingsConfigRow 'ngrok_url' $ngrokUrl
}

$configRows += New-PlanThingsConfigRow 'web_callback' "http://localhost:$webPort/oauth/callback"
$configRows += New-PlanThingsConfigRow 'web_gmail_return' "http://localhost:$webPort/settings"
$configRows += New-PlanThingsConfigRow 'mobile_web_callback' "http://localhost:$expoWebPort/oauth/callback"
$configRows += New-PlanThingsConfigRow 'mobile_web_gmail' "http://localhost:$expoWebPort/settings"

Write-PlanThingsConfig -Rows $configRows
Write-PlanThingsRun -Command 'mvn spring-boot:run'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
