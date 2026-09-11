# WASM Build Script for Windows PowerShell
# Usage: .\scripts\build.ps1 [dev|release] [output-dir]

param(
    [string]$Mode = "release",
    [string]$OutDir = "pkg",
    [string]$Target = "web"
)

$ErrorActionPreference = "Stop"

Write-Host "[BUILD] Starting WASM build..." -ForegroundColor Cyan
Write-Host "  Mode: $Mode" -ForegroundColor Yellow
Write-Host "  Output: $OutDir" -ForegroundColor Yellow
Write-Host "  Target: $Target" -ForegroundColor Yellow
Write-Host ""

# Check tools
if (-not (Get-Command rustup -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] rustup not found. Please install Rust first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command wasm-bindgen -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] wasm-bindgen CLI not found. Installing..." -ForegroundColor Yellow
    cargo install wasm-bindgen-cli
}

# Ensure wasm32 target is installed
$targetList = rustup target list
if ($targetList -notmatch "wasm32-unknown-unknown \(installed\)") {
    Write-Host "[INFO] Installing wasm32-unknown-unknown target..." -ForegroundColor Cyan
    rustup target add wasm32-unknown-unknown
}

# Clean old files
if (Test-Path $OutDir) {
    Write-Host "[INFO] Cleaning old files..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $OutDir
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Build WASM
Write-Host "[BUILD] Compiling Rust code..." -ForegroundColor Cyan
if ($Mode -eq "dev") {
    cargo build --target wasm32-unknown-unknown
    $WasmFile = "target\wasm32-unknown-unknown\debug\bi_alignment.wasm"
    $BindgenFlags = "--debug"
} else {
    cargo build --target wasm32-unknown-unknown --release
    $WasmFile = "target\wasm32-unknown-unknown\release\bi_alignment.wasm"
    $BindgenFlags = ""
}

# Generate JS bindings and TS types
Write-Host "[BUILD] Generating JavaScript bindings and TypeScript types..." -ForegroundColor Cyan
$cmd = "wasm-bindgen `"$WasmFile`" --out-dir `"$OutDir`" --target $Target --typescript $BindgenFlags"
Invoke-Expression $cmd

Write-Host ""
Write-Host "[SUCCESS] Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
Get-ChildItem $OutDir | Format-Table -AutoSize
Write-Host ""
Write-Host "File sizes:" -ForegroundColor Cyan
Get-ChildItem "$OutDir\*.wasm" | Select-Object Name, @{Name="Size (KB)";Expression={[math]::Round($_.Length/1KB, 2)}} | Format-Table -AutoSize
Write-Host ""
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  import init from './$OutDir/bi_alignment.js';" -ForegroundColor White
