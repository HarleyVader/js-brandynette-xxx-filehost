# 🔒 Let's Encrypt SSL Certificate Setup Guide

**Date:** November 16, 2025  
**Container:** LXC 101 (bambiOSdumbOS)  
**IP:** 192.168.0.66  
**HestiaCP Port:** 38383

---

## 📋 Current SSL Status

✅ **Self-Signed Certificate Active**
- Location: `/usr/local/hestia/ssl/`
- Valid for: HestiaCP control panel (port 38383)
- Expiration: Generated during installation
- Security: Encrypted but browsers show warning

⏳ **Let's Encrypt Setup Required**
- Requires: Valid DNS A record pointing to public IP
- Benefit: Browser-trusted certificates (no warnings)
- Auto-renewal: Yes (every 60 days)

---

## 🌐 Prerequisites for Let's Encrypt

### 1. DNS Configuration Required

You **MUST** configure DNS before Let's Encrypt will work:

```dns
; A Record - Point to your PUBLIC IP (not 192.168.0.66)
bambi.bambisleep.church.    IN  A       YOUR_PUBLIC_IP

; Or if using domain for control panel
panel.bambisleep.church.    IN  A       YOUR_PUBLIC_IP
```

**How to find your public IP:**
```powershell
# From Windows
(Invoke-WebRequest -Uri "https://ifconfig.me/ip").Content

# Or visit
Start-Process "https://whatismyip.com"
```

### 2. Port Forwarding Required

Configure your router to forward ports to 192.168.0.66:

| External Port | Internal IP   | Internal Port | Protocol |
|---------------|---------------|---------------|----------|
| 80            | 192.168.0.66  | 80            | TCP      |
| 443           | 192.168.0.66  | 443           | TCP      |
| 38383         | 192.168.0.66  | 38383         | TCP      |

**Why port 80/443?** Let's Encrypt validation requires HTTP (80) or HTTPS (443) to verify domain ownership.

### 3. Firewall Configuration

Ensure ports are open on the container:

```bash
# SSH into container
ssh root@192.168.0.100 "pct enter 101"

# Check firewall rules
iptables -L -n | grep -E "80|443"

# If ports blocked, allow them
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# Save rules (if using iptables-persistent)
netfilter-persistent save
```

---

## 🚀 Let's Encrypt Setup Methods

### Method 1: HestiaCP Control Panel (Easiest)

1. **Add Domain First:**
   ```
   Login: https://192.168.0.66:38383
   Navigate: WEB → Add Web Domain
   Domain: bambi.bambisleep.church
   ```

2. **Enable SSL for Domain:**
   ```
   WEB → bambi.bambisleep.church → SSL Certificate
   Select: Let's Encrypt
   Click: Add SSL Certificate
   ```

3. **Enable SSL for Control Panel:**
   ```
   Navigate: SERVER → Configure → SSL Certificate
   Select: Let's Encrypt
   Hostname: bambi.bambisleep.church
   Click: Add SSL Certificate
   ```

### Method 2: HestiaCP CLI (Advanced)

```bash
# SSH into container
ssh root@192.168.0.100 "pct enter 101"

# Add Let's Encrypt SSL for web domain
v-add-letsencrypt-domain bambi bambisleep.church www

# Add Let's Encrypt SSL for control panel hostname
v-add-letsencrypt-host

# Or specify different hostname
v-add-letsencrypt-host panel.bambisleep.church

# Check SSL status
v-list-web-domain-ssl bambi bambisleep.church
```

### Method 3: Manual Certbot (Maximum Control)

```bash
# SSH into container
ssh root@192.168.0.100 "pct enter 101"

# Install certbot (should already be installed)
apt install certbot -y

# Generate certificate (standalone mode)
certbot certonly --standalone \
  --preferred-challenges http \
  --email bambi@bambisleep.church \
  --agree-tos \
  --no-eff-email \
  -d bambi.bambisleep.church

# Or use webroot mode (if NGINX already running)
certbot certonly --webroot \
  -w /home/bambi/web/bambisleep.church/public_html \
  --email bambi@bambisleep.church \
  --agree-tos \
  -d bambi.bambisleep.church \
  -d www.bambisleep.church

# Install certificate to HestiaCP
v-add-web-domain-ssl-force bambi bambisleep.church \
  /etc/letsencrypt/live/bambi.bambisleep.church

# Copy to HestiaCP control panel
cp /etc/letsencrypt/live/bambi.bambisleep.church/fullchain.pem \
   /usr/local/hestia/ssl/certificate.crt
cp /etc/letsencrypt/live/bambi.bambisleep.church/privkey.pem \
   /usr/local/hestia/ssl/certificate.key

# Set correct permissions
chown root:mail /usr/local/hestia/ssl/certificate.*
chmod 660 /usr/local/hestia/ssl/certificate.*

# Restart HestiaCP
systemctl restart hestia
```

