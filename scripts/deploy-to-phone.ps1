# deploy-to-phone.ps1
# Build LOCAL complet (sans GitHub) + install sur le tel USB.
# Methode SallyCards (deploy-to-phone.ps1) adaptee a go-with-sally :
# Expo SDK 52 / RN 0.76, app classique (pas expo-router), repo standalone.
param([switch]$SkipBundle, [switch]$Clean)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root
$PKG = "com.gowithsally.app"

if (-not $env:JAVA_HOME) {
  $cand = "C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot"
  if (Test-Path $cand) { $env:JAVA_HOME = $cand }
}
Write-Host "JAVA_HOME = $env:JAVA_HOME" -ForegroundColor DarkGray

Write-Host "==> npm install" -ForegroundColor Cyan
npm install --legacy-peer-deps

Write-Host "==> Cleanup React 19 RC parasitaire (jest-expo)" -ForegroundColor Cyan
@("react","react-dom","react-server-dom-webpack","react-test-renderer") | ForEach-Object {
  Remove-Item -Recurse -Force "node_modules\jest-expo\node_modules\$_" -ErrorAction SilentlyContinue
}
Remove-Item -Recurse -Force "node_modules\jest-expo\node_modules\@types\react" -ErrorAction SilentlyContinue

Write-Host "==> newArchEnabled = false" -ForegroundColor Cyan
node -e "const fs=require('fs');const a=JSON.parse(fs.readFileSync('app.json'));a.expo.newArchEnabled=false;fs.writeFileSync('app.json',JSON.stringify(a,null,2));"

if ($Clean -or -not (Test-Path "android")) {
  Write-Host "==> expo prebuild --clean" -ForegroundColor Cyan
  $env:CI = "1"
  npx expo prebuild --platform android --clean
}

if (-not $SkipBundle) {
  Write-Host "==> Bundle JS embarque (--reset-cache)" -ForegroundColor Cyan
  Remove-Item -Recurse -Force "android\app\src\main\assets\index.android.bundle" -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force "$env:TEMP\metro-*" -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path "android\app\src\main\assets" | Out-Null
  npx expo export:embed --platform android --dev false `
    --bundle-output android\app\src\main\assets\index.android.bundle `
    --assets-dest android\app\src\main\res `
    --reset-cache
  if ($LASTEXITCODE -ne 0) { Write-Host "Bundle FAILED" -ForegroundColor Red; exit 1 }
}

Write-Host "==> gradlew assembleDebug" -ForegroundColor Cyan
Set-Location "$root\android"
.\gradlew assembleDebug --no-daemon
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED" -ForegroundColor Red; exit 1 }

$apk = "app\build\outputs\apk\debug\app-debug.apk"
Write-Host "==> Install $apk" -ForegroundColor Cyan
adb uninstall $PKG 2>$null | Out-Null
$out = (adb install -r $apk 2>&1 | Out-String).Trim()
if ($out -notmatch "Success") { Write-Host "Install echec: $out" -ForegroundColor Red; exit 1 }
adb shell am start -n "$PKG/.MainActivity" | Out-Null
Write-Host "BUILD OK + installe." -ForegroundColor Green
