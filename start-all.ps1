# Mailer Platform - Start All Services
# This script runs the API, Worker, and Web services in parallel.
# Requires pnpm to be installed.

Write-Host "🚀 Starting Mailer Platform Services..." -ForegroundColor Magenta

# Start the processes in the background
$api = Start-Process pnpm -ArgumentList "--filter @mailer/api dev" -NoNewWindow -PassThru
$worker = Start-Process pnpm -ArgumentList "--filter @mailer/worker dev" -NoNewWindow -PassThru
$web = Start-Process pnpm -ArgumentList "--filter web dev" -NoNewWindow -PassThru

# Function to stop processes on exit
function Stop-Services {
    Write-Host "`n🛑 Shutting down all services..." -ForegroundColor Red
    Stop-Process -Id $api.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $worker.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $web.Id -ErrorAction SilentlyContinue
    exit
}

# Trap Ctrl+C (SIGINT)
$Host.UI.RawUI.FlushInputBuffer()
while($true) {
    if ([console]::KeyAvailable) {
        $key = [console]::ReadKey($true)
        if ($key.Modifiers -eq 'Control' -and $key.Key -eq 'C') {
            Stop-Services
        }
    }
    Start-Sleep -Milliseconds 500
}
