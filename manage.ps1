# Brandynette Video Server - Management Dashboard
# Quick access to all server management functions

param(
    [Parameter(Position=0)]
    [string]$Command
)

$Host.UI.RawUI.WindowTitle = "🎬 Brandynette Server Manager"

function Show-Menu {
    Clear-Host
    Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║      🎬  BRANDYNETTE VIDEO SERVER - CONTROL PANEL  🎬       ║
║                                                              ║
║              Target: 192.168.0.100:6969                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

    Write-Host "  📡 CONNECTION & ACCESS" -ForegroundColor Cyan
    Write-Host "    [1] Connect via SSH" -ForegroundColor White
    Write-Host "    [2] Create SSH Tunnel (access via localhost)" -ForegroundColor White
    Write-Host "    [3] Test Connection" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  🚀 DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "    [4] Deploy to Server" -ForegroundColor White
    Write-Host "    [5] Update Deployment" -ForegroundColor White
    Write-Host "    [6] View Deployment Guide" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  🔧 MANAGEMENT" -ForegroundColor Cyan
    Write-Host "    [7] Check Server Status" -ForegroundColor White
    Write-Host "    [8] View Live Logs" -ForegroundColor White
    Write-Host "    [9] Restart Server" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  💾 BACKUP & MAINTENANCE" -ForegroundColor Cyan
    Write-Host "    [B] Create Backup" -ForegroundColor White
    Write-Host "    [R] Restore from Backup" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  🌐 NETWORK" -ForegroundColor Cyan
    Write-Host "    [N] Network Diagnostics" -ForegroundColor White
    Write-Host "    [P] Port Scanner" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  📚 DOCUMENTATION" -ForegroundColor Cyan
    Write-Host "    [Q] Quick Start Guide" -ForegroundColor White
    Write-Host "    [D] Full Documentation" -ForegroundColor White
    Write-Host "    [H] Help & Troubleshooting" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  [X] Exit" -ForegroundColor Red
    Write-Host ""
}

