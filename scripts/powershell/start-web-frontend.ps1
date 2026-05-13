Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot

Start-PlanThingsScript -Name 'start-web-frontend' -Target 'web app'
Assert-PlanThingsCommand -Name 'npm'

Write-PlanThingsConfig -Rows @(
  (New-PlanThingsConfigRow 'cwd' $repoRoot)
)
Write-PlanThingsRun -Command 'npm run dev'
Invoke-PlanThingsCommand -WorkingDirectory $repoRoot -FilePath 'npm' -Arguments @('run', 'dev')
