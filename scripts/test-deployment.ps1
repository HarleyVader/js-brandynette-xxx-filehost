#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Comprehensive Brandynette Video Server Deployment Testing Script
.DESCRIPTION
    Tests all aspects of the Brandynette deployment including service status,
    API endpoints, performance, and security configuration.
#>

param(
    [string]$ContainerIP = "192.168.0.66",
    [int]$Port = 6969,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsWarning = 0

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = "",
        [switch]$Warning
    )
    
    if ($Warning) {
        Write-Host "⚠️  WARNING: $TestName" -ForegroundColor Yellow
        if ($Message) { Write-Host "   $Message" -ForegroundColor Yellow }
        $script:TestsWarning++
    }
    elseif ($Passed) {
        Write-Host "✅ PASS: $TestName" -ForegroundColor Green
        if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
        $script:TestsPassed++
    }
    else {
        Write-Host "❌ FAIL: $TestName" -ForegroundColor Red
        if ($Message) { Write-Host "   $Message" -ForegroundColor Red }
        $script:TestsFailed++
    }
}

# Test 1: Service Status
Write-TestHeader "SERVICE STATUS TESTS"

try {
    $serviceStatus = ssh root@192.168.0.100 "pct exec 101 -- systemctl is-active brandynette" 2>$null
    Write-TestResult "Service Active" ($serviceStatus -eq "active") "Status: $serviceStatus"
    
    $serviceEnabled = ssh root@192.168.0.100 "pct exec 101 -- systemctl is-enabled brandynette" 2>$null
    Write-TestResult "Service Enabled (Auto-start)" ($serviceEnabled -eq "enabled") "Status: $serviceEnabled"
    
    $servicePid = ssh root@192.168.0.100 "pct exec 101 -- systemctl show brandynette --property=MainPID --value" 2>$null
    Write-TestResult "Service Has PID" ($servicePid -gt 0) "PID: $servicePid"
}
catch {
    Write-TestResult "Service Status Check" $false $_.Exception.Message
}

# Test 2: Network Connectivity
Write-TestHeader "NETWORK CONNECTIVITY TESTS"

try {
    $tcpTest = Test-NetConnection -ComputerName $ContainerIP -Port $Port -WarningAction SilentlyContinue
    Write-TestResult "TCP Port $Port Reachable" $tcpTest.TcpTestSucceeded "From: $($tcpTest.SourceAddress.IPAddress)"
    
    $portListening = ssh root@192.168.0.100 "pct exec 101 -- netstat -tulpn | grep :$Port" 2>$null
    Write-TestResult "Port $Port Listening" ($portListening -match "LISTEN") "Process: node"
    
    # Test firewall
    $firewallRule = ssh root@192.168.0.100 "pct exec 101 -- iptables -L INPUT -n | grep $Port" 2>$null
    Write-TestResult "Firewall Rule Exists" ($firewallRule -ne $null) "Port $Port allowed"
}
catch {
    Write-TestResult "Network Connectivity Check" $false $_.Exception.Message
}

# Test 3: API Endpoints
Write-TestHeader "API ENDPOINT TESTS"

try {
    # Test /api/videos
    $videosUrl = "http://${ContainerIP}:${Port}/api/videos"
    $response = Invoke-WebRequest -Uri $videosUrl -UseBasicParsing -TimeoutSec 5
    Write-TestResult "GET /api/videos" ($response.StatusCode -eq 200) "Status: $($response.StatusCode)"
    
    $json = $response.Content | ConvertFrom-Json
    Write-TestResult "JSON Response Valid" ($json -ne $null) "Videos count: $($json.count)"
    
    # Test root endpoint
    $rootUrl = "http://${ContainerIP}:${Port}/"
    $rootResponse = Invoke-WebRequest -Uri $rootUrl -UseBasicParsing -TimeoutSec 5
    Write-TestResult "GET / (Frontend)" ($rootResponse.StatusCode -eq 200) "Content-Length: $($rootResponse.Content.Length)"
    
    $containsReact = $rootResponse.Content -match "react|React"
    Write-TestResult "Frontend Contains React" $containsReact
}
catch {
    Write-TestResult "API Endpoint Test" $false $_.Exception.Message
}

# Test 4: Performance Tests
Write-TestHeader "PERFORMANCE TESTS"