function Invoke-Command {
    param([string]$Cmd)
    
    switch ($Cmd.ToUpper()) {
        '1' {
            Write-Host "`n🔐 Opening SSH session..." -ForegroundColor Cyan
            .\scripts\ssh-connect.ps1 connect
        }
        '2' {
            Write-Host "`n🌉 Creating SSH tunnel..." -ForegroundColor Cyan
            Write-Host "Access server at: http://localhost:6969" -ForegroundColor Green
            .\scripts\ssh-connect.ps1 tunnel
        }
        '3' {
            Write-Host "`n📡 Testing connection..." -ForegroundColor Cyan
            Test-NetConnection -ComputerName 192.168.0.100 -Port 22 | Format-List
            Test-NetConnection -ComputerName 192.168.0.100 -Port 8006 | Format-List
            Read-Host "`nPress Enter to continue"
        }
        '4' {
            Write-Host "`n🚀 Deploying to server..." -ForegroundColor Cyan
            .\scripts\ssh-connect.ps1 deploy
            Read-Host "`nPress Enter to continue"
        }
        '5' {
            Write-Host "`n🔄 Updating deployment..." -ForegroundColor Cyan
            .\scripts\ssh-connect.ps1 deploy
            Read-Host "`nPress Enter to continue"
        }
        '6' {
            Write-Host "`n📖 Opening deployment guide..." -ForegroundColor Cyan
            Start-Process "DEPLOYMENT.md"
        }
        '7' {
            Write-Host "`n📊 Checking server status..." -ForegroundColor Cyan
            .\scripts\ssh-connect.ps1 status
            Read-Host "`nPress Enter to continue"
        }
        '8' {
            Write-Host "`n📜 Opening live logs (Ctrl+C to exit)..." -ForegroundColor Cyan
            Start-Sleep -Seconds 2
            .\scripts\ssh-connect.ps1 logs
        }
        '9' {
            Write-Host "`n🔄 Restarting server..." -ForegroundColor Yellow
            $confirm = Read-Host "Are you sure? (y/n)"
            if ($confirm -eq 'y') {
                .\scripts\ssh-connect.ps1 restart
            }
            Read-Host "`nPress Enter to continue"
        }
        'B' {
            Write-Host "`n💾 Creating backup..." -ForegroundColor Cyan
            .\scripts\ssh-connect.ps1 backup
            Read-Host "`nPress Enter to continue"
        }
        'R' {
            Write-Host "`n⚠️  Restore functionality not yet implemented" -ForegroundColor Yellow
            Write-Host "Manual restore: Extract backup.tar.gz to /opt/brandynette-filehost/" -ForegroundColor Gray
            Read-Host "`nPress Enter to continue"
        }
        'N' {
            Write-Host "`n🌐 Running network diagnostics..." -ForegroundColor Cyan
            
            Write-Host "`nScanning ports..." -ForegroundColor Yellow
            $ports = @(22, 80, 443, 3128, 6969, 8006, 8443)
            $results = @()
            
            foreach ($port in $ports) {
                $test = Test-NetConnection -ComputerName 192.168.0.100 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
                $results += [PSCustomObject]@{
                    Port = $port
                    Status = if ($test) { "✅ OPEN" } else { "❌ CLOSED" }
                }
            }
            
            $results | Format-Table -AutoSize
            
            Write-Host "`nTesting video server health..." -ForegroundColor Yellow
            try {
                $health = Invoke-WebRequest -Uri "http://192.168.0.100:6969/health" -TimeoutSec 5 -ErrorAction Stop
                Write-Host "Server Status: ✅ ONLINE" -ForegroundColor Green
                Write-Host "Response: $($health.Content)" -ForegroundColor Gray
            } catch {
                Write-Host "Server Status: ⚠️ OFFLINE or not responding" -ForegroundColor Yellow
            }
            
            Read-Host "`nPress Enter to continue"
        }
        'P' {
            Write-Host "`n🔍 Scanning common ports..." -ForegroundColor Cyan
            
            $ports = 1..100
            $openPorts = @()
            
            Write-Host "Scanning ports 1-100 (this may take a minute)..." -ForegroundColor Yellow
            
            foreach ($port in $ports) {
                Write-Progress -Activity "Port Scan" -Status "Scanning port $port" -PercentComplete ($port)
                $test = Test-NetConnection -ComputerName 192.168.0.100 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
                if ($test) {
                    $openPorts += $port
                }
            }
            
            Write-Progress -Activity "Port Scan" -Completed
            
            if ($openPorts.Count -gt 0) {
                Write-Host "`nOpen ports found: $($openPorts -join ', ')" -ForegroundColor Green
            } else {
                Write-Host "`nNo open ports found in range 1-100" -ForegroundColor Yellow
            }
            
            Read-Host "`nPress Enter to continue"
        }
        'Q' {
            Write-Host "`n📖 Opening Quick Start guide..." -ForegroundColor Cyan
            Start-Process "QUICKSTART.md"
        }
        'D' {
            Write-Host "`n📚 Opening documentation..." -ForegroundColor Cyan
            Write-Host "  - README.md (overview)" -ForegroundColor Gray
            Write-Host "  - QUICKSTART.md (quick start)" -ForegroundColor Gray
            Write-Host "  - DEPLOYMENT.md (deployment guide)" -ForegroundColor Gray
            Write-Host "  - NETWORK.md (network config)" -ForegroundColor Gray
            Write-Host "  - BUILD-INSTRUCTIONS.md (architecture)" -ForegroundColor Gray
            Write-Host "  - TODO.md (roadmap)" -ForegroundColor Gray
            
            $choice = Read-Host "`nWhich document? (README/QUICKSTART/DEPLOYMENT/NETWORK/BUILD/TODO)"
            switch ($choice.ToUpper()) {
                'README' { Start-Process "README.md" }
                'QUICKSTART' { Start-Process "QUICKSTART.md" }
                'DEPLOYMENT' { Start-Process "DEPLOYMENT.md" }
                'NETWORK' { Start-Process "NETWORK.md" }
                'BUILD' { Start-Process "BUILD-INSTRUCTIONS.md" }
                'TODO' { Start-Process "TODO.md" }
                default { Write-Host "Invalid choice" -ForegroundColor Red }
            }
        }
        'H' {
            Write-Host "`n🆘 Help & Troubleshooting" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Common Issues:" -ForegroundColor Yellow
            Write-Host "  1. Can't connect: Check firewall and SSH service" -ForegroundColor White
            Write-Host "  2. Server not responding: Check if service is running" -ForegroundColor White
            Write-Host "  3. Port 6969 closed: Deploy server first" -ForegroundColor White
            Write-Host ""
            Write-Host "Quick Fixes:" -ForegroundColor Yellow
            Write-Host "  - Restart server: Option 9" -ForegroundColor White
            Write-Host "  - Check status: Option 7" -ForegroundColor White
            Write-Host "  - View logs: Option 8" -ForegroundColor White
            Write-Host ""
            Write-Host "Documentation: DEPLOYMENT.md, NETWORK.md" -ForegroundColor Gray
            Read-Host "`nPress Enter to continue"
        }
        'X' {
            Write-Host "`n👋 Goodbye!" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Host "`n❌ Invalid option. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
}

# Main loop
if ($Command) {
    Invoke-Command -Cmd $Command
} else {
    while ($true) {
        Show-Menu
        $selection = Read-Host "Select option"
        Invoke-Command -Cmd $selection
    }
}
