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

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outLog = Join-Path $projectRoot "frontend-runtime.out.log"
$errLog = Join-Path $projectRoot "frontend-runtime.err.log"

$existing = Get-ListeningPids -TargetPort $Port
if ($existing.Count -gt 0) {
  Write-Output "Frontend already active on port $Port (PID $($existing[0]))."
  exit 0
}

$cmd = "cd /d `"$projectRoot`" && node server.js >> frontend-runtime.out.log 2>> frontend-runtime.err.log"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 3
$check = Get-ListeningPids -TargetPort $Port
if ($check.Count -gt 0) {
  Write-Output "Frontend started on port $Port (PID $($check[0]))."
} else {
  Write-Output "Frontend did not start. Check: $outLog and $errLog"
  exit 1
}
