Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'npm'

Write-PlanThingsStep 'Subindo npm run mobile:web'
Invoke-PlanThingsCommand -WorkingDirectory $repoRoot -FilePath 'npm' -Arguments @('run', 'mobile:web')
