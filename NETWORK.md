# 🌐 Network Configuration & Documentation

## 📡 Server Discovery Results

**Scan Date**: November 16, 2025  
**Target Host**: 192.168.0.100  
**Scanner**: Windows PowerShell (Test-NetConnection)

### Open Ports

| Port | Protocol | Service    | Status  | Description                          |
| ---- | -------- | ---------- | ------- | ------------------------------------ |
| 22   | TCP      | SSH        | ✅ OPEN | Secure Shell - Remote administration |
| 3128 | TCP      | HTTP Proxy | ✅ OPEN | Squid/HTTP proxy service             |
| 8006 | TCP      | Proxmox VE | ✅ OPEN | Proxmox web management interface     |

### Closed/Filtered Ports

| Port | Protocol | Service   | Status    | Notes                            |
| ---- | -------- | --------- | --------- | -------------------------------- |
| 80   | TCP      | HTTP      | ❌ CLOSED | Standard web server              |
| 443  | TCP      | HTTPS     | ❌ CLOSED | Secure web server                |
| 6969 | TCP      | Custom    | ❌ CLOSED | **Target port for video server** |
| 8443 | TCP      | Alt HTTPS | ❌ CLOSED | Alternative HTTPS port           |

---

## 🔍 Server Identification

### Proxmox Virtual Environment

**Detected Service**: Proxmox VE (Virtual Environment)  
**Version**: Unknown (requires authentication)  
**Web Interface**: https://192.168.0.100:8006  
**Certificate**: Self-signed (requires manual acceptance)

**Access Methods**:

1. **Web UI**: Browser-based management console
2. **SSH**: Command-line access via port 22
3. **API**: RESTful API on port 8006

### Network Topology

```
Local Network (192.168.0.0/24)
│
├── 192.168.0.1 (Gateway/Router)
│
├── 192.168.0.100 (Proxmox Server)
│   ├── Port 22 → SSH
│   ├── Port 3128 → HTTP Proxy
│   └── Port 8006 → Proxmox Web UI
│
└── 192.168.0.178 (This Computer)
    └── Interface: Ethernet
```

---

## 🚀 Deployment Network Configuration

### Required Port Forwarding

For external access to the video server, configure these port forwards on your router:

| External Port | Internal IP   | Internal Port | Protocol | Service                |
| ------------- | ------------- | ------------- | -------- | ---------------------- |
| 6969          | 192.168.0.100 | 6969          | TCP      | Video Server           |
| 8006          | 192.168.0.100 | 8006          | TCP      | Proxmox UI (optional)  |
| 22            | 192.168.0.100 | 22            | TCP      | SSH (use with caution) |

### Firewall Rules (Proxmox Host)

```bash
# Allow incoming connections to video server
iptables -A INPUT -p tcp --dport 6969 -j ACCEPT

# Allow SSH from local network only (recommended)
iptables -A INPUT -p tcp --dport 22 -s 192.168.0.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j DROP

# Allow Proxmox UI
iptables -A INPUT -p tcp --dport 8006 -j ACCEPT

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### Windows Firewall (This Computer)

```powershell
# Allow outbound connections to video server
New-NetFirewallRule -DisplayName "Brandynette Video Server" `
  -Direction Outbound `
  -LocalPort Any `
  -Protocol TCP `
  -RemoteAddress 192.168.0.100 `
  -RemotePort 6969 `
  -Action Allow

# Allow SSH connections
New-NetFirewallRule -DisplayName "SSH to Proxmox" `
  -Direction Outbound `
  -LocalPort Any `
  -Protocol TCP `
  -RemoteAddress 192.168.0.100 `
  -RemotePort 22 `
  -Action Allow
```

---

## 🔐 Security Configuration

### SSH Key Authentication Setup

```powershell
# Generate SSH key pair (run on Windows)
ssh-keygen -t ed25519 -C "brandynette-video-server" -f "$env:USERPROFILE\.ssh\proxmox_deploy"

# Copy public key to Proxmox server
$pubKey = Get-Content "$env:USERPROFILE\.ssh\proxmox_deploy.pub"
ssh root@192.168.0.100 "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# Test key-based authentication
ssh -i "$env:USERPROFILE\.ssh\proxmox_deploy" root@192.168.0.100
```

### Disable Password Authentication (Recommended)

```bash
# On Proxmox server (after testing key-based auth)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### Certificate Management

```bash
# Generate self-signed certificate for video server
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=192.168.0.100"

# Or use Let's Encrypt (requires domain name)
apt install -y certbot
certbot certonly --standalone -d yourdomain.com
```

---

## 🛠️ Network Testing & Diagnostics

### Connection Testing Scripts

**Test from Windows (this computer)**:

