# watch-and-install.ps1
# Daemon : poll GitHub toutes les 30s. Des qu'un nouveau run "Android Build"
# reussi apparait, telecharge l'APK et l'installe sur le tel USB.
# Methode SallyCards (watch-and-install.ps1) adaptee a go-with-sally.
# Bugs SallyCards corriges : gh full path, GH_TOKEN, Out-String check,
# pas de Start-Job pour le download, sortie ASCII.
param([switch]$Once, [int]$IntervalSec = 30)

$ErrorActionPreference = "Stop"
$REPO   = "salistar/go-with-sally"
$WF     = "android-build.yml"
$state  = Join-Path $PSScriptRoot "..\.gh-watch-state"
$gh     = (Get-Command gh -ErrorAction Stop).Source
$env:GH_TOKEN = (& $gh auth token)

function Get-LastRunId {
  & $gh run list --repo $REPO --workflow $WF --status success --limit 1 --json databaseId --jq ".[0].databaseId"
}

Write-Host "Watcher demarre sur $REPO ($WF). Intervalle ${IntervalSec}s. Ctrl+C pour stopper." -ForegroundColor Cyan
$last = (Test-Path $state) ? (Get-Content $state -Raw).Trim() : ""

while ($true) {
  try {
    $cur = Get-LastRunId
    if ($cur -and $cur -ne $last) {
      Write-Host "[$(Get-Date -Format HH:mm:ss)] Nouveau build #$cur -> installation" -ForegroundColor Green
      & "$PSScriptRoot\install-from-github.ps1" -NoLogcat
      if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
        $cur | Set-Content $state
        $last = $cur
        Write-Host "[$(Get-Date -Format HH:mm:ss)] App installee." -ForegroundColor Green
      } else {
        Write-Host "[$(Get-Date -Format HH:mm:ss)] Install echouee, on reessaiera." -ForegroundColor Yellow
      }
    } else {
      Write-Host "[$(Get-Date -Format HH:mm:ss)] Pas de nouveau build (#$cur)" -ForegroundColor DarkGray
    }
  } catch {
    Write-Host "[$(Get-Date -Format HH:mm:ss)] Erreur: $_" -ForegroundColor Yellow
  }
  if ($Once) { break }
  Start-Sleep -Seconds $IntervalSec
}
