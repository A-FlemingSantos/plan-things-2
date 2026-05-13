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

function ConvertTo-PlainText {
  param(
    [Parameter(Mandatory = $true)]
    [Security.SecureString]$SecureValue
  )

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    if ($ptr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
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
      if ([string]::IsNullOrEmpty($Default)) {
        $secureValue = Read-Host "$Prompt (entrada oculta)"
      } else {
        $secureValue = Read-Host "$Prompt (entrada oculta; Enter usa o valor atual)"
      }

      if ($secureValue.Length -eq 0) {
        if (-not [string]::IsNullOrEmpty($Default)) {
          return $Default
        }

        Write-Warning 'Valor obrigatorio. Tente novamente.'
        continue
      }

      return (ConvertTo-PlainText -SecureValue $secureValue)
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
    [switch]$Secret
  )

  $current = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if (-not [string]::IsNullOrWhiteSpace($current)) {
    Write-Host "$Name ja definido no ambiente atual." -ForegroundColor DarkGray
    return $current
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