---

## 🔄 Auto-Renewal Configuration

Let's Encrypt certificates expire every 90 days. HestiaCP handles renewal automatically.

### Verify Auto-Renewal is Active

```bash
# SSH into container
ssh root@192.168.0.100 "pct enter 101"

# Check HestiaCP cron job
cat /etc/cron.d/hestia | grep letsencrypt

# Should see something like:
# */5 * * * * root /usr/local/hestia/bin/v-update-letsencrypt-ssl

# Manually test renewal (dry run)
v-update-letsencrypt-ssl

# Or test with certbot
certbot renew --dry-run
```

### Manual Renewal

If auto-renewal fails:

```bash
# Renew all certificates
certbot renew

# Renew specific domain
certbot renew --cert-name bambi.bambisleep.church

# Force renewal (even if not expiring soon)
certbot renew --force-renewal

# After renewal, restart services
systemctl restart nginx
systemctl restart apache2
systemctl restart hestia
```

---

## 🛠️ PowerShell Automation Script

Save this as `setup-letsencrypt.ps1`:

```powershell
# Let's Encrypt Setup Script for HestiaCP
param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [string]$Email = "bambi@bambisleep.church",
    
    [switch]$ControlPanel
)

$ProxmoxHost = "192.168.0.100"
$ContainerID = "101"

Write-Host "🔒 Setting up Let's Encrypt SSL for $Domain" -ForegroundColor Cyan

# Test DNS resolution
Write-Host "`nTesting DNS resolution..." -ForegroundColor Yellow
$dnsResult = Resolve-DnsName $Domain -ErrorAction SilentlyContinue

if (-not $dnsResult) {
    Write-Host "❌ ERROR: Domain $Domain does not resolve" -ForegroundColor Red
    Write-Host "Configure DNS A record first!" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DNS resolves to: $($dnsResult.IPAddress)" -ForegroundColor Green

# Test port accessibility
Write-Host "`nTesting HTTP port 80..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName $Domain -Port 80 -WarningAction SilentlyContinue

if (-not $portTest.TcpTestSucceeded) {
    Write-Host "⚠️  WARNING: Port 80 not accessible" -ForegroundColor Yellow
    Write-Host "Let's Encrypt validation may fail without port 80" -ForegroundColor Yellow
}

# Install Let's Encrypt
Write-Host "`nInstalling Let's Encrypt certificate..." -ForegroundColor Cyan

if ($ControlPanel) {
    # For control panel hostname
    Write-Host "Installing SSL for HestiaCP control panel..." -ForegroundColor Yellow
    ssh root@$ProxmoxHost "pct exec $ContainerID -- v-add-letsencrypt-host $Domain"
} else {
    # For web domain
    Write-Host "Installing SSL for web domain..." -ForegroundColor Yellow
    $domainParts = $Domain -split '\.'
    $user = "bambi"
    
    # Add domain if it doesn't exist
    ssh root@$ProxmoxHost "pct exec $ContainerID -- v-add-web-domain $user $Domain"
    
    # Add Let's Encrypt SSL
    ssh root@$ProxmoxHost "pct exec $ContainerID -- v-add-letsencrypt-domain $user $Domain"
}

Write-Host "`n✅ Let's Encrypt setup complete!" -ForegroundColor Green
Write-Host "Certificate will auto-renew every 60 days" -ForegroundColor Cyan
```

**Usage:**
```powershell
# For web domain
.\setup-letsencrypt.ps1 -Domain "bambisleep.church"

# For control panel
.\setup-letsencrypt.ps1 -Domain "bambi.bambisleep.church" -ControlPanel

# Custom email
.\setup-letsencrypt.ps1 -Domain "bambisleep.church" -Email "admin@example.com"
```

---

## 🐛 Troubleshooting

### Issue: "DNS record doesn't exist"

**Solution:**
```bash
# Test DNS from container
ssh root@192.168.0.100 "pct exec 101 -- dig bambi.bambisleep.church"

# Should return your public IP, not 192.168.0.66
# If returns no IP, configure DNS at your domain registrar
```

### Issue: "Connection timeout" or "Port 80 not accessible"

**Solution:**
```bash
# 1. Check if NGINX is listening
ssh root@192.168.0.100 "pct exec 101 -- netstat -tulpn | grep :80"

# 2. Check firewall
ssh root@192.168.0.100 "pct exec 101 -- iptables -L -n | grep 80"

# 3. Configure router port forwarding
# External 80 → 192.168.0.66:80

# 4. Test from outside network
# Visit: http://bambi.bambisleep.church
```

### Issue: "Certificate validation failed"

**Solution:**
```bash
# Check Let's Encrypt logs
ssh root@192.168.0.100 "pct exec 101 -- tail -50 /var/log/letsencrypt/letsencrypt.log"

# Common causes:
# - DNS not pointing to correct IP
# - Port 80/443 not forwarded
# - Domain not accessible from internet
# - Rate limit exceeded (5 attempts per hour)
```

### Issue: "Too many certificates already issued"

Let's Encrypt has rate limits:
- 50 certificates per domain per week
- 5 duplicate certificates per week

**Solution:**
```bash
# Wait 7 days, or use staging server for testing
certbot certonly --staging \
  --standalone \
  -d bambi.bambisleep.church \
  --email bambi@bambisleep.church \
  --agree-tos
```

### Issue: Auto-renewal not working

**Solution:**
```bash
# Check cron job
ssh root@192.168.0.100 "pct exec 101 -- systemctl status cron"

# Test renewal manually
ssh root@192.168.0.100 "pct exec 101 -- certbot renew --dry-run"

# Check renewal logs
ssh root@192.168.0.100 "pct exec 101 -- cat /var/log/letsencrypt/letsencrypt.log | grep renewal"

# Re-add auto-renewal if missing
ssh root@192.168.0.100 "pct exec 101 -- bash -c 'echo \"0 0,12 * * * root certbot renew --quiet\" >> /etc/crontab'"
```

---

## 📊 SSL Certificate Status Check

Quick script to verify SSL status:

```powershell
# Save as check-ssl.ps1
$Domain = "bambi.bambisleep.church"
$Port = 38383

Write-Host "`n🔒 SSL Certificate Check for $Domain`:$Port`n" -ForegroundColor Cyan

# Get certificate info
$cert = $null
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient($Domain, $Port)
    $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream())
    $sslStream.AuthenticateAsClient($Domain)
    $cert = $sslStream.RemoteCertificate
    $tcpClient.Close()
    
    Write-Host "✅ Certificate Found" -ForegroundColor Green
    Write-Host "Issued To: $($cert.Subject)" -ForegroundColor White
    Write-Host "Issued By: $($cert.Issuer)" -ForegroundColor White
    Write-Host "Valid From: $($cert.GetEffectiveDateString())" -ForegroundColor White
    Write-Host "Valid Until: $($cert.GetExpirationDateString())" -ForegroundColor White
    
    $daysRemaining = ([DateTime]$cert.GetExpirationDateString() - (Get-Date)).Days
    
    if ($daysRemaining -lt 30) {
        Write-Host "⚠️  WARNING: Certificate expires in $daysRemaining days!" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Certificate valid for $daysRemaining days" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ ERROR: Could not retrieve certificate" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}
