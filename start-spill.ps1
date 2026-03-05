$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Starter BIM-spillet på http://127.0.0.1:5173"
Start-Process "http://127.0.0.1:5173"
node .\server.js
