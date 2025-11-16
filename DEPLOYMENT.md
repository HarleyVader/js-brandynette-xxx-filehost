# 🚀 Deployment Guide - Proxmox Server

## 📡 Server Information

**Host**: 192.168.0.100  
**Management**: Proxmox VE (Virtual Environment)  
**Web UI**: https://192.168.0.100:8006  
**SSH Access**: Port 22  
**HTTP Proxy**: Port 3128

---

## 🎯 Deployment Options

### Option 1: Docker Container (Recommended)

Deploy the video server as a Docker container on Proxmox:

```bash
# SSH into Proxmox host
ssh root@192.168.0.100

# Create deployment directory
mkdir -p /opt/brandynette-filehost
cd /opt/brandynette-filehost

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy application files
COPY src/ ./src/
COPY public/ ./public/
COPY BRANDIFICATION/ ./BRANDIFICATION/

EXPOSE 6969

ENV NODE_ENV=production
ENV PORT=6969

CMD ["node", "src/server.js"]
EOF

# Build and run
docker build -t brandynette-filehost:latest .
docker run -d \
  --name brandynette-filehost \
  -p 6969:6969 \
  -v /opt/brandynette-filehost/BRANDIFICATION:/app/BRANDIFICATION \
  --restart unless-stopped \
  brandynette-filehost:latest
```

### Option 2: LXC Container

Deploy in a Proxmox LXC (Linux Container):

```bash
# From Proxmox web UI or CLI, create Ubuntu 22.04 LXC
pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --hostname brandynette-filehost \
  --memory 2048 \
  --cores 2 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --storage local-lvm \
  --rootfs local-lvm:8

pct start 100
pct enter 100

# Inside LXC container
apt update && apt install -y nodejs npm git
cd /opt
git clone <your-repo-url> brandynette-filehost
cd brandynette-filehost
npm install
npm start
```

### Option 3: VM Deployment

Create a full virtual machine for more isolation:

1. Upload OS ISO via Proxmox UI
2. Create VM with Ubuntu Server 22.04
3. Assign resources (2GB RAM, 2 cores, 20GB disk)
4. Install Node.js and deploy application

---

## 🔧 Port Forwarding Setup

### Configure Proxmox Firewall

```bash
# SSH into Proxmox host
ssh root@192.168.0.100

# Enable port forwarding (if using NAT)
iptables -t nat -A PREROUTING -p tcp --dport 6969 -j DNAT --to-destination <container-ip>:6969
iptables -t nat -A POSTROUTING -j MASQUERADE

# Make persistent
apt install -y iptables-persistent
netfilter-persistent save
```

### Proxmox Firewall Rules (via Web UI)

1. Navigate to: Datacenter → Firewall → Add Rule
2. **Direction**: IN
3. **Action**: ACCEPT
4. **Protocol**: TCP
5. **Dest. port**: 6969
6. **Comment**: Brandynette Video Server

---

## 📦 Deployment Script

Save as `deploy-to-proxmox.ps1`:

```powershell
# Proxmox Deployment Script
param(
    [string]$ProxmoxHost = "192.168.0.100",
    [string]$Username = "root",
    [switch]$UseLXC,
    [switch]$UseDocker
)

$ProjectPath = "F:\€BRANDYNETTE.XXX\js-brandynette-xxx-filehost"

Write-Host "🚀 Deploying Brandynette Video Server to Proxmox" -ForegroundColor Cyan

# Test connection
Write-Host "📡 Testing connection to $ProxmoxHost..." -ForegroundColor Yellow
$testConn = Test-NetConnection -ComputerName $ProxmoxHost -Port 22 -InformationLevel Quiet
if (-not $testConn) {
    Write-Host "❌ Cannot connect to Proxmox host!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Connection successful!" -ForegroundColor Green

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$tempDir = Join-Path $env:TEMP "brandynette-deploy"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy essential files
Copy-Item "$ProjectPath\src" -Destination "$tempDir\src" -Recurse
Copy-Item "$ProjectPath\public" -Destination "$tempDir\public" -Recurse
Copy-Item "$ProjectPath\BRANDIFICATION" -Destination "$tempDir\BRANDIFICATION" -Recurse
Copy-Item "$ProjectPath\package*.json" -Destination $tempDir

# Compress
$zipPath = "$tempDir.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Write-Host "✅ Package created: $zipPath" -ForegroundColor Green

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. SCP package to Proxmox: scp $zipPath ${Username}@${ProxmoxHost}:/tmp/" -ForegroundColor White
Write-Host "2. SSH into Proxmox: ssh ${Username}@${ProxmoxHost}" -ForegroundColor White
Write-Host "3. Extract and deploy: cd /opt && unzip /tmp/brandynette-deploy.zip" -ForegroundColor White
Write-Host "4. Install dependencies: npm install" -ForegroundColor White
Write-Host "5. Start server: npm start" -ForegroundColor White

# Cleanup prompt
Read-Host "`nPress Enter to cleanup temp files"
Remove-Item $tempDir -Recurse -Force
Remove-Item $zipPath -Force
Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
```

---

## 🔐 Security Considerations

### SSH Key Setup (Recommended)

```powershell
# Generate SSH key pair
ssh-keygen -t ed25519 -C "brandynette-deployment" -f "$env:USERPROFILE\.ssh\proxmox_deploy"

