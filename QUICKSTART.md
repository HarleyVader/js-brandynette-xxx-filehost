# 🚀 Quick Start - Proxmox Deployment

## For the Impatient 💨

### 1️⃣ Connect to Server (30 seconds)

```powershell
# Run the SSH connection script
.\scripts\ssh-connect.ps1 connect
```

**Or manually**:

```powershell
ssh root@192.168.0.100
```

### 2️⃣ Deploy to Server (2 minutes)

```powershell
# Automated deployment
.\scripts\ssh-connect.ps1 deploy
```

**Or manual deployment**:

```powershell
# Package and upload
Compress-Archive -Path src,public,package*.json -DestinationPath deploy.zip
scp deploy.zip root@192.168.0.100:/tmp/

# SSH in and extract
ssh root@192.168.0.100
cd /opt && mkdir -p brandynette-filehost && cd brandynette-filehost
unzip /tmp/deploy.zip && npm install --production
npm start
```

### 3️⃣ Access Your Server (10 seconds)

Open browser to: `http://192.168.0.100:6969`

---

## 🎯 Common Tasks

### Check Server Status

```powershell
.\scripts\ssh-connect.ps1 status
```

### View Live Logs

```powershell
.\scripts\ssh-connect.ps1 logs
```

### Restart Server

```powershell
.\scripts\ssh-connect.ps1 restart
```

### Create Backup

```powershell
.\scripts\ssh-connect.ps1 backup
```

### SSH Tunnel (Access from localhost)

```powershell
.\scripts\ssh-connect.ps1 tunnel
# Then open: http://localhost:6969
```

---

## 🔐 First-Time Setup

### Generate SSH Key (one-time)

```powershell
# Create key pair
ssh-keygen -t ed25519 -C "brandynette-server" -f "$env:USERPROFILE\.ssh\proxmox_deploy"

# Copy to server
Get-Content "$env:USERPROFILE\.ssh\proxmox_deploy.pub" | ssh root@192.168.0.100 "cat >> ~/.ssh/authorized_keys"

# Test it
ssh -i "$env:USERPROFILE\.ssh\proxmox_deploy" root@192.168.0.100
```

---

## 📚 Full Documentation

- **Detailed Deployment**: See `DEPLOYMENT.md`
- **Network Configuration**: See `NETWORK.md`
- **Build Instructions**: See `BUILD-INSTRUCTIONS.md`
- **TODO/Roadmap**: See `TODO.md`

---

## 🆘 Troubleshooting

**Can't connect?**

```powershell
Test-NetConnection -ComputerName 192.168.0.100 -Port 22
```

**Server not responding?**

```powershell
ssh root@192.168.0.100 "curl http://localhost:6969/health"
```

**Need to kill stuck process?**

```powershell
ssh root@192.168.0.100 "pkill -f 'node.*server.js'"
```

---

**Server**: 192.168.0.100  
**Port**: 6969  
**Management**: https://192.168.0.100:8006 (Proxmox UI)
