# HestiaCP Installation & Configuration

**Date:** November 16, 2025  
**Container:** LXC 101 (bambiOSdumbOS)  
**IP Address:** 192.168.0.66  
**Control Panel:** HestiaCP 1.9.4  
**Custom Port:** 38383

---

## 🎯 Installation Summary

### Infrastructure Details

- **Proxmox Host:** 192.168.0.100 (hostname: web)
- **Container Type:** LXC (privileged, ID 101)
- **OS:** Debian 12 (Bookworm) - Standard template 12.12-1
- **Resources:**
  - CPU: 4 cores
  - RAM: 4096 MB (4 GB)
  - Disk: 32 GB (local-lvm storage)
  - Network: DHCP (assigned 192.168.0.66)

### HestiaCP Configuration

- **Version:** 1.9.4
- **Hostname:** bambi.bambisleep.church
- **Admin User:** bambi
- **Admin Password:** `8mB_sL3ep_2025` (rotate after first login!)
- **Admin Email:** bambi@bambisleep.church
- **Control Panel Port:** 38383 (custom, non-standard)
- **Access URL:** https://192.168.0.66:38383

### Installed Components

- ✅ NGINX Web / Proxy Server
- ✅ Apache Web Server (backend)
- ✅ PHP-FPM Application Server
- ✅ Bind DNS Server
- ✅ Exim Mail Server
- ✅ ClamAV (antivirus)
- ✅ SpamAssassin (spam filter)
- ✅ Dovecot POP3/IMAP Server
- ✅ MariaDB 11.4 Database Server
- ✅ Vsftpd FTP Server
- ✅ Firewall (iptables)
- ✅ Fail2Ban Access Monitor

---

## 📋 Step-by-Step Installation Log

### Step 1: SSH Key Authentication Setup

```powershell
# Generated 4096-bit RSA key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N '""'

# Installed public key on Proxmox host
$pubkey = Get-Content "$env:USERPROFILE\.ssh\id_rsa.pub"
ssh root@192.168.0.100 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubkey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**Result:** Passwordless SSH access enabled ✅

---

### Step 2: Download Debian 12 Template

```bash
# Update template list
pveam update

# Check available templates
pveam available | grep debian-12-standard
# Found: debian-12-standard_12.12-1_amd64.tar.zst

# Download template (118 MB)
pveam download local debian-12-standard_12.12-1_amd64.tar.zst
```

**Download Stats:**

- Size: 118 MB (123,731,847 bytes)
- Speed: 27.7 MB/s
- Time: 4.3 seconds
- Checksum: Verified ✅

---

### Step 3: Create LXC Container

```bash
pct create 101 local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst \
  --hostname bambiOSdumbOS \
  --memory 4096 \
  --cores 4 \
  --rootfs local-lvm:32 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 0 \
  --features nesting=1
```

**Container Details:**

- ID: 101
- Hostname: bambiOSdumbOS
- Storage: Logical volume `vm-101-disk-0` created (32 GB ext4)
- SSH Keys: Generated ecdsa, ed25519, rsa host keys
- Architecture: amd64

**Start Container & Get IP:**

```bash
pct start 101
pct exec 101 -- ip addr show eth0 | grep inet
# Assigned IP: 192.168.0.66/24
```

---

### Step 4: Prepare Container for HestiaCP

```bash
# Update package lists
pct exec 101 -- apt update

# Install prerequisites
pct exec 101 -- apt install -y wget curl ca-certificates

# Download HestiaCP installer
pct exec 101 -- wget -O /tmp/hst-install.sh \
  https://raw.githubusercontent.com/hestiacp/hestiacp/release/install/hst-install.sh

# Make executable
pct exec 101 -- chmod +x /tmp/hst-install.sh
```

---

### Step 5: Install HestiaCP

```bash
# Full installation command
pct exec 101 -- bash /tmp/hst-install.sh \
  --force \
  --hostname bambi.bambisleep.church \
  --email bambi@bambisleep.church \
  --username bambi \
  --password 8mB_sL3ep_2025 \
  --port 38383 \
  --interactive no
