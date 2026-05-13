Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'PlanThings.Windows.Common.ps1')

$repoRoot = Get-PlanThingsRepoRoot
$apiRoot = Join-Path $repoRoot 'services\api'

Write-PlanThingsStep 'Validando ferramentas'
Assert-PlanThingsCommand -Name 'mvn'

Write-PlanThingsStep 'Configurando backend local para npm run dev'
Set-PlanThingsEnvVar -Name 'SPRING_DATASOURCE_PASSWORD' -Prompt 'Senha do SQL Server (SPRING_DATASOURCE_PASSWORD)' -Secret

if (Use-PlanThingsOptionalGoogleSetup) {
  Set-PlanThingsGoogleEnvVars
}

Write-PlanThingsStep 'Subindo o backend em services/api'
Invoke-PlanThingsCommand -WorkingDirectory $apiRoot -FilePath 'mvn' -Arguments @('spring-boot:run')