```

---

## 🎯 Quick Setup Checklist

Before running Let's Encrypt setup:

- [ ] **Public IP identified** - Run `(Invoke-WebRequest ifconfig.me/ip).Content`
- [ ] **DNS A record configured** - Point bambi.bambisleep.church to public IP
- [ ] **DNS propagated** - Wait 5-60 minutes, verify with `nslookup bambisleep.church`
- [ ] **Router port forwarding** - 80 and 443 to 192.168.0.66
- [ ] **Firewall open** - Ports 80, 443 allowed on container
- [ ] **Domain accessible** - Visit http://bambi.bambisleep.church (should load)

Once all checked:

```powershell
# Run status check
.\scripts\quick-status.ps1

# Add Let's Encrypt SSL via HestiaCP web interface
Start-Process "https://192.168.0.66:38383"
# Navigate to SERVER → SSL Certificate → Add Let's Encrypt
```

---

## 📚 Additional Resources

- **Let's Encrypt Docs:** https://letsencrypt.org/docs/
- **HestiaCP SSL Guide:** https://docs.hestiacp.com/user_guide/ssl_certificates.html
- **Certbot Documentation:** https://certbot.eff.org/docs/
- **DNS Propagation Check:** https://dnschecker.org/
- **SSL Test:** https://www.ssllabs.com/ssltest/

---

## 🔐 Security Best Practices

1. **Use Strong Encryption:**
   - Let's Encrypt uses modern ciphers by default
   - HestiaCP configured for TLS 1.2+ only

2. **Monitor Certificate Expiration:**
   ```bash
   # Set up email alerts
   echo "MAILTO=bambi@bambisleep.church" >> /etc/crontab
   ```

3. **Enable HSTS (HTTP Strict Transport Security):**
   ```bash
   # Add to NGINX config
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   ```

4. **Disable Weak Protocols:**
   - HestiaCP disables SSLv2/SSLv3 by default
   - Only TLS 1.2 and TLS 1.3 enabled

5. **Regular Security Updates:**
   ```bash
   apt update && apt upgrade -y
   ```

---

**Current Status:** Self-signed certificate active  
**Next Step:** Configure DNS, then run Let's Encrypt setup  
**Auto-Renewal:** Will be enabled automatically after setup  

**Questions?** See [HESTIACP-SETUP.md](./HESTIACP-SETUP.md) for more details.
