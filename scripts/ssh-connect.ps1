# SSH Connection Manager for Proxmox Server
# Brandynette Video Server - Remote Management

param(
    [Parameter(Position=0)]
    [ValidateSet('connect', 'deploy', 'logs', 'status', 'restart', 'backup', 'tunnel')]
    [string]$Action = 'connect',
    
    [string]$Host = '192.168.0.100',
    [string]$User = 'root',
    [string]$KeyPath = "$env:USERPROFILE\.ssh\proxmox_deploy",
    [int]$Port = 22
)

$ErrorActionPreference = 'Stop'

# Colors
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Banner
Write-Host @"
╔══════════════════════════════════════════════════════════╗
║  🎬 Brandynette Video Server - Remote Management 🎬     ║
║  Target: $Host                              ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

# Test connection
Write-Info "Testing connection to $Host`:$Port..."
$testResult = Test-NetConnection -ComputerName $Host -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $testResult) {
    Write-Error "Cannot connect to $Host`:$Port"
    Write-Warning "Possible issues:"
    Write-Host "  - Server is offline" -ForegroundColor Yellow
    Write-Host "  - Firewall blocking connection" -ForegroundColor Yellow
    Write-Host "  - Incorrect host/port" -ForegroundColor Yellow
    exit 1
}

Write-Success "Connection available on $Host`:$Port"

# SSH command builder
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [switch]$Interactive
    )
    
    $sshArgs = @()
    
    if (Test-Path $KeyPath) {
        $sshArgs += @('-i', $KeyPath)
        Write-Info "Using SSH key: $KeyPath"
    } else {
        Write-Warning "SSH key not found at $KeyPath - will use password auth"
    }
    
    $sshArgs += @('-p', $Port)
    $sshArgs += "$User@$Host"
    
    if ($Command -and -not $Interactive) {
        $sshArgs += $Command
    }
    
    Write-Info "Executing: ssh $($sshArgs -join ' ')"
    & ssh $sshArgs
}

# Action handlers
switch ($Action) {
    'connect' {
        Write-Info "Opening SSH session to $User@$Host..."
        Invoke-SSHCommand -Interactive
    }
    
    'deploy' {
        Write-Info "Starting deployment process..."
        
        # Check if project files exist
        $projectPath = Split-Path -Parent $PSScriptRoot
        if (-not (Test-Path $projectPath)) {
            Write-Error "Project path not found: $projectPath"
            exit 1
        }
        
        Write-Info "Creating deployment package..."
        $tempDir = Join-Path $env:TEMP "brandynette-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        
        # Copy files
        Copy-Item "$projectPath\src" -Destination "$tempDir\src" -Recurse
        Copy-Item "$projectPath\public" -Destination "$tempDir\public" -Recurse
        Copy-Item "$projectPath\package*.json" -Destination $tempDir
        
        if (Test-Path "$projectPath\BRANDIFICATION") {
            Copy-Item "$projectPath\BRANDIFICATION" -Destination "$tempDir\BRANDIFICATION" -Recurse
        }
        
        # Create archive
        $zipPath = "$tempDir.zip"
        Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
        Write-Success "Package created: $zipPath"
        
        # Upload via SCP
        Write-Info "Uploading to server..."
        $scpArgs = @()
        if (Test-Path $KeyPath) { $scpArgs += @('-i', $KeyPath) }
        $scpArgs += @('-P', $Port, $zipPath, "${User}@${Host}:/tmp/brandynette-deploy.zip")
        
        & scp $scpArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Upload complete!"
            
            # Extract and setup
            Write-Info "Setting up on remote server..."
            Invoke-SSHCommand -Command @"
cd /opt && \
mkdir -p brandynette-filehost && \
cd brandynette-filehost && \
unzip -o /tmp/brandynette-deploy.zip && \
npm install --production && \
rm /tmp/brandynette-deploy.zip && \
echo 'Deployment complete!'
"@
            Write-Success "Deployment finished!"
        } else {
            Write-Error "Upload failed!"
        }
        
        # Cleanup
        Remove-Item $tempDir -Recurse -Force
        Remove-Item $zipPath -Force
    }
    
    'logs' {
        Write-Info "Fetching server logs..."
        Invoke-SSHCommand -Command "cd /opt/brandynette-filehost && tail -n 100 -f /var/log/brandynette-filehost.log 2>/dev/null || journalctl -u brandynette-filehost -f -n 100 2>/dev/null || docker logs -f brandynette-filehost 2>/dev/null || echo 'No logs found. Server may not be running.'"
    }
    
    'status' {
        Write-Info "Checking server status..."
        Invoke-SSHCommand -Command @"
echo '=== System Info ==='
uname -a
echo ''
echo '=== Container Status ==='
pct list 2>/dev/null || qm list 2>/dev/null || echo 'Not using containers'
echo ''
echo '=== Docker Status ==='
docker ps -a 2>/dev/null || echo 'Docker not available'
echo ''
echo '=== Service Status ==='
systemctl status brandynette-filehost 2>/dev/null || echo 'Systemd service not configured'
echo ''
echo '=== Port 6969 Status ==='
netstat -tulpn | grep 6969 || ss -tulpn | grep 6969 || echo 'Port 6969 not in use'
echo ''
echo '=== Health Check ==='
curl -s http://localhost:6969/health 2>/dev/null || echo 'Server not responding'
"@
    }
    
    'restart' {
        Write-Warning "Restarting server..."
        Invoke-SSHCommand -Command @"
systemctl restart brandynette-filehost 2>/dev/null || \
docker restart brandynette-filehost 2>/dev/null || \
pkill -f 'node.*server.js' && cd /opt/brandynette-filehost && nohup npm start > /var/log/brandynette-filehost.log 2>&1 &
echo 'Restart command sent'
"@
        
        Start-Sleep -Seconds 3
        Write-Info "Checking if server is back online..."
        Invoke-SSHCommand -Command "curl -s http://localhost:6969/health"
    }
    
    'backup' {
        Write-Info "Creating backup..."
        $backupName = "brandynette-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
        
        Invoke-SSHCommand -Command @"
cd /opt && \
tar -czf /tmp/$backupName brandynette-filehost/ && \
echo 'Backup created: /tmp/$backupName'
"@
        
        Write-Info "Downloading backup..."
        $localBackupPath = Join-Path $env:USERPROFILE "Downloads\$backupName"
        
        $scpArgs = @()
        if (Test-Path $KeyPath) { $scpArgs += @('-i', $KeyPath) }
        $scpArgs += @('-P', $Port, "${User}@${Host}:/tmp/$backupName", $localBackupPath)
        
        & scp $scpArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backup downloaded to: $localBackupPath"
            Invoke-SSHCommand -Command "rm /tmp/$backupName"
        } else {
            Write-Error "Backup download failed!"
        }
    }
    
    'tunnel' {
        Write-Info "Creating SSH tunnel for port 6969..."
        Write-Info "Access server at: http://localhost:6969"
        Write-Warning "Press Ctrl+C to close tunnel"
        
        $sshArgs = @()
        if (Test-Path $KeyPath) { $sshArgs += @('-i', $KeyPath) }
        $sshArgs += @('-L', '6969:localhost:6969', '-N', '-p', $Port, "$User@$Host")
        
        & ssh $sshArgs
    }
}

Write-Host "`n" -NoNewline
Write-Success "Operation completed!"
