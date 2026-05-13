Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'npm'

Write-PlanThingsStep 'Subindo npm run dev na raiz'
Invoke-PlanThingsCommand -WorkingDirectory $repoRoot -FilePath 'npm' -Arguments @('run', 'dev')