# Copy public key to Proxmox
Get-Content "$env:USERPROFILE\.ssh\proxmox_deploy.pub" | ssh root@192.168.0.100 "cat >> ~/.ssh/authorized_keys"

# Test key-based login
ssh -i "$env:USERPROFILE\.ssh\proxmox_deploy" root@192.168.0.100
```

### Firewall Configuration

```bash
# On Proxmox host - restrict SSH access
ufw allow from 192.168.0.0/24 to any port 22
ufw allow 6969/tcp
ufw enable
```

### Reverse Proxy (Optional)

Use Nginx as reverse proxy for SSL termination:

```nginx
# /etc/nginx/sites-available/brandynette
server {
    listen 443 ssl http2;
    server_name videos.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:6969;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 📊 Monitoring & Maintenance

### Check Server Status

```bash
# SSH into Proxmox
ssh root@192.168.0.100

# Check container/VM status
pct list        # LXC containers
qm list         # Virtual machines

# Check Docker containers
docker ps -a
docker logs brandynette-filehost

# Check service logs
journalctl -u brandynette-filehost -f
```

### Resource Monitoring

```bash
# CPU & Memory usage
top
htop

# Disk usage
df -h
du -sh /opt/brandynette-filehost/BRANDIFICATION/*

# Network stats
netstat -tulpn | grep 6969
ss -tlnp | grep 6969
```

### Backup Strategy

```bash
# Automated backup script
cat > /opt/backup-brandynette.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/brandynette"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup videos
tar -czf "$BACKUP_DIR/videos_$TIMESTAMP.tar.gz" \
    /opt/brandynette-filehost/BRANDIFICATION/

# Backup configuration
tar -czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" \
    /opt/brandynette-filehost/src/ \
    /opt/brandynette-filehost/public/ \
    /opt/brandynette-filehost/package.json

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x /opt/backup-brandynette.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/backup-brandynette.sh" | crontab -
```

---

## 🚨 Troubleshooting

### Server Won't Start

```bash
# Check port availability
netstat -tulpn | grep 6969

# Check Node.js version
node --version  # Should be >= 14.x

# Check dependencies
cd /opt/brandynette-filehost
npm install

# Run with debug output
DEBUG=* npm start
```

### Connection Issues

```bash
# Test from Proxmox host
curl http://localhost:6969/health

# Test from external network
curl http://192.168.0.100:6969/health

# Check firewall
iptables -L -n -v | grep 6969
```

### Performance Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Enable production mode
NODE_ENV=production npm start

# Check disk I/O
iostat -x 1
```

---

## 📝 Environment Variables

Create `/opt/brandynette-filehost/.env`:

```bash
# Server configuration
PORT=6969
NODE_ENV=production

# CORS settings
CORS_ORIGIN=*

# File paths
BRANDIFICATION_PATH=/app/BRANDIFICATION
PUBLIC_PATH=/app/public

# Logging
LOG_LEVEL=info
```

---

## 🔄 Auto-Start Configuration

### Systemd Service (Recommended)

```bash
# Create service file
cat > /etc/systemd/system/brandynette-filehost.service << 'EOF'
[Unit]
Description=Brandynette Video File Host
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/brandynette-filehost
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=6969

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable brandynette-filehost
systemctl start brandynette-filehost
systemctl status brandynette-filehost
```

---

## 📈 Scaling Considerations

### Load Balancing (Future)

```bash
# Install HAProxy on Proxmox
apt install -y haproxy

# Configure /etc/haproxy/haproxy.cfg
frontend http_front
    bind *:80
    default_backend http_back

backend http_back
    balance roundrobin
    server video1 192.168.0.101:6969 check
    server video2 192.168.0.102:6969 check
    server video3 192.168.0.103:6969 check
```

### CDN Integration

Consider Cloudflare, BunnyCDN, or AWS CloudFront for:

- Reduced bandwidth costs
- Global edge caching
- DDoS protection
- SSL/TLS termination

---

**Last Updated**: November 16, 2025  
**Target Host**: 192.168.0.100 (Proxmox VE)  
**Deployment Status**: Ready for deployment
