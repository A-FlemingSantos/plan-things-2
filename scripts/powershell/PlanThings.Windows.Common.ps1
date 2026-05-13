Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-PlanThingsRepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

function Write-PlanThingsStep {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  Write-Host ''
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-PlanThingsCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando obrigatorio nao encontrado no PATH: $Name"
  }
}

function Read-PlanThingsValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Prompt,
    [string]$Default,
    [switch]$Secret
  )

  while ($true) {
    if ($Secret) {
      $suffix = if ([string]::IsNullOrEmpty($Default)) { '' } else { ' [Enter usa o valor atual]' }
      $value = Read-Host "$Prompt$suffix"

      if ([string]::IsNullOrWhiteSpace($value)) {
        if (-not [string]::IsNullOrEmpty($Default)) {
          return $Default
        }

        Write-Warning 'Valor obrigatorio. Tente novamente.'
        continue
      }

      return $value.Trim()
    }

    $suffix = if ([string]::IsNullOrEmpty($Default)) { '' } else { " [$Default]" }
    $value = Read-Host ($Prompt + $suffix)

    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $value.Trim()
    }

    if (-not [string]::IsNullOrEmpty($Default)) {
      return $Default
    }

    Write-Warning 'Valor obrigatorio. Tente novamente.'
  }
}

function Set-PlanThingsEnvVar {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Prompt,
    [string]$Default,
    [switch]$Secret,
    [switch]$UseDefaultIfMissing
  )

  $current = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if (-not [string]::IsNullOrWhiteSpace($current)) {
    Write-Host "$Name ja definido no ambiente atual." -ForegroundColor DarkGray
    return $current
  }

  if ($UseDefaultIfMissing -and -not [string]::IsNullOrEmpty($Default)) {
    [Environment]::SetEnvironmentVariable($Name, $Default, 'Process')
    Write-Host "$Name usando padrao $Default." -ForegroundColor DarkGray
    return $Default
  }

  $value = Read-PlanThingsValue -Prompt $Prompt -Default $Default -Secret:$Secret
  [Environment]::SetEnvironmentVariable($Name, $value, 'Process')
  return $value
}

function Use-PlanThingsOptionalGoogleSetup {
  param(
    [bool]$Default = $false
  )

  $defaultLabel = if ($Default) { 'S/n' } else { 's/N' }
  $answer = Read-Host "Configurar Google OAuth/Gmail agora? [$defaultLabel]"

  if ([string]::IsNullOrWhiteSpace($answer)) {
    return $Default
  }

  return $answer.Trim().ToLowerInvariant().StartsWith('s')
}

function Set-PlanThingsGoogleEnvVars {
  Set-PlanThingsEnvVar -Name 'GOOGLE_OAUTH_CLIENT_ID' -Prompt 'Google OAuth Client ID'
  Set-PlanThingsEnvVar -Name 'GOOGLE_OAUTH_CLIENT_SECRET' -Prompt 'Google OAuth Client Secret' -Secret
  Set-PlanThingsEnvVar -Name 'APP_INTEGRATION_TOKEN_KEY_B64' -Prompt 'APP_INTEGRATION_TOKEN_KEY_B64' -Secret
}

function Invoke-PlanThingsCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory,
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$Arguments = @()
  )

  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
  } finally {
    Pop-Location
  }
}