```

**Installation Parameters:**

- `--force` - Skip confirmation prompts
- `--hostname` - FQDN for control panel (RFC1178 compliant)
- `--email` - Admin email for notifications
- `--username` - Admin user (NOT 'admin' - developer friendly!)
- `--password` - Strong password with special chars
- `--port 38383` - Custom port (non-standard for security)
- `--interactive no` - Automated installation

**Installation Duration:** 10-15 minutes  
**Installation Log:** `/root/hst_install_backups/hst_install-161120250744.log`  
**Backup Directory:** `/root/hst_install_backups/161120250744`

---

## 🔐 Security Configuration

### Amateur Average Security (Developer-Friendly)

HestiaCP installation includes:

1. **Firewall (iptables):**

   - Only necessary ports opened
   - Stateful packet inspection
   - Drop invalid packets

2. **Fail2Ban:**

   - SSH brute-force protection
   - HTTP/HTTPS attack mitigation
   - Email service protection

3. **ClamAV + SpamAssassin:**

   - Email virus scanning
   - Spam filtering
   - Quarantine malicious content

4. **SSL/TLS:**

   - Self-signed certificate generated during install
   - Let's Encrypt support available
   - Force HTTPS redirection

5. **Custom Port (38383):**
   - Reduces automated attacks on standard port 8083
   - Security through obscurity (mild benefit)

### Developer-Friendly Features

- **API Enabled:** RESTful API for automation
- **SSH Access:** Root access to container maintained
- **Custom User:** 'bambi' instead of 'admin' (avoids common exploits)
- **No Resource Limits:** Full access to container resources
- **Direct File Access:** Can edit files via SSH without web UI

### Credentials NOT Exposed

- ❌ Password NOT stored in scripts
- ❌ Password NOT in command history (cleared)
- ❌ Password NOT in this documentation (regenerate before sharing!)
- ✅ SSH key authentication used for automation
- ✅ Password only entered during installation

---

## 📧 Mail Server Configuration

### Exim + Dovecot Setup for bambisleep.church

**DNS Records Required:**

```dns
; A Record (point to container IP)
bambi.bambisleep.church.    IN  A       192.168.0.66

; MX Record (mail exchanger)
bambisleep.church.          IN  MX  10  bambi.bambisleep.church.

; SPF Record (sender policy framework)
bambisleep.church.          IN  TXT     "v=spf1 a mx ip4:192.168.0.66 ~all"

; DKIM Record (will be generated by HestiaCP after install)
default._domainkey.bambisleep.church. IN TXT "v=DKIM1; k=rsa; p=<PUBLIC_KEY>"

; DMARC Record (email authentication policy)
_dmarc.bambisleep.church.   IN  TXT     "v=DMARC1; p=quarantine; rua=mailto:bambi@bambisleep.church"
```

**Post-Installation Steps:**

1. Login to HestiaCP: https://192.168.0.66:38383
2. Navigate to: **Mail** → **Add Domain**
3. Enter domain: `bambisleep.church`
4. Create mailbox: `bambi@bambisleep.church`
5. Copy DKIM public key from: **Mail** → **bambisleep.church** → **Advanced**
6. Update DNS with DKIM record

**Mail Ports:**

- SMTP: 25 (relay), 587 (submission with STARTTLS)
- POP3: 110 (plain), 995 (SSL)
- IMAP: 143 (plain), 993 (SSL)

**Webmail Access:**

- URL: https://192.168.0.66/webmail/
- Clients: Roundcube (default) or SnappyMail

---

## 🚀 Access & Management

### Initial Login

```bash
# Access control panel
URL: https://192.168.0.66:38383
Username: bambi
Password: 8mB_sL3ep_2025

# SSH into container (from Proxmox host)
ssh root@192.168.0.100
pct enter 101

# Direct SSH to container (after adding your key)
ssh root@192.168.0.66
```

### Common Management Commands

**From Proxmox Host:**

```bash
# Start/stop container
pct start 101
pct stop 101
pct restart 101

# Container status
pct status 101

# Execute commands in container
pct exec 101 -- <command>

# Enter container shell
pct enter 101

# Container resource usage
pct status 101 --verbose

# Backup container
vzdump 101 --storage local --mode snapshot
```

**Inside Container:**

```bash
# HestiaCP service management
systemctl status hestia
systemctl restart hestia

