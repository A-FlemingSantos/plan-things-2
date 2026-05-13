Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'ngrok'

Write-PlanThingsStep 'Validando configuracao do ngrok'
& ngrok config check *> $null
if ($LASTEXITCODE -ne 0) {
  $token = Set-PlanThingsEnvVar -Name 'NGROK_AUTHTOKEN' -Prompt 'Ngrok authtoken' -Secret
  & ngrok config add-authtoken $token
}

Write-PlanThingsStep 'Subindo ngrok http 8080'
& ngrok http 8080
