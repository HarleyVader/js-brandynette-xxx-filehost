#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check HestiaCP installation and service status
.DESCRIPTION
    Monitors HestiaCP installation progress and provides quick status checks
.EXAMPLE
    .\check-hestia-status.ps1 -Mode install
    .\check-hestia-status.ps1 -Mode services
    .\check-hestia-status.ps1 -Mode access
#>

param(
    [ValidateSet('install', 'services', 'access', 'logs', 'all')]
    [string]$Mode = 'all'
)

$ProxmoxHost = "192.168.0.100"
$ContainerID = "101"
$ContainerIP = "192.168.0.66"
$HestiaPort = "38383"

function Show-Banner {
    Write-Host "`n╔══════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     HestiaCP Status Monitor              ║" -ForegroundColor Cyan
    Write-Host "║     Container 101 (bambiOSdumbOS)        ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Check-Installation {
    Write-Host "`n📦 Installation Status:" -ForegroundColor Yellow
    
    $processCount = ssh root@$ProxmoxHost "pct exec $ContainerID -- bash -c 'ps aux | grep hst-install | grep -v grep | wc -l'" 2>$null
    
    if ($processCount -gt 0) {
        Write-Host "  ⏳ Installation in progress ($processCount processes)" -ForegroundColor Green
        Write-Host "  📝 Tailing last 20 lines of install log:" -ForegroundColor Cyan
        $logOutput = ssh root@$ProxmoxHost "pct exec $ContainerID -- bash -c 'tail -20 /root/hst_install_backups/hst_install-*.log 2>/dev/null'" 2>$null
        if ($logOutput) { Write-Host $logOutput } else { Write-Host "  Log not available yet" -ForegroundColor Yellow }
    } else {
        Write-Host "  ✅ Installation complete (or not started)" -ForegroundColor Green
        
        # Check if HestiaCP is installed
        $hestiaInstalled = ssh root@$ProxmoxHost "pct exec $ContainerID -- command -v v-list-sys-info" 2>$null
        if ($hestiaInstalled) {
            Write-Host "  ✅ HestiaCP CLI tools detected" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: HestiaCP not detected" -ForegroundColor Red
        }
    }
}

function Check-Services {
    Write-Host "`n🔧 Service Status:" -ForegroundColor Yellow
    
    $services = @(
        @{Name="hestia"; Display="HestiaCP"},
        @{Name="nginx"; Display="NGINX"},
        @{Name="apache2"; Display="Apache"},
        @{Name="mysql"; Display="MariaDB"},
        @{Name="exim4"; Display="Exim Mail"},
        @{Name="dovecot"; Display="Dovecot IMAP/POP3"},
        @{Name="named"; Display="BIND DNS"},
        @{Name="vsftpd"; Display="FTP Server"},
        @{Name="fail2ban"; Display="Fail2Ban"}
    )
    
    foreach ($svc in $services) {
        $status = ssh root@$ProxmoxHost "pct exec $ContainerID -- systemctl is-active $($svc.Name) 2>/dev/null" 2>$null
        
        if ($status -eq "active") {
            Write-Host "  ✅ $($svc.Display): " -NoNewline -ForegroundColor White
            Write-Host "Running" -ForegroundColor Green
        } elseif ($status -eq "inactive") {
            Write-Host "  ⏸️  $($svc.Display): " -NoNewline -ForegroundColor White
            Write-Host "Stopped" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ $($svc.Display): " -NoNewline -ForegroundColor White
            Write-Host "Not installed" -ForegroundColor DarkGray
        }
    }
}

function Check-Access {
    Write-Host "`n🌐 Access Information:" -ForegroundColor Yellow
    
    Write-Host "  Container IP: " -NoNewline -ForegroundColor White
    Write-Host $ContainerIP -ForegroundColor Cyan
    
    Write-Host "  Control Panel: " -NoNewline -ForegroundColor White
    Write-Host "https://$ContainerIP`:$HestiaPort" -ForegroundColor Cyan
    
    # Test port accessibility
    Write-Host "`n  Testing port $HestiaPort..." -NoNewline -ForegroundColor Yellow
    $portTest = Test-NetConnection -ComputerName $ContainerIP -Port $HestiaPort -WarningAction SilentlyContinue -InformationLevel Quiet
    
    if ($portTest) {
        Write-Host " ✅ OPEN" -ForegroundColor Green
        Write-Host "  🎉 HestiaCP is accessible!" -ForegroundColor Green
        Write-Host "`n  Login Credentials:" -ForegroundColor Cyan
        Write-Host "    Username: bambi" -ForegroundColor White
        Write-Host "    Password: [See HESTIACP-SETUP.md]" -ForegroundColor Yellow
    } else {
        Write-Host " ❌ CLOSED" -ForegroundColor Red
        Write-Host "  ⏳ Installation may still be in progress" -ForegroundColor Yellow
    }
}

function Check-Logs {
    Write-Host "`n📋 Recent Logs:" -ForegroundColor Yellow
    
    Write-Host "`n  HestiaCP Access Log (last 10 lines):" -ForegroundColor Cyan
    $hestiaLog = ssh root@$ProxmoxHost "pct exec $ContainerID -- bash -c 'tail -10 /var/log/hestia/system.log 2>/dev/null'" 2>$null
    if ($hestiaLog) { Write-Host $hestiaLog } else { Write-Host "  Log not available yet" -ForegroundColor Yellow }
    
    Write-Host "`n  NGINX Error Log (last 5 lines):" -ForegroundColor Cyan
    $nginxLog = ssh root@$ProxmoxHost "pct exec $ContainerID -- bash -c 'tail -5 /var/log/nginx/error.log 2>/dev/null'" 2>$null
    if ($nginxLog) { Write-Host $nginxLog } else { Write-Host "  Log not available yet" -ForegroundColor Yellow }
}

function Show-QuickCommands {
    Write-Host "`n🔨 Quick Commands:" -ForegroundColor Yellow
    Write-Host "  SSH to container:       " -NoNewline -ForegroundColor White
    Write-Host "ssh root@$ProxmoxHost 'pct enter $ContainerID'" -ForegroundColor Green
    
    Write-Host "  View install log:       " -NoNewline -ForegroundColor White
    Write-Host "ssh root@$ProxmoxHost 'pct exec $ContainerID -- tail -f /root/hst_install_backups/hst_install-*.log'" -ForegroundColor Green
    
    Write-Host "  Restart HestiaCP:       " -NoNewline -ForegroundColor White
    Write-Host "ssh root@$ProxmoxHost 'pct exec $ContainerID -- systemctl restart hestia'" -ForegroundColor Green
    
    Write-Host "  Check system info:      " -NoNewline -ForegroundColor White
    Write-Host "ssh root@$ProxmoxHost 'pct exec $ContainerID -- v-list-sys-info'" -ForegroundColor Green
    
    Write-Host "  Open control panel:     " -NoNewline -ForegroundColor White
    Write-Host "Start-Process https://$ContainerIP`:$HestiaPort" -ForegroundColor Green
}

# Main execution
Show-Banner

switch ($Mode) {
    'install' { Check-Installation }
    'services' { Check-Services }
    'access' { Check-Access }
    'logs' { Check-Logs }
    'all' {
        Check-Installation
        Check-Services
        Check-Access
        Show-QuickCommands
    }
}

Write-Host "`n" # Blank line at end
