Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

Start-PlanThingsScript -Name 'start-mobile-android-ngrok' -Target 'ngrok tunnel'
Assert-PlanThingsCommand -Name 'ngrok'

& ngrok config check *> $null
if ($LASTEXITCODE -ne 0) {
  $token = Set-PlanThingsEnvVar -Name 'NGROK_AUTHTOKEN' -Prompt 'ngrok_authtoken' -Secret
  & ngrok config add-authtoken $token
}

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'port' '8080'),
  (New-PlanThingsConfigRow 'ngrok_authtoken' 'loaded')
)
Write-PlanThingsRun -Command 'ngrok http 8080'
& ngrok http 8080
