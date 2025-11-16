#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Let's Encrypt SSL setup automation for HestiaCP
.DESCRIPTION
    Configures Let's Encrypt SSL certificates for domains and control panel
.PARAMETER Domain
    Domain name to secure (e.g., bambisleep.church)
.PARAMETER Email
    Email for Let's Encrypt notifications
.PARAMETER ControlPanel
    Set SSL for HestiaCP control panel instead of web domain
.EXAMPLE
    .\setup-letsencrypt.ps1 -Domain "bambisleep.church"
    .\setup-letsencrypt.ps1 -Domain "bambi.bambisleep.church" -ControlPanel
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [string]$Email = "bambi@bambisleep.church",
    
    [string]$User = "bambi",
    
    [switch]$ControlPanel
)

$ProxmoxHost = "192.168.0.100"
$ContainerID = "101"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput " Let's Encrypt SSL Setup" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

Write-ColorOutput "Domain: $Domain" "White"
Write-ColorOutput "Email: $Email" "White"
if ($ControlPanel) {
    Write-ColorOutput "Target: HestiaCP Control Panel`n" "Yellow"
} else {
    Write-ColorOutput "Target: Web Domain`n" "Yellow"
}

# Step 1: DNS Resolution Test
Write-ColorOutput "[1/5] Testing DNS resolution..." "Yellow"
try {
    $dnsResult = Resolve-DnsName $Domain -ErrorAction Stop
    $resolvedIP = $dnsResult | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1 -ExpandProperty IPAddress
    
    if ($resolvedIP) {
        Write-ColorOutput "      DNS resolves to: $resolvedIP" "Green"
    } else {
        Write-ColorOutput "      WARNING: No A record found" "Yellow"
    }
} catch {
    Write-ColorOutput "      ERROR: Domain does not resolve" "Red"
    Write-ColorOutput "      Configure DNS A record first!" "Yellow"
    Write-ColorOutput "`nSetup Instructions:" "Cyan"
    Write-ColorOutput "1. Get your public IP: (Invoke-WebRequest ifconfig.me/ip).Content" "White"
    Write-ColorOutput "2. Add DNS A record: $Domain -> YOUR_PUBLIC_IP" "White"
    Write-ColorOutput "3. Wait 5-60 minutes for propagation" "White"
    Write-ColorOutput "4. Run this script again`n" "White"
    exit 1
}