try {
    # Test response time
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $perfResponse = Invoke-WebRequest -Uri "http://${ContainerIP}:${Port}/api/videos" -UseBasicParsing
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    Write-TestResult "API Response Time < 1s" ($responseTime -lt 1000) "${responseTime}ms"
    
    # Memory usage
    $memInfo = ssh root@192.168.0.100 "pct exec 101 -- ps aux | grep 'node.*server.js' | grep -v grep" 2>$null
    if ($memInfo -match '(\d+\.\d+)\s+\d+\.\d+') {
        $memPercent = [double]$matches[1]
        Write-TestResult "Memory Usage < 5%" ($memPercent -lt 5.0) "${memPercent}%"
    }
    
    # CPU usage
    if ($memInfo -match '\d+\.\d+\s+(\d+\.\d+)') {
        $cpuPercent = [double]$matches[1]
        Write-TestResult "CPU Usage < 10%" ($cpuPercent -lt 10.0) "${cpuPercent}%"
    }
}
catch {
    Write-TestResult "Performance Test" $false $_.Exception.Message
}

# Test 5: Stress Test (Multiple Concurrent Requests)
Write-TestHeader "STRESS TEST (10 Concurrent Requests)"

try {
    $jobs = @()
    $startTime = Get-Date
    
    1..10 | ForEach-Object {
        $jobs += Start-Job -ScriptBlock {
            param($url)
            try {
                Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 | Select-Object StatusCode
            }
            catch {
                [PSCustomObject]@{ StatusCode = 0 }
            }
        } -ArgumentList "http://${ContainerIP}:${Port}/api/videos"
    }
    
    $results = $jobs | Wait-Job -Timeout 30 | Receive-Job
    $jobs | Remove-Job -Force
    
    $endTime = Get-Date
    $totalTime = ($endTime - $startTime).TotalMilliseconds
    
    $successCount = ($results | Where-Object { $_.StatusCode -eq 200 }).Count
    Write-TestResult "Concurrent Requests Handled" ($successCount -eq 10) "$successCount/10 successful in ${totalTime}ms"
    
    Write-TestResult "Average Response Time" ($totalTime/10 -lt 2000) "$([math]::Round($totalTime/10, 2))ms per request"
}
catch {
    Write-TestResult "Stress Test" $false $_.Exception.Message
}

# Test 6: Security Headers
Write-TestHeader "SECURITY TESTS"

try {
    $secResponse = Invoke-WebRequest -Uri "http://${ContainerIP}:${Port}/" -UseBasicParsing
    
    # Check for security headers (Helmet.js)
    $hasXFrameOptions = $secResponse.Headers.ContainsKey("X-Frame-Options")
    Write-TestResult "X-Frame-Options Header" $hasXFrameOptions "Clickjacking protection"
    
    $hasXContentType = $secResponse.Headers.ContainsKey("X-Content-Type-Options")
    Write-TestResult "X-Content-Type-Options Header" $hasXContentType "MIME-sniffing protection"
    
    $hasXXSSProtection = $secResponse.Headers.ContainsKey("X-XSS-Protection") -or $secResponse.Headers.ContainsKey("X-Content-Security-Policy")
    Write-TestResult "XSS Protection Headers" $hasXXSSProtection -Warning:(!$hasXXSSProtection)
    
    # CORS check
    $hasCORS = $secResponse.Headers.ContainsKey("Access-Control-Allow-Origin")
    if ($hasCORS) {
        Write-TestResult "CORS Configured" $true $secResponse.Headers["Access-Control-Allow-Origin"]
    }
}
catch {
    Write-TestResult "Security Headers Test" $false $_.Exception.Message
}

# Test 7: File System
Write-TestHeader "FILE SYSTEM TESTS"

try {
    # Check deployment directory
    $deployDir = ssh root@192.168.0.100 "pct exec 101 -- test -d /opt/brandynette && echo EXISTS" 2>$null
    Write-TestResult "Deployment Directory Exists" ($deployDir -eq "EXISTS") "/opt/brandynette"
    
    # Check critical files
    $serverFile = ssh root@192.168.0.100 "pct exec 101 -- test -f /opt/brandynette/src/server.js && echo EXISTS" 2>$null
    Write-TestResult "Server File Exists" ($serverFile -eq "EXISTS") "/opt/brandynette/src/server.js"
    
    $indexFile = ssh root@192.168.0.100 "pct exec 101 -- test -f /opt/brandynette/public/index.html && echo EXISTS" 2>$null
    Write-TestResult "Frontend File Exists" ($indexFile -eq "EXISTS") "/opt/brandynette/public/index.html"
    
    $brandFolder = ssh root@192.168.0.100 "pct exec 101 -- test -d /opt/brandynette/BRANDIFICATION && echo EXISTS" 2>$null
    Write-TestResult "Video Folder Exists" ($brandFolder -eq "EXISTS") "/opt/brandynette/BRANDIFICATION"
    
    # Check node_modules
    $nodeModules = ssh root@192.168.0.100 "pct exec 101 -- test -d /opt/brandynette/node_modules && echo EXISTS" 2>$null
    Write-TestResult "Dependencies Installed" ($nodeModules -eq "EXISTS") "node_modules directory"
    
    # Check service file
    $serviceFile = ssh root@192.168.0.100 "pct exec 101 -- test -f /etc/systemd/system/brandynette.service && echo EXISTS" 2>$null
    Write-TestResult "Systemd Service File Exists" ($serviceFile -eq "EXISTS") "/etc/systemd/system/brandynette.service"
}
catch {
    Write-TestResult "File System Test" $false $_.Exception.Message
}