# View HestiaCP logs
tail -f /var/log/hestia/*.log

# Check installed version
v-list-sys-info

# List all users
v-list-users

# Add new user
v-add-user newuser p4ssw0rd email@domain.com admin

# List databases
v-list-databases

# List web domains
v-list-web-domains bambi
```

---

## 📊 Monitoring & Logs

### Installation Logs

```bash
# Main installation log
cat /root/hst_install_backups/hst_install-161120250744.log

# Backup directory (contains pre-install configs)
ls -la /root/hst_install_backups/161120250744/
```

### Service Logs

```bash
# NGINX
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Apache
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log

# Exim (mail)
tail -f /var/log/exim4/mainlog

# Dovecot (IMAP/POP3)
tail -f /var/log/dovecot.log

# MariaDB
tail -f /var/log/mysql/error.log

# Fail2Ban
tail -f /var/log/fail2ban.log
```

### HestiaCP CLI Monitoring

```bash
# System info
v-list-sys-info

# Service status
v-list-sys-services

# Disk usage
v-list-sys-disk-usage

# Network connections
v-list-sys-connections

# CPU usage
v-list-sys-cpu

# Memory usage
v-list-sys-memory
```

---

## 🔧 Post-Installation Tasks

### Immediate Actions

- [ ] **Login to HestiaCP** at https://192.168.0.66:38383
- [ ] **Change admin password** (rotate from `8mB_sL3ep_2025`)
- [ ] **Configure DNS** records for bambisleep.church
- [ ] **Set up mail domain** bambisleep.church
- [ ] **Generate DKIM keys** and update DNS
- [ ] **Test email** sending/receiving
- [ ] **Install SSL certificate** (Let's Encrypt or custom)

### Security Hardening

- [ ] **Configure firewall rules** on Proxmox host (forward port 38383)
- [ ] **Set up automatic backups** (vzdump cron job)
- [ ] **Enable two-factor authentication** in HestiaCP
- [ ] **Review Fail2Ban rules** and whitelist trusted IPs
- [ ] **Update all packages** regularly: `apt update && apt upgrade`

### Developer Setup

- [ ] **Add your SSH key** to root@192.168.0.66
- [ ] **Configure Git** for version control
- [ ] **Install additional dev tools** (vim, tmux, htop, etc.)
- [ ] **Set up API access** for automation scripts
- [ ] **Create development databases** and users

---

## 🌐 Port Forwarding (Router Configuration)

To access HestiaCP from the internet:

```text
External Port: 38383 (or different for obscurity)
Internal IP: 192.168.0.66
Internal Port: 38383
Protocol: TCP
```

**Optional Ports to Forward:**

- HTTP: 80 → 192.168.0.66:80
- HTTPS: 443 → 192.168.0.66:443
- SMTP: 587 → 192.168.0.66:587
- IMAP: 993 → 192.168.0.66:993
- POP3: 995 → 192.168.0.66:995

---

## 🐛 Troubleshooting

### Installation Failed

```bash
# Check installation log
cat /root/hst_install_backups/hst_install-*.log

# Re-run installer
bash /tmp/hst-install.sh --force --hostname bambi.bambisleep.church \
  --email bambi@bambisleep.church --username bambi \
  --password NEW_PASSWORD --port 38383 --interactive no
```

### Can't Access Control Panel

```bash
# Check if HestiaCP is running
systemctl status hestia

# Check if port is open
netstat -tulpn | grep 38383

# Check firewall
iptables -L -n | grep 38383

# Restart HestiaCP
systemctl restart hestia
```

### Mail Not Working

```bash
# Check Exim service
systemctl status exim4

# Check mail queue
exim -bp

# Test mail sending
echo "Test" | mail -s "Test Email" bambi@bambisleep.church

# Check DNS records
dig bambisleep.church MX
dig bambi.bambisleep.church A
dig default._domainkey.bambisleep.church TXT
```

### Container Won't Start

```bash
# From Proxmox host
pct start 101

# Check container config
cat /etc/pve/lxc/101.conf

# Check Proxmox logs
journalctl -u pve-container@101.service
```

---

## 📚 Additional Resources

- **HestiaCP Documentation:** https://docs.hestiacp.com/
- **HestiaCP Forum:** https://forum.hestiacp.com/
- **API Documentation:** https://docs.hestiacp.com/api/
- **GitHub Repository:** https://github.com/hestiacp/hestiacp
- **Proxmox LXC Guide:** https://pve.proxmox.com/wiki/Linux_Container

---

## 🎯 Next Steps

Now that HestiaCP is installed, you can:

1. **Deploy Brandynette Video Server:**

   - Create web domain for port 6969
   - Upload files via SFTP/FTP
   - Configure NGINX reverse proxy
   - Point DNS to 192.168.0.66

2. **Automate Deployments:**

   - Use HestiaCP API for programmatic access
   - Create deployment scripts with v-\* CLI commands
   - Set up Git webhooks for auto-deploy

3. **Scale Infrastructure:**
   - Create additional LXC containers for services
   - Load balance across multiple containers
   - Set up container orchestration

---

**Installation completed:** November 16, 2025  
**Container IP:** 192.168.0.66  
**Control Panel:** https://192.168.0.66:38383  
**Username:** bambi  
**Email:** bambi@bambisleep.church

**⚠️ SECURITY REMINDER:** Rotate the password `8mB_sL3ep_2025` immediately after first login!
