# Phone Connection Troubleshooting Guide

## Quick Fix Steps

### Step 1: Make Sure Server is Running
```bash
npm run dev
```

Wait until you see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

### Step 2: Verify Server is Listening on Network
The server should show it's listening on `0.0.0.0:3000` (not just `127.0.0.1:3000`)

### Step 3: Check Windows Firewall

**Option A: Allow Node.js through Firewall (Recommended)**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Find "Node.js" in the list
4. Check "Private" checkbox
5. Click OK

**Option B: Create Firewall Rule (Run PowerShell as Administrator)**
```powershell
netsh advfirewall firewall add rule name="Node.js Dev Server" dir=in action=allow protocol=TCP localport=3000
```

### Step 4: Verify Your IP Address
```bash
ipconfig | findstr IPv4
```
Should show: `192.168.2.101` (or similar)

### Step 5: Test from Phone
1. Make sure phone and computer are on **same Wi-Fi network**
2. Open phone browser
3. Go to: `http://192.168.2.101:3000`

## Common Issues

### Issue: "Connection Refused" or "Can't Connect"
**Solution:** Windows Firewall is blocking port 3000
- Follow Step 3 above to allow Node.js through firewall

### Issue: "This site can't be reached"
**Solution:** 
1. Verify server is running (Step 1)
2. Check IP address is correct (Step 4)
3. Make sure both devices are on same network

### Issue: Server shows "localhost" instead of "0.0.0.0"
**Solution:** The server is configured correctly in package.json with `-H 0.0.0.0`
- If it still shows localhost, restart the server

### Issue: Works on computer but not phone
**Solution:** 
1. Check Windows Firewall (most common issue)
2. Verify IP address hasn't changed
3. Try disabling Windows Firewall temporarily to test (then re-enable and add proper rule)

## Test Commands

**Check if server is running:**
```bash
netstat -ano | findstr ":3000.*LISTENING"
```

**Check your IP:**
```bash
ipconfig | findstr IPv4
```

**Test localhost:**
Open browser and go to: `http://localhost:3000`

**Test from phone:**
Open phone browser and go to: `http://192.168.2.101:3000`

## Your App URL
```
http://192.168.2.101:3000
```

Bookmark this on your phone for easy access!
