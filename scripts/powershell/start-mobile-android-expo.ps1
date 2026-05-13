Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'npm'

Write-PlanThingsStep 'Configurando Expo Go Android'
$null = Set-PlanThingsEnvVar -Name 'EXPO_PUBLIC_API_BASE_URL' -Prompt 'URL publica da API (ex.: https://seu-subdominio.ngrok-free.app)'

Write-PlanThingsStep 'Subindo npm run mobile:android'
Invoke-PlanThingsCommand -WorkingDirectory $repoRoot -FilePath 'npm' -Arguments @('run', 'mobile:android')
