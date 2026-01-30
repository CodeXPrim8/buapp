# Phone Connection Test Script
Write-Host "=== Phone Connection Troubleshooting ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if server is running
Write-Host "1. Checking if server is running on port 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr ":3000.*LISTENING"
if ($port3000) {
    Write-Host "   ✓ Server is running on port 3000" -ForegroundColor Green
    Write-Host "   Details: $port3000" -ForegroundColor Gray
} else {
    Write-Host "   ✗ Server is NOT running on port 3000" -ForegroundColor Red
    Write-Host "   → Start the server with: npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check IP address
Write-Host "2. Checking your IP address..." -ForegroundColor Yellow
$ipAddress = "192.168.2.101"
try {
    $detectedIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }).IPAddress | Select-Object -First 1
    if ($detectedIP) {
        $ipAddress = $detectedIP
    }
} catch {
    # Use default
}
Write-Host "   ✓ Your IP address: $ipAddress" -ForegroundColor Green

Write-Host ""

# 3. Test localhost connection
Write-Host "3. Testing localhost connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Server responds on localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Server does NOT respond on localhost:3000" -ForegroundColor Red
    Write-Host "   → Make sure the server is running" -ForegroundColor Yellow
}

Write-Host ""

# 4. Instructions
Write-Host "=== Instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To access from your phone:" -ForegroundColor White
Write-Host "  1. Make sure server is running: npm run dev" -ForegroundColor Yellow
Write-Host "  2. Open browser on phone and go to:" -ForegroundColor Yellow
Write-Host "     http://$ipAddress:3000" -ForegroundColor Green
Write-Host ""
Write-Host "If still not working, check Windows Firewall:" -ForegroundColor White
Write-Host "  Run this command as Administrator:" -ForegroundColor Yellow
Write-Host "  netsh advfirewall firewall add rule name=`"Node3000`" dir=in action=allow protocol=TCP localport=3000" -ForegroundColor Gray
Write-Host ""
