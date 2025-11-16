# 🔒 REPOSITORY TRANSFER GUIDE

## Moving js-brandynette-xxx-filehost to BambiSleepChurch Organization

**Date:** November 16, 2025  
**Current Owner:** HarleyVader  
**Target Organization:** BambiSleepChurch  
**Repository:** js-brandynette-xxx-filehost

---

## ✅ PRE-TRANSFER CHECKLIST

### Repository Status

- ✅ All changes committed to master branch
- ✅ Production deployment complete and tested
- ✅ Documentation comprehensive and up-to-date
- ✅ No pending pull requests
- ✅ All issues documented or closed
- ✅ Service deployed and operational (192.168.0.66:6969)

### Files Included in Transfer

- ✅ Source code (src/, public/)
- ✅ Configuration (package.json, .gitignore, cspell.json)
- ✅ Documentation (11 markdown files, 50KB+)
- ✅ Automation scripts (8 PowerShell scripts)
- ✅ Deployment files (brandynette.service)
- ✅ Project management (BUILD-INSTRUCTIONS.md, TODO.md)

### Infrastructure Deployed

- ✅ Container 101 (bambiOSdumbOS) @ 192.168.0.66
- ✅ Node.js v20.19.5 operational
- ✅ Systemd service active and enabled
- ✅ HestiaCP 1.9.4 control panel
- ✅ Firewall configured
- ✅ 100 packages, 0 vulnerabilities

---

## 📋 TRANSFER METHODS

### Method 1: GitHub Web Interface (Recommended)

#### Step 1: Prepare Organization

1. Log in to GitHub as organization owner
2. Navigate to: https://github.com/BambiSleepChurch
3. Verify organization settings allow repository transfers
4. Check organization billing (if private repo)

#### Step 2: Initiate Transfer

1. Go to: https://github.com/HarleyVader/js-brandynette-xxx-filehost
2. Click **Settings** tab
3. Scroll to **Danger Zone** at bottom
4. Click **Transfer** button
5. Type repository name to confirm: `js-brandynette-xxx-filehost`
6. Enter new owner: `BambiSleepChurch`
7. Confirm transfer

#### Step 3: Post-Transfer Actions

```powershell
# Update local remote URL
cd "F:\€BRANDYNETTE.XXX\js-brandynette-xxx-filehost"
git remote set-url origin https://github.com/BambiSleepChurch/js-brandynette-xxx-filehost.git

# Verify
git remote -v

# Test connection
git fetch origin
```

---

### Method 2: GitHub CLI (Automated)

#### Prerequisites

```powershell
# Install GitHub CLI if not present
winget install GitHub.cli

# Authenticate
gh auth login
```

#### Transfer Command

```powershell
# Navigate to repository
cd "F:\€BRANDYNETTE.XXX\js-brandynette-xxx-filehost"

# Check current status
gh repo view

# Transfer repository (requires owner permissions)
gh repo transfer BambiSleepChurch/js-brandynette-xxx-filehost --confirm

# Update local remote
git remote set-url origin https://github.com/BambiSleepChurch/js-brandynette-xxx-filehost.git
```

---

### Method 3: Fork and Archive (Alternative)

If direct transfer not possible:

```powershell
# Create fork in organization
gh repo fork HarleyVader/js-brandynette-xxx-filehost --org BambiSleepChurch --clone=false

# Clone to new location
git clone https://github.com/BambiSleepChurch/js-brandynette-xxx-filehost.git

# Push all branches
cd js-brandynette-xxx-filehost
git push --all
git push --tags

# Archive original
gh repo archive HarleyVader/js-brandynette-xxx-filehost
```

---

## 🔐 POST-TRANSFER SECURITY CHECKLIST

### Update Repository Settings

#### 1. Branch Protection Rules

```
Settings → Branches → Add rule

Branch name pattern: master
☑ Require pull request reviews before merging
☑ Require status checks to pass
☑ Require branches to be up to date
☑ Include administrators
```

#### 2. Access Control

```
Settings → Collaborators and teams

Recommended:
- Team: admins (Admin access)
- Team: developers (Write access)
- Team: viewers (Read access)
```

#### 3. Secrets and Variables

```
Settings → Secrets and variables → Actions

Add repository secrets:
- PROXMOX_HOST: 192.168.0.100
- CONTAINER_IP: 192.168.0.66
- DEPLOY_USER: root
- SSH_PRIVATE_KEY: <contents of deployment key>
```

#### 4. Webhook Configuration (Optional)

```
Settings → Webhooks → Add webhook

Payload URL: https://192.168.0.66:38383/webhook/github
Content type: application/json
Events: Push, Pull request, Release
```

---

## 🚀 CONTINUOUS DEPLOYMENT SETUP

### GitHub Actions Workflow

Create: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Deploy to Container
        run: |
          ssh -o StrictHostKeyChecking=no root@${{ secrets.PROXMOX_HOST }} << 'EOF'
            pct exec 101 -- bash -c "
              cd /opt/brandynette &&
              git pull origin master &&
              npm install &&
              systemctl restart brandynette &&
              systemctl status brandynette
            "
          EOF

      - name: Verify Deployment
        run: |
          curl -f http://${{ secrets.CONTAINER_IP }}:6969/api/videos