# Test 8: Node.js Environment
Write-TestHeader "NODE.JS ENVIRONMENT TESTS"

try {
    $nodeVersion = ssh root@192.168.0.100 "pct exec 101 -- node --version" 2>$null
    Write-TestResult "Node.js Installed" ($nodeVersion -match "v\d+\.\d+\.\d+") "Version: $nodeVersion"
    
    $npmVersion = ssh root@192.168.0.100 "pct exec 101 -- npm --version" 2>$null
    Write-TestResult "npm Installed" ($npmVersion -match "\d+\.\d+\.\d+") "Version: $npmVersion"
    
    # Check for vulnerabilities
    $auditResult = ssh root@192.168.0.100 "pct exec 101 -- bash -c 'cd /opt/brandynette && npm audit --json 2>/dev/null'" 2>$null
    if ($auditResult) {
        $audit = $auditResult | ConvertFrom-Json
        $vulnCount = $audit.metadata.vulnerabilities.total
        Write-TestResult "No Security Vulnerabilities" ($vulnCount -eq 0) "Total vulnerabilities: $vulnCount"
    }
}
catch {
    Write-TestResult "Node.js Environment Test" $false $_.Exception.Message
}

# Test 9: Container Health
Write-TestHeader "CONTAINER HEALTH TESTS"

try {
    $containerStatus = ssh root@192.168.0.100 "pct status 101" 2>$null
    Write-TestResult "Container Running" ($containerStatus -eq "status: running") "Status: $containerStatus"
    
    # Check container resources
    $containerConfig = ssh root@192.168.0.100 "pct config 101" 2>$null
    Write-TestResult "Container Configuration Accessible" ($containerConfig -ne $null)
    
    # Check disk space
    $diskSpace = ssh root@192.168.0.100 "pct exec 101 -- df -h / | tail -1" 2>$null
    if ($diskSpace -match '(\d+)%') {
        $diskUsage = [int]$matches[1]
        Write-TestResult "Disk Space Available" ($diskUsage -lt 80) "Usage: ${diskUsage}%"
    }
    
    # Check memory
    $memUsage = ssh root@192.168.0.100 "pct exec 101 -- free -m | grep Mem" 2>$null
    if ($memUsage -match 'Mem:\s+(\d+)\s+(\d+)') {
        $totalMem = [int]$matches[1]
        $usedMem = [int]$matches[2]
        $memPercent = [math]::Round(($usedMem / $totalMem) * 100, 1)
        Write-TestResult "Memory Available" ($memPercent -lt 90) "Usage: ${memPercent}%"
    }
}
catch {
    Write-TestResult "Container Health Test" $false $_.Exception.Message
}

# Test 10: Logs Check
Write-TestHeader "LOG ANALYSIS"

try {
    $recentLogs = ssh root@192.168.0.100 "pct exec 101 -- journalctl -u brandynette -n 50 --no-pager" 2>$null
    
    $errorCount = ($recentLogs | Select-String -Pattern "error|Error|ERROR" -AllMatches).Matches.Count
    Write-TestResult "No Recent Errors in Logs" ($errorCount -eq 0) "Errors found: $errorCount" -Warning:($errorCount -gt 0)
    
    $startupMessage = $recentLogs | Select-String -Pattern "Server running"
    Write-TestResult "Server Startup Message Found" ($startupMessage -ne $null) "Server initialized successfully"
    
    $hasPort = $recentLogs | Select-String -Pattern "6969"
    Write-TestResult "Correct Port in Logs" ($hasPort -ne $null) "Listening on port 6969"
}
catch {
    Write-TestResult "Log Analysis Test" $false $_.Exception.Message
}

# Summary
Write-TestHeader "TEST SUMMARY"

$totalTests = $script:TestsPassed + $script:TestsFailed + $script:TestsWarning
$passRate = if ($totalTests -gt 0) { [math]::Round(($script:TestsPassed / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Tests:    $totalTests" -ForegroundColor White
Write-Host "Passed:         $script:TestsPassed" -ForegroundColor Green
Write-Host "Failed:         $script:TestsFailed" -ForegroundColor Red
Write-Host "Warnings:       $script:TestsWarning" -ForegroundColor Yellow
Write-Host "Pass Rate:      $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })

Write-Host "`n========================================" -ForegroundColor Cyan

if ($script:TestsFailed -eq 0) {
    Write-Host "🎉 ALL CRITICAL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Brandynette Video Server is PRODUCTION READY!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  SOME TESTS FAILED - Review Required" -ForegroundColor Red
    exit 1
}