```powershell
# Test-Connection.ps1
param([string]$Target = "192.168.0.100")

Write-Host "Testing connectivity to $Target..." -ForegroundColor Cyan

# Ping test
$pingResult = Test-Connection -ComputerName $Target -Count 4 -Quiet
Write-Host "Ping: $(if($pingResult){'✅ SUCCESS'}else{'❌ FAILED'})" -ForegroundColor $(if($pingResult){'Green'}else{'Red'})

# Port tests
$ports = @{
    "SSH" = 22
    "HTTP Proxy" = 3128
    "Video Server" = 6969
    "Proxmox UI" = 8006
}

foreach ($service in $ports.Keys) {
    $port = $ports[$service]
    $portTest = Test-NetConnection -ComputerName $Target -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    $status = if($portTest){'✅ OPEN'}else{'❌ CLOSED'}
    $color = if($portTest){'Green'}else{'Red'}
    Write-Host "$service (Port $port): $status" -ForegroundColor $color
}

# HTTP test (if video server is running)
try {
    $response = Invoke-WebRequest -Uri "http://${Target}:6969/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Video Server Health: ✅ ONLINE" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Video Server Health: ⚠️ OFFLINE" -ForegroundColor Yellow
}
```

**Test from Proxmox server**:

```bash
# test-network.sh
#!/bin/bash
echo "=== Network Diagnostics ==="
echo ""

echo "Hostname: $(hostname)"
echo "IP Addresses:"
ip addr show | grep -E "inet\s" | awk '{print "  " $2}'
echo ""

echo "Listening Ports:"
netstat -tulpn | grep LISTEN
echo ""

echo "Firewall Rules:"
iptables -L -n -v
echo ""

echo "Test Video Server:"
curl -s http://localhost:6969/health && echo "✅ Server responding" || echo "❌ Server not responding"
```

### Bandwidth Testing

```bash
# Install iperf3 on both machines
# Server side (Proxmox):
iperf3 -s

# Client side (Windows):
# Download iperf3 from https://iperf.fr/iperf-download.php
iperf3 -c 192.168.0.100 -t 30
```

### Latency Monitoring

```powershell
# Monitor latency continuously
ping -t 192.168.0.100

# Or with statistics
Test-Connection -ComputerName 192.168.0.100 -Count 100 |
  Measure-Object -Property ResponseTime -Average -Maximum -Minimum
```

---

## 📊 Network Performance Optimization

### TCP Tuning (Proxmox Server)

```bash
# Optimize for video streaming
cat >> /etc/sysctl.conf << EOF
# TCP optimization for video streaming
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
EOF

sysctl -p
```

### NIC Optimization

```bash
# Check current settings
ethtool eth0

# Disable offloading features that may cause issues
ethtool -K eth0 gso off
ethtool -K eth0 tso off
ethtool -K eth0 gro off

# Increase ring buffer size
ethtool -G eth0 rx 4096 tx 4096
```

---

## 🔍 Monitoring & Logging

### Network Traffic Monitoring

```bash
# Install monitoring tools
apt install -y iftop nethogs nload

# Monitor real-time traffic
iftop -i eth0                    # Interactive bandwidth usage
nethogs eth0                     # Per-process bandwidth usage
nload eth0                       # Network load graphs
```

### Logging Configuration

```bash
# Enable detailed connection logging
cat > /etc/rsyslog.d/brandynette.conf << EOF
# Log all connections to port 6969
:msg, contains, ":6969" /var/log/brandynette-connections.log
& stop
EOF

systemctl restart rsyslog

# Monitor connections
tail -f /var/log/brandynette-connections.log
```

### Traffic Analysis

```bash
# Capture packets for analysis
tcpdump -i eth0 -w /tmp/video-traffic.pcap port 6969

# Analyze with tshark
tshark -r /tmp/video-traffic.pcap -Y "tcp.port==6969"
```

---

## 🌍 External Access Configuration

### Dynamic DNS Setup

If you don't have a static IP, use DDNS:

```bash
# Install ddclient
apt install -y ddclient

# Configure for your DDNS provider
cat > /etc/ddclient.conf << EOF
protocol=dyndns2
use=web, web=checkip.dyndns.org/, web-skip='IP Address'
server=domains.google.com
ssl=yes
login=your-username
password='your-password'
your-domain.com
EOF

# Start service
systemctl enable ddclient
systemctl start ddclient
```

### VPN Access (Alternative)

```bash
# Install WireGuard
apt install -y wireguard

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure VPN
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = <server-private-key>
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.0.0.2/32
EOF

# Enable VPN
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
```

---

## 📞 Quick Reference Commands

### From Windows (PowerShell)

```powershell
# Test connection
Test-NetConnection -ComputerName 192.168.0.100 -Port 6969

# SSH connect
ssh root@192.168.0.100

# SSH with key
ssh -i "$env:USERPROFILE\.ssh\proxmox_deploy" root@192.168.0.100

# Create SSH tunnel
ssh -L 6969:localhost:6969 root@192.168.0.100

# SCP file transfer
scp local-file.txt root@192.168.0.100:/remote/path/
```

### From Proxmox Server

```bash
# Check listening ports
netstat -tulpn | grep LISTEN

# Check firewall
iptables -L -n

# Test local service
curl http://localhost:6969/health

# Check network interfaces
ip addr show

# Monitor connections
watch -n 1 'netstat -an | grep 6969'
```

---

**Network Status**: ✅ Operational  
**Last Scanned**: November 16, 2025  
**Next Review**: As needed for deployment
