$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskBackend = Join-Path $taskRoot 'backend'
$taskFrontend = Join-Path $taskRoot 'frontend'
$taskPython = Join-Path $taskBackend 'venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $taskPython)) { throw 'Create backend/venv and install backend/requirements.txt first.' }
try {
    & $taskPython --version 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Python runtime unavailable.' }
} catch {
    throw 'backend/venv points to an unavailable Python installation. Recreate the virtual environment with Python 3.12+ and install requirements.lock.'
}
if (!(Test-Path -LiteralPath (Join-Path $taskBackend '.env'))) { throw 'Create backend/.env from .env.example first.' }
if (!(Test-Path -LiteralPath (Join-Path $taskFrontend 'node_modules'))) { throw 'Run npm ci in frontend first.' }
$taskNode = (Get-Command node.exe).Source
foreach ($taskPort in 8000, 5173) {
    $taskListener = Get-NetTCPConnection -LocalPort $taskPort -State Listen -ErrorAction SilentlyContinue
    if ($taskListener) { throw "Port $taskPort is occupied. Existing services have not been stopped." }
}
$taskReady = $false
try {
    $taskBackendProcess = Start-Process -FilePath $taskPython -ArgumentList '-m uvicorn main:app --host 127.0.0.1 --port 8000' -WorkingDirectory $taskBackend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskBackend 'server.stdout.log') -RedirectStandardError (Join-Path $taskBackend 'server.stderr.log') -PassThru
    $taskFrontendProcess = Start-Process -FilePath $taskNode -ArgumentList 'node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort' -WorkingDirectory $taskFrontend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskFrontend 'server.stdout.log') -RedirectStandardError (Join-Path $taskFrontend 'server.stderr.log') -PassThru
    for ($taskAttempt = 0; $taskAttempt -lt 30; $taskAttempt++) {
        if ($taskBackendProcess.HasExited -or $taskFrontendProcess.HasExited) { break }
        & $taskPython (Join-Path $taskBackend 'readiness.py')
        if ($LASTEXITCODE -eq 0) { $taskReady = $true; break }
        Start-Sleep -Milliseconds 500
    }
    if (!$taskReady) { throw 'Startup did not become ready. Inspect backend/server.stderr.log and frontend/server.stderr.log.' }
} finally {
    if (!$taskReady) {
        foreach ($taskProcess in $taskBackendProcess, $taskFrontendProcess) {
            if ($taskProcess -and !$taskProcess.HasExited) { Stop-Process -Id $taskProcess.Id -ErrorAction SilentlyContinue }
        }
    }
}
Write-Output "Frontend: http://localhost:5173"
Write-Output "API docs: http://localhost:8000/docs"
Write-Output "Launcher PIDs: $($taskBackendProcess.Id), $($taskFrontendProcess.Id)"
