# Test the app on your phone

## Option 1: Same Wi‑Fi (quick)

1. **Start the dev server** (on your computer):
   ```bash
   npm run dev
   ```
   The server listens on `0.0.0.0`, so your phone can reach it on your local network.

2. **Find your computer’s IP**:
   - **Windows:** Open Command Prompt or PowerShell and run:
     ```bash
     ipconfig
     ```
     Use the **IPv4 Address** under your Wi‑Fi adapter (e.g. `192.168.1.105`).
   - **Mac:** System Settings → Wi‑Fi → your network → IP address, or run `ifconfig` and look for `inet` under `en0`.

3. **On your phone:**
   - Connect to the **same Wi‑Fi** as your computer.
   - Open the browser and go to: **`http://YOUR_IP:3000`**  
     Example: `http://192.168.1.105:3000`

**Note:** Camera (e.g. QR scan) often needs a **secure context** (HTTPS or localhost). Over `http://YOUR_IP:3000` the camera might be blocked. If it is, use Option 2.

---

## Option 2: HTTPS (for camera / QR)

Use a public URL with HTTPS so the camera works on the phone.

### A) Deploy to Vercel (recommended)

1. Push your code to GitHub (you already use `CodeXPrim8/buapp`).
2. Go to [vercel.com](https://vercel.com) and import the repo.
3. Deploy; you’ll get a URL like `https://buapp-xxx.vercel.app`.
4. On your phone, open that URL in the browser and test (including QR/camera).

### B) Local tunnel (no deploy)

1. Install a tunnel tool, e.g. [ngrok](https://ngrok.com):
   ```bash
   npm install -g ngrok
   ```
2. Start your app: `npm run dev`
3. In another terminal, run:
   ```bash
   ngrok http 3000
   ```
4. Use the **HTTPS** URL ngrok shows (e.g. `https://abc123.ngrok.io`) on your phone.

---

## Checklist for phone testing

- [ ] Phone and computer on same Wi‑Fi (Option 1) or using HTTPS URL (Option 2)
- [ ] Login works
- [ ] Spray → “Allow camera & scan QR code” (use Option 2 if camera is blocked)
- [ ] Navigation and other flows work as expected
