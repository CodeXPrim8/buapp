# How to Start the Applications

The servers are experiencing permission issues when started from the sandboxed environment. Please run them manually using one of these methods:

## Method 1: Use the PowerShell Script (Recommended)

1. Open PowerShell in the project root directory
2. Run the script:
   ```powershell
   .\start-all-servers.ps1
   ```

This script will:
- Check for Node.js and npm
- Install dependencies if needed
- Start both servers
- Monitor their status

## Method 2: Manual Start (Two Terminal Windows)

### Terminal 1 - Main Application:
```powershell
cd "c:\Users\clemx\Downloads\Bison note mobile-app-build"
npm run dev
```

### Terminal 2 - Admin Dashboard:
```powershell
cd "c:\Users\clemx\Downloads\Bison note mobile-app-build\admin-dashboard"
npm run dev
```

## Method 3: Using the start-servers.ps1 Script

The `start-servers.ps1` script opens separate PowerShell windows for each server:

```powershell
.\start-servers.ps1
```

## URLs

Once started, access:
- **Main Application**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001/login

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
1. Find the process using the port:
   ```powershell
   netstat -ano | findstr ":3000"
   netstat -ano | findstr ":3001"
   ```
2. Kill the process (replace PID with the actual process ID):
   ```powershell
   taskkill /PID <PID> /F
   ```

### Permission Errors (EPERM)
If you see `EPERM` errors:
1. Make sure you're running PowerShell as Administrator
2. Check Windows Defender/Antivirus isn't blocking Node.js
3. Try running the commands directly in your terminal instead of through scripts

### Dependencies Not Installed
If you get module not found errors:
```powershell
# Main app
cd "c:\Users\clemx\Downloads\Bison note mobile-app-build"
npm install

# Admin dashboard
cd "c:\Users\clemx\Downloads\Bison note mobile-app-build\admin-dashboard"
npm install
```

### Environment Variables
Make sure both `.env.local` files exist:
- Root: `.env.local`
- Admin Dashboard: `admin-dashboard/.env.local`

Check `env.example` for required variables.
