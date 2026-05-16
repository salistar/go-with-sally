# install-from-github.ps1
# Telecharge l'APK du dernier run "Android Build" reussi sur GitHub et l'installe via adb.
# Methode SallyCards (install-from-github.ps1) adaptee a go-with-sally.
param([switch]$NoLogcat)

$ErrorActionPreference = "Stop"
$REPO    = "salistar/go-with-sally"
$PKG     = "com.gowithsally.app"
$ACT     = "$PKG/.MainActivity"
$WF      = "android-build.yml"
$tmp     = Join-Path $env:TEMP "gws-apk"

$gh = (Get-Command gh -ErrorAction Stop).Source

Write-Host "==> Dernier run reussi de $WF sur $REPO" -ForegroundColor Cyan
$runId = & $gh run list --repo $REPO --workflow $WF --status success --limit 1 --json databaseId --jq ".[0].databaseId"
if (-not $runId) { Write-Host "Aucun run reussi trouve." -ForegroundColor Red; exit 1 }
Write-Host "    run #$runId"

if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$ok = $false
for ($i = 1; $i -le 3; $i++) {
  try {
    & $gh run download $runId --repo $REPO --name app-debug --dir $tmp
    $ok = $true; break
  } catch {
    Write-Host "    download tentative $i echouee, retry dans 3s..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
  }
}
if (-not $ok) { Write-Host "Download APK echoue apres 3 tentatives." -ForegroundColor Red; exit 1 }

$apk = Get-ChildItem -Recurse -Path $tmp -Filter app-debug.apk | Select-Object -First 1
if (-not $apk) { Write-Host "APK introuvable dans l'artifact." -ForegroundColor Red; exit 1 }
Write-Host "    APK: $($apk.FullName)  ($([math]::Round($apk.Length/1MB,1)) MB)"

Write-Host "==> Installation sur l'appareil" -ForegroundColor Cyan
adb uninstall $PKG 2>$null | Out-Null
$out = (adb install -r "$($apk.FullName)" 2>&1 | Out-String).Trim()
if ($out -notmatch "Success") { Write-Host "Echec install: $out" -ForegroundColor Red; exit 1 }
Write-Host "    Install OK" -ForegroundColor Green

adb shell am start -n $ACT | Out-Null
Write-Host "==> App lancee." -ForegroundColor Green

if (-not $NoLogcat) {
  adb logcat -c
  Write-Host "==> Logs (3s)..." -ForegroundColor Cyan
  $job = Start-Job { adb logcat ReactNativeJS:V ReactNative:V *:E }
  Start-Sleep -Seconds 3
  Receive-Job $job; Stop-Job $job; Remove-Job $job -Force
}