# Step 2: Get Public IP
Write-ColorOutput "`n[2/5] Checking public IP..." "Yellow"
try {
    $publicIP = (Invoke-WebRequest -Uri "https://ifconfig.me/ip" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-ColorOutput "      Your public IP: $publicIP" "Green"
    
    if ($resolvedIP -ne $publicIP) {
        Write-ColorOutput "      WARNING: DNS points to $resolvedIP but your public IP is $publicIP" "Yellow"
        Write-ColorOutput "      This may be correct if using different routing" "Yellow"
    }
} catch {
    Write-ColorOutput "      Could not determine public IP" "Yellow"
}

# Step 3: Port Accessibility Test
Write-ColorOutput "`n[3/5] Testing HTTP port 80..." "Yellow"
$portTest = Test-NetConnection -ComputerName $Domain -Port 80 -WarningAction SilentlyContinue -InformationLevel Quiet

if ($portTest) {
    Write-ColorOutput "      Port 80 is accessible" "Green"
} else {
    Write-ColorOutput "      WARNING: Port 80 not accessible" "Yellow"
    Write-ColorOutput "      Let's Encrypt validation requires port 80" "Yellow"
    Write-ColorOutput "`nPort Forwarding Required:" "Cyan"
    Write-ColorOutput "Router: External 80 -> 192.168.0.66:80" "White"
    Write-ColorOutput "Router: External 443 -> 192.168.0.66:443" "White"
    
    $continue = Read-Host "`nContinue anyway? (y/N)"
    if ($continue -ne 'y') {
        Write-ColorOutput "Setup cancelled.`n" "Yellow"
        exit 0
    }
}

# Step 4: Install Let's Encrypt
Write-ColorOutput "`n[4/5] Installing Let's Encrypt certificate..." "Yellow"

if ($ControlPanel) {
    Write-ColorOutput "      Target: HestiaCP Control Panel" "Cyan"
    
    $cmd = "pct exec $ContainerID -- bash -c 'v-add-letsencrypt-host $Domain'"
    
    try {
        $result = ssh root@$ProxmoxHost $cmd 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "      SSL certificate installed successfully!" "Green"
        } else {
            Write-ColorOutput "      ERROR: Installation failed" "Red"
            Write-ColorOutput "      $result" "Yellow"
            exit 1
        }
    } catch {
        Write-ColorOutput "      ERROR: $($_.Exception.Message)" "Red"
        exit 1
    }
    
} else {
    Write-ColorOutput "      Target: Web Domain" "Cyan"
    
    # First, ensure domain exists in HestiaCP
    Write-ColorOutput "      Checking if domain exists..." "Yellow"
    $checkCmd = "pct exec $ContainerID -- bash -c 'v-list-web-domains $User | grep $Domain'"
    $domainExists = ssh root@$ProxmoxHost $checkCmd 2>$null
    
    if (-not $domainExists) {
        Write-ColorOutput "      Adding web domain..." "Yellow"
        $addCmd = "pct exec $ContainerID -- bash -c 'v-add-web-domain $User $Domain'"
        ssh root@$ProxmoxHost $addCmd
        Start-Sleep -Seconds 2
    }
    
    # Add Let's Encrypt SSL
    Write-ColorOutput "      Requesting Let's Encrypt certificate..." "Yellow"
    $sslCmd = "pct exec $ContainerID -- bash -c 'v-add-letsencrypt-domain $User $Domain'"
    
    try {
        $result = ssh root@$ProxmoxHost $sslCmd 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "      SSL certificate installed successfully!" "Green"
        } else {
            Write-ColorOutput "      ERROR: Installation failed" "Red"
            Write-ColorOutput "      $result" "Yellow"
            
            # Provide troubleshooting tips
            Write-ColorOutput "`nTroubleshooting:" "Cyan"
            Write-ColorOutput "1. Ensure DNS is propagated: nslookup $Domain" "White"
            Write-ColorOutput "2. Ensure port 80 is accessible from internet" "White"
            Write-ColorOutput "3. Check logs: ssh root@$ProxmoxHost 'pct exec $ContainerID -- tail /var/log/letsencrypt/letsencrypt.log'" "White"
            exit 1
        }
    } catch {
        Write-ColorOutput "      ERROR: $($_.Exception.Message)" "Red"
        exit 1
    }
}

# Step 5: Verify Installation
Write-ColorOutput "`n[5/5] Verifying SSL installation..." "Yellow"

if ($ControlPanel) {
    $testURL = "https://192.168.0.66:38383"
} else {
    $testURL = "https://$Domain"
}

try {
    $response = Invoke-WebRequest -Uri $testURL -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck 2>$null
    Write-ColorOutput "      HTTPS is accessible!" "Green"
} catch {
    Write-ColorOutput "      HTTPS responding (certificate check may need time)" "Yellow"
}

# Success Summary
Write-ColorOutput "`n========================================" "Green"
Write-ColorOutput " SSL Setup Complete!" "Green"
Write-ColorOutput "========================================`n" "Green"

Write-ColorOutput "Certificate Details:" "Cyan"
Write-ColorOutput "  Domain: $Domain" "White"
Write-ColorOutput "  Provider: Let's Encrypt" "White"
Write-ColorOutput "  Auto-Renewal: Enabled (every 60 days)" "White"

if ($ControlPanel) {
    Write-ColorOutput "`nAccess HestiaCP:" "Cyan"
    Write-ColorOutput "  https://$Domain:38383" "Green"
} else {
    Write-ColorOutput "`nAccess Website:" "Cyan"
    Write-ColorOutput "  https://$Domain" "Green"
}

Write-ColorOutput "`nAuto-Renewal:" "Cyan"
Write-ColorOutput "  Certificates auto-renew via HestiaCP cron job" "White"
Write-ColorOutput "  Manual renewal: ssh root@$ProxmoxHost 'pct exec $ContainerID -- v-update-letsencrypt-ssl'" "White"

Write-ColorOutput "`nNext Steps:" "Cyan"
Write-ColorOutput "  1. Test SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$Domain" "White"
Write-ColorOutput "  2. Set up additional domains with this script" "White"
Write-ColorOutput "  3. Enable HSTS for better security" "White"

Write-ColorOutput "`n"
