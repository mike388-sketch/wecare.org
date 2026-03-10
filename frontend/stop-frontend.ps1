param(
  [int]$Port = 5500
)

function Get-ListeningPids {
  param([int]$TargetPort)

  $lines = netstat -ano | Select-String -Pattern ":$TargetPort\s+.*LISTENING\s+\d+$"
  $procIds = @()

  foreach ($line in $lines) {
    $parts = ($line.Line -split "\s+") | Where-Object { $_ }
    if ($parts.Length -ge 5) {
      $pidValue = $parts[-1]
      if ($pidValue -match "^\d+$") {
        $procIds += [int]$pidValue
      }
    }
  }

  return $procIds | Select-Object -Unique
}

$procIds = Get-ListeningPids -TargetPort $Port
if ($procIds.Count -eq 0) {
  Write-Output "No frontend process is listening on port $Port."
  exit 0
}

foreach ($procId in $procIds) {
  try {
    Stop-Process -Id $procId -Force -ErrorAction Stop
    Write-Output "Stopped frontend PID $procId"
  } catch {
    Write-Output "Failed to stop PID ${procId}: $($_.Exception.Message)"
  }
}
