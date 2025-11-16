# HestiaCP Installation Status Check
# Quick script to monitor HestiaCP installation progress

Write-Host "`nChecking HestiaCP Installation Status..." -ForegroundColor Cyan
Write-Host "Container: 101 (bambiOSdumbOS)" -ForegroundColor White
Write-Host "IP: 192.168.0.66" -ForegroundColor White
Write-Host "Port: 38383`n" -ForegroundColor White

# Check if installation is running
Write-Host "[1/4] Checking installation processes..." -ForegroundColor Yellow
$processes = ssh root@192.168.0.100 "pct exec 101 -- bash -c 'ps aux | grep hst-install | grep -v grep'" 2>$null

if ($processes) {
    Write-Host "      RUNNING - Installation in progress" -ForegroundColor Green
    Write-Host "`nLast 15 lines of installation log:" -ForegroundColor Cyan
    ssh root@192.168.0.100 "pct exec 101 -- bash -c 'tail -15 /root/hst_install_backups/hst_install-*.log 2>/dev/null'"
} else {
    Write-Host "      COMPLETE - No installer processes found" -ForegroundColor Green
}

# Check HestiaCP service
Write-Host "`n[2/4] Checking HestiaCP service..." -ForegroundColor Yellow
$hestiaStatus = ssh root@192.168.0.100 "pct exec 101 -- systemctl is-active hestia 2>/dev/null" 2>$null

if ($hestiaStatus -eq "active") {
    Write-Host "      ACTIVE - HestiaCP is running" -ForegroundColor Green
} elseif ($hestiaStatus -eq "inactive") {
    Write-Host "      INACTIVE - Service installed but not running" -ForegroundColor Yellow
} else {
    Write-Host "      NOT INSTALLED - Still installing..." -ForegroundColor Yellow
}

# Check port accessibility
Write-Host "`n[3/4] Testing port 38383..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName 192.168.0.66 -Port 38383 -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null

if ($portTest) {
    Write-Host "      OPEN - Control panel is accessible" -ForegroundColor Green
} else {
    Write-Host "      CLOSED - Port not accessible yet" -ForegroundColor Yellow
}

# Show access info
Write-Host "`n[4/4] Access Information:" -ForegroundColor Yellow
Write-Host "      URL: https://192.168.0.66:38383" -ForegroundColor Cyan
Write-Host "      Username: bambi" -ForegroundColor White
Write-Host "      Password: [See HESTIACP-SETUP.md]" -ForegroundColor Yellow

Write-Host "`n" # Blank line