```

---

## 📊 TRANSFER VERIFICATION

### After Transfer Complete

```powershell
# 1. Verify new repository URL
git remote get-url origin
# Expected: https://github.com/BambiSleepChurch/js-brandynette-xxx-filehost.git

# 2. Check repository visibility
gh repo view BambiSleepChurch/js-brandynette-xxx-filehost --json visibility
# Expected: {"visibility":"public"} or {"visibility":"private"}

# 3. Verify all branches transferred
gh repo view BambiSleepChurch/js-brandynette-xxx-filehost --json defaultBranchRef,refs

# 4. Check commit history intact
git log --oneline -10

# 5. Verify deployment still operational
curl http://192.168.0.66:6969/api/videos
# Expected: {"videos":[],"count":0}

# 6. Test SSH automation scripts
.\scripts\ssh-connect.ps1 -Action status
```

---

## 🛡️ SECURITY HARDENING

### SSH Deploy Key Setup

```powershell
# Generate deployment key
ssh-keygen -t ed25519 -C "deploy@brandynette-server" -f ~/.ssh/brandynette_deploy

# Add public key to server
Get-Content ~/.ssh/brandynette_deploy.pub | ssh root@192.168.0.100 "pct exec 101 -- bash -c 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'"

# Add private key to GitHub Secrets
# Settings → Secrets → New repository secret
# Name: SSH_PRIVATE_KEY
# Value: <contents of ~/.ssh/brandynette_deploy>
```

### Repository Security Scanning

```powershell
# Enable security features in GitHub
gh repo edit BambiSleepChurch/js-brandynette-xxx-filehost \
  --enable-vulnerability-alerts \
  --enable-automated-security-fixes

# Run security audit
cd "F:\€BRANDYNETTE.XXX\js-brandynette-xxx-filehost"
npm audit
npm audit fix
```

---

## 📝 IMPORTANT NOTES

### What Gets Transferred

- ✅ All commit history
- ✅ All branches and tags
- ✅ All releases
- ✅ All issues (if kept)
- ✅ All pull requests (if kept)
- ✅ Wiki pages (if exist)
- ✅ GitHub Actions workflows
- ❌ Webhooks (must reconfigure)
- ❌ Secrets (must re-add)
- ❌ Deploy keys (must re-add)

### Breaking Changes

- Old repository URL becomes redirect (temporarily)
- External services using old URL need updating
- Webhooks will stop working
- CI/CD pipelines need reconfiguration
- Clone URLs change for all users

### Rollback Plan

If transfer causes issues:

1. Transfer repository back to HarleyVader
2. Update local remote URLs
3. Reconfigure webhooks and secrets
4. Notify collaborators

---

## 🔗 EXTERNAL REFERENCES TO UPDATE

### After Transfer, Update These:

1. **Proxmox Container Git Remote** (if using git inside container)

```bash
ssh root@192.168.0.100 "pct exec 101 -- bash -c 'cd /opt/brandynette && git remote set-url origin https://github.com/BambiSleepChurch/js-brandynette-xxx-filehost.git'"
```

2. **Documentation Links**

- Update any internal docs pointing to HarleyVader/js-brandynette-xxx-filehost
- Update README badges (if any)
- Update package.json repository field

3. **Third-Party Integrations**

- Update any monitoring services
- Update deployment scripts
- Update backup configurations

---

## 🎯 POST-TRANSFER TODO

- [ ] Update all local clones to new URL
- [ ] Reconfigure webhooks for HestiaCP
- [ ] Add SSH deploy key to GitHub secrets
- [ ] Set up branch protection rules
- [ ] Configure team access permissions
- [ ] Enable security alerts
- [ ] Test CI/CD pipeline
- [ ] Update documentation with new URLs
- [ ] Notify collaborators of transfer
- [ ] Create release tag for production deployment
- [ ] Archive old repository (optional)

---

## 📞 SUPPORT RESOURCES

### GitHub Transfer Documentation

- https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository

### Organization Management

- https://docs.github.com/en/organizations

### Repository Settings

- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features

---

## ✅ TRANSFER COMMAND (READY TO EXECUTE)

**When ready, run:**

```powershell
# 1. Ensure all changes are pushed
git push origin master

# 2. Initiate transfer via GitHub web interface:
Start-Process "https://github.com/HarleyVader/js-brandynette-xxx-filehost/settings"

# 3. After transfer, update local repository:
git remote set-url origin https://github.com/BambiSleepChurch/js-brandynette-xxx-filehost.git
git fetch origin
git branch --set-upstream-to=origin/master master

# 4. Verify transfer:
gh repo view BambiSleepChurch/js-brandynette-xxx-filehost
git log --oneline -5

# 5. Test deployment still works:
curl http://192.168.0.66:6969/api/videos

# 6. Update container's git remote (if applicable):
ssh root@192.168.0.100 "pct exec 101 -- bash -c 'cd /opt/brandynette 2>/dev/null && git remote set-url origin https://github.com/BambiSleepChurch/js-brandynette-xxx-filehost.git || echo No git repo in container'"
```

---

**STATUS: READY FOR TRANSFER**  
**All prerequisites met. Awaiting user confirmation to proceed.**

_Document created: November 16, 2025_
