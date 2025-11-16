#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check SSL certificate status for HestiaCP domains
.DESCRIPTION
    Retrieves and displays SSL certificate information including expiration
.PARAMETER Domain
    Domain to check (default: 192.168.0.66)
.PARAMETER Port
    Port to check (default: 38383 for HestiaCP)
.EXAMPLE
    .\check-ssl-status.ps1
    .\check-ssl-status.ps1 -Domain "bambisleep.church" -Port 443
#>

param(
    [string]$Domain = "192.168.0.66",
    [int]$Port = 38383
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " SSL Certificate Status Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Target: $Domain`:$Port`n" -ForegroundColor White

# Get certificate info
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($Domain, $Port)
    $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream(), $false, { $true })
    $sslStream.AuthenticateAsClient($Domain)
    
    $cert = $sslStream.RemoteCertificate
    $cert2 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($cert)
    
    Write-Host "Certificate Information:" -ForegroundColor Yellow
    Write-Host "  Subject: $($cert2.Subject)" -ForegroundColor White
    Write-Host "  Issuer: $($cert2.Issuer)" -ForegroundColor White
    
    # Check if Let's Encrypt
    if ($cert2.Issuer -match "Let's Encrypt") {
        Write-Host "  Provider: Let's Encrypt" -ForegroundColor Green
        Write-Host "  Type: Trusted Certificate" -ForegroundColor Green
    } else {
        Write-Host "  Provider: Self-Signed or Other" -ForegroundColor Yellow
        Write-Host "  Type: Browser Warning Expected" -ForegroundColor Yellow
    }
    
    Write-Host "`nValidity Period:" -ForegroundColor Yellow
    Write-Host "  Valid From: $($cert2.NotBefore)" -ForegroundColor White
    Write-Host "  Valid Until: $($cert2.NotAfter)" -ForegroundColor White
    
    $daysRemaining = ($cert2.NotAfter - (Get-Date)).Days
    
    Write-Host "`nExpiration Status:" -ForegroundColor Yellow
    if ($daysRemaining -lt 0) {
        Write-Host "  EXPIRED $([Math]::Abs($daysRemaining)) days ago!" -ForegroundColor Red
    } elseif ($daysRemaining -lt 7) {
        Write-Host "  WARNING: Expires in $daysRemaining days!" -ForegroundColor Red
    } elseif ($daysRemaining -lt 30) {
        Write-Host "  Expires in $daysRemaining days" -ForegroundColor Yellow
    } else {
        Write-Host "  Valid for $daysRemaining days" -ForegroundColor Green
    }
    
    # Additional details
    Write-Host "`nCertificate Details:" -ForegroundColor Yellow
    Write-Host "  Serial Number: $($cert2.SerialNumber)" -ForegroundColor White
    Write-Host "  Thumbprint: $($cert2.Thumbprint)" -ForegroundColor White
    Write-Host "  Signature Algorithm: $($cert2.SignatureAlgorithm.FriendlyName)" -ForegroundColor White
    
    # SANs (Subject Alternative Names)
    $sans = $cert2.Extensions | Where-Object { $_.Oid.FriendlyName -eq "Subject Alternative Name" }
    if ($sans) {
        Write-Host "`nSubject Alternative Names (SANs):" -ForegroundColor Yellow
        $sanString = $sans.Format($false)
        $sanString -split ',' | ForEach-Object {
            Write-Host "  $($_.Trim())" -ForegroundColor White
        }
    }
    
    $sslStream.Close()
    $tcpClient.Close()
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " Certificate Check Complete" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Could not retrieve certificate" -ForegroundColor Red
    Write-Host "Reason: $($_.Exception.Message)" -ForegroundColor Yellow
    
    Write-Host "`nTroubleshooting:" -ForegroundColor Cyan
    Write-Host "  1. Ensure domain/IP is accessible: Test-NetConnection $Domain -Port $Port" -ForegroundColor White
    Write-Host "  2. Check firewall rules" -ForegroundColor White
    Write-Host "  3. Verify service is running: .\scripts\quick-status.ps1" -ForegroundColor White
    Write-Host "`n"
    exit 1
}
