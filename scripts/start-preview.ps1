$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$server = Join-Path $root 'server'

Set-Location $server
if (!(Test-Path 'node_modules')) { npm install }
npm run build
$env:PORT = '3001'
$env:FRONTEND_URL = 'http://localhost:3005'
Start-Process powershell -NoExit -WorkingDirectory $server -ArgumentList 'npm run start'

Set-Location $root
if (!(Test-Path 'node_modules')) { npm install }
npm run build
$env:VITE_API_URL = 'http://localhost:3001/api'
Start-Process powershell -NoExit -WorkingDirectory $root -ArgumentList 'npm run preview -- --port 3005'
