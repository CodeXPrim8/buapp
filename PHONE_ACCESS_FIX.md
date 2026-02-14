# Phone can't open the app – fix

## 1. Use the right URL on your phone

- Use your **PC’s IP** and the **port** the dev server uses (often **3000** or **3001**).
- Example: `http://192.168.1.105:3000` or `http://192.168.1.105:3001`
- No `https`, no `www`, no trailing slash.

To get your PC’s IP: open **Command Prompt**, run `ipconfig`, and use the **IPv4 Address** under your **Wi‑Fi** adapter.

---

## 2. Allow the app through Windows Firewall (most common fix)

Windows often blocks other devices from connecting. Allow the port the dev server uses.

**Option A – Allow port 3000 (run in Command Prompt or PowerShell as Administrator):**

```batch
netsh advfirewall firewall add rule name="Next.js dev 3000" dir=in action=allow protocol=TCP localport=3000
```

**Option B – Allow port 3001 (if your server runs on 3001):**

```batch
netsh advfirewall firewall add rule name="Next.js dev 3001" dir=in action=allow protocol=TCP localport=3001
```

**How to run as Administrator:**

1. Press **Win**, type **cmd** or **powershell**.
2. Right‑click **Command Prompt** or **Windows PowerShell**.
3. Click **Run as administrator**.
4. Paste the line above (for 3000 or 3001) and press Enter.

---

## 3. Check these as well

- **Same Wi‑Fi:** Phone and PC must be on the **same Wi‑Fi** (not mobile data on the phone).
- **Server is running:** On the PC, run `npm run dev` in the project folder and leave it running. If it says “Port 3000 is in use”, use **3001** in the URL on the phone (e.g. `http://YOUR_IP:3001`).
- **One dev server:** If you see “another instance of next dev running”, close other terminals or stop the other process, then run `npm run dev` once.

---

## 4. Test from the PC first

On the PC, open:

- `http://localhost:3000`  
  or, if the server picked 3001:  
- `http://localhost:3001`

If it doesn’t open on the PC, fix the dev server first. If it opens on the PC but not on the phone, the firewall step (step 2) usually fixes it.
