# Testing on Your Phone 📱

## ✅ Setup Complete!

Your local IP address is: **192.168.2.101**

## 🚀 Steps to Test on Phone

### 1. Make Sure Both Devices Are on Same Network
- Your computer and phone must be on the **same Wi-Fi network**
- Check your phone's Wi-Fi settings

### 2. Restart Dev Server (if needed)
The dev server is configured to accept connections from your network.

If you need to restart:
```bash
npm run dev
```

### 3. Access from Your Phone

**Open your phone's browser and go to:**
```
http://192.168.2.101:3000
```

**Or scan this QR code with your phone:**
- Generate QR code with: `http://192.168.2.101:3000`
- Scan with your phone's camera
- Tap the notification to open in browser

### 4. Test the App
- Register a new user
- Login
- Test all features
- Check if API calls work

## 🔧 Troubleshooting

### Can't Connect?
1. **Check firewall:**
   - Windows Firewall might be blocking port 3000
   - Allow Node.js through firewall if prompted

2. **Verify IP address:**
   - Run: `ipconfig` in terminal
   - Look for IPv4 Address under your active network adapter
   - Make sure it matches 192.168.2.101

3. **Check network:**
   - Both devices must be on same Wi-Fi
   - Try disconnecting and reconnecting phone to Wi-Fi

4. **Try different port:**
   - If 3000 doesn't work, try: `next dev -H 0.0.0.0 -p 3001`
   - Then access: `http://192.168.2.100:3001`

### API Calls Not Working?
- Make sure `.env.local` has correct Supabase URL
- Check browser console on phone for errors
- API calls should work since they're server-side

## 📱 Mobile-Specific Notes

- The app is responsive and should work well on mobile
- Touch interactions should work properly
- QR scanner will use phone's camera (when implemented)
- Notifications will work on mobile browser

## 🎯 Quick Access

**Your app URL:**
```
http://192.168.2.101:3000
```

**Bookmark this on your phone for easy access!**
