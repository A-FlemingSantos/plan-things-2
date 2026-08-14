Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:PlanThingsInputShown = $false

function Import-PlanThingsLocalSecrets {
  $localSecretsPath = Join-Path $PSScriptRoot 'local.secrets.ps1'
  $originalEnvironment = @{}

  foreach ($entry in [Environment]::GetEnvironmentVariables('Process').GetEnumerator()) {
    $originalEnvironment[$entry.Key] = $entry.Value
  }

  if (Test-Path $localSecretsPath) {
    . $localSecretsPath
  }

  foreach ($name in $originalEnvironment.Keys) {
    if ([Environment]::GetEnvironmentVariable($name, 'Process') -ne $originalEnvironment[$name]) {
      [Environment]::SetEnvironmentVariable($name, $originalEnvironment[$name], 'Process')
    }
  }
}

function Get-PlanThingsRepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

function Get-PlanThingsLocalIPv4 {
  $route = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
    Sort-Object RouteMetric, ifMetric |
    Select-Object -First 1

  if ($null -ne $route) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue |
      Where-Object {
        $_.IPAddress -and
        $_.IPAddress -notlike '169.254.*' -and
        $_.IPAddress -ne '127.0.0.1'
      } |
      Select-Object -ExpandProperty IPAddress -First 1

    if (-not [string]::IsNullOrWhiteSpace($ip)) {
      return $ip
    }
  }

  $fallbackIp = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
    Where-Object {
      $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
      $_.IPAddressToString -notlike '169.254.*' -and
      $_.IPAddressToString -ne '127.0.0.1'
    } |
    Select-Object -ExpandProperty IPAddressToString -First 1

  if (-not [string]::IsNullOrWhiteSpace($fallbackIp)) {
    return $fallbackIp
  }

  throw 'Nao foi possivel detectar automaticamente o IPv4 local desta maquina.'
}

function Get-PlanThingsExpoGoBaseUrl {
  $expoGoPort = [Environment]::GetEnvironmentVariable('PLAN_THINGS_EXPO_GO_PORT', 'Process')
  if ([string]::IsNullOrWhiteSpace($expoGoPort)) {
    $expoGoPort = '8082'
  }

  return "exp://$(Get-PlanThingsLocalIPv4):$expoGoPort"
}

function Get-PlanThingsBackendBaseUrl {
  return 'http://localhost:8080'
}

function Get-PlanThingsAndroidClient {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $normalizedValue = $Value.Trim().ToLowerInvariant()
  switch ($normalizedValue) {
    'expo' { return 'expo-go' }
    'expo-go' { return 'expo-go' }
    'go' { return 'expo-go' }
    'dev' { return 'dev-build' }
    'dev-build' { return 'dev-build' }
    'development-build' { return 'dev-build' }
  }

  throw "Cliente Android invalido: $Value. Use expo-go ou dev-build."
}

function Set-PlanThingsAndroidClientEnvVar {
  $androidClient = Set-PlanThingsEnvVar -Name 'PLAN_THINGS_ANDROID_CLIENT' -Prompt 'android_client' -Default 'dev-build' -UseDefaultIfMissing
  $androidClient = Get-PlanThingsAndroidClient -Value $androidClient
  Set-PlanThingsProcessEnvVar -Name 'PLAN_THINGS_ANDROID_CLIENT' -Value $androidClient
  return $androidClient
}

function Get-PlanThingsTrimmedUrl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  return $Url.Trim().TrimEnd('/')
}

function Start-PlanThingsScript {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Target
  )

  Write-Host ''
  Write-Host "[$Name]  $Target" -ForegroundColor Cyan
  Write-Host ''
  $script:PlanThingsInputShown = $false
}

function Show-PlanThingsInputHeader {
  if (-not $script:PlanThingsInputShown) {
    Write-Host 'input'
    $script:PlanThingsInputShown = $true
  }
}

function New-PlanThingsConfigRow {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Key,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  return [pscustomobject]@{
    Key = $Key
    Value = $Value
  }
}

function Write-PlanThingsConfig {
  param(
    [Parameter(Mandatory = $true)]
    [object[]]$Rows
  )

  if ($Rows.Count -eq 0) {
    return
  }

  if ($script:PlanThingsInputShown) {
    Write-Host ''
  }

  Write-Host 'config'
  foreach ($row in $Rows) {
    Write-Host ("  {0,-20} {1}" -f $row.Key, $row.Value)
  }
  Write-Host ''
}

function Write-PlanThingsRun {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command
  )

  Write-Host 'run'
  Write-Host "  $Command"
  Write-Host ''
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
    Show-PlanThingsInputHeader
    if ($Secret) {
      $suffix = if ([string]::IsNullOrEmpty($Default)) { '' } else { ' [Enter usa o valor atual]' }
      $value = Read-Host "  $Prompt$suffix"

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
    $value = Read-Host ("  $Prompt" + $suffix)

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
    return $current
  }

  if ($UseDefaultIfMissing -and -not [string]::IsNullOrEmpty($Default)) {
    [Environment]::SetEnvironmentVariable($Name, $Default, 'Process')
    return $Default
  }

  $value = Read-PlanThingsValue -Prompt $Prompt -Default $Default -Secret:$Secret
  [Environment]::SetEnvironmentVariable($Name, $value, 'Process')
  return $value
}

function Set-PlanThingsProcessEnvVar {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    [Environment]::SetEnvironmentVariable($Name, $null, 'Process')
    return
  }

  [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
}

function Clear-PlanThingsEnvVars {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Names
  )

  foreach ($name in $Names) {
    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
  }
}

function Use-PlanThingsOptionalGoogleSetup {
  param(
    [bool]$Default = $false
  )

  $defaultLabel = if ($Default) { 'S/n' } else { 's/N' }
  Show-PlanThingsInputHeader
  $answer = Read-Host "  google_oauth [$defaultLabel]"

  if ([string]::IsNullOrWhiteSpace($answer)) {
    return $Default
  }

  return $answer.Trim().ToLowerInvariant().StartsWith('s')
}

function Set-PlanThingsGoogleEnvVars {
  $null = Set-PlanThingsEnvVar -Name 'GOOGLE_OAUTH_CLIENT_ID' -Prompt 'google_oauth_client_id'
  $null = Set-PlanThingsEnvVar -Name 'GOOGLE_OAUTH_CLIENT_SECRET' -Prompt 'google_oauth_client_secret' -Secret
  $null = Set-PlanThingsEnvVar -Name 'APP_INTEGRATION_TOKEN_KEY_B64' -Prompt 'app_integration_token_key_b64' -Secret
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

Import-PlanThingsLocalSecrets
