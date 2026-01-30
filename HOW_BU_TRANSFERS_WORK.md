# How Users Send and Receive ɃU

## 📤 **WAYS TO SEND ɃU**

### 1. **Direct Transfer (Peer-to-Peer)**
**Location:** `Send BU` page → `Send ɃU to User`

**How it works:**
1. User navigates to "Send ɃU" from dashboard
2. Clicks "Send ɃU to User"
3. **Searches for recipient by Phone Number ONLY** (e.g., +2348012345678 or 08012345678)
4. Selects the recipient from search results
5. Enters amount (in ɃU)
6. Optionally adds a message
7. Clicks "Send ɃU Now"
8. **PIN Verification Required** - Enters 4-digit PIN to confirm
9. Transfer is completed instantly

**Note:** Users can ONLY be found by phone number. Name search is not available for privacy and security reasons.

**Backend Flow:**
- API: `POST /api/transfers`
- Validates sender balance
- Verifies PIN
- Updates sender wallet (deducts amount)
- Updates receiver wallet (adds amount)
- Creates transfer record
- Sends notifications to both parties

---

### 2. **Tip via QR Code Scan**
**Location:** `Send BU` page → `Give Tip`

**How it works:**
1. User navigates to "Send ɃU" from dashboard
2. Clicks "Give Tip"
3. Scans recipient's QR code (or uses demo scan)
4. QR code contains recipient's user ID
5. Enters tip amount
6. Clicks "Give Tip"
7. **PIN Verification Required** - Enters 4-digit PIN to confirm
8. Tip is transferred instantly

**Backend Flow:**
- Same as direct transfer (`POST /api/transfers` with `type: 'tip'`)
- Creates tip transfer record
- Sends notifications

---

### 3. **Gateway QR Transfer (Event-Based)**
**Location:** `Spray` page → Scan Gateway QR

**How it works:**
1. User navigates to "Spray" from dashboard
2. Scans vendor's gateway QR code at an event
3. QR code contains:
   - Gateway ID
   - Event name
   - Celebrant information
4. Views event details
5. Enters amount to send
6. Optionally adds message
7. Clicks "Send ɃU"
8. **PIN Verification Required** - Enters 4-digit PIN to confirm
9. BU is transferred to celebrant's event wallet
10. Creates pending sale for vendor
11. Vendor receives notification to confirm and issue physical notes

**Backend Flow:**
- API: `POST /api/transfers/gateway-qr`
- Validates sender balance
- Verifies PIN
- Updates sender wallet (deducts)
- Updates celebrant's event wallet (adds)
- Creates transfer record linked to event
- Creates pending sale for vendor
- Sends notifications to:
  - Celebrant (BU received)
  - Sender (BU sent)
  - Vendor (new sale to confirm)

---

## 📥 **WAYS TO RECEIVE ɃU**

### 1. **Automatic Receipt (No Action Required)**
**When:** Someone sends BU directly to you

**How it works:**
- When another user sends BU to you via:
  - Direct transfer (searching your phone/name)
  - Tip (scanning your QR code)
- BU is automatically added to your wallet
- You receive a notification immediately
- Balance updates in real-time

**Backend Flow:**
- Transfer API automatically:
  - Updates your wallet balance
  - Creates notification
  - Records transaction in history

---

### 2. **Via QR Code (Show Your QR)**
**Location:** `Receive BU` page → `Show QR Code`

**How it works:**
1. User navigates to "Receive ɃU" from dashboard
2. Clicks "Show QR Code"
3. Displays their personal QR code
4. Others scan the QR code
5. Scanner can send BU/tip instantly
6. BU arrives in wallet automatically

**QR Code Contains:**
- User ID
- Username/Phone number
- Transfer type: "receive_bu"

**Backend Flow:**
- When scanned, sender uses `POST /api/transfers` with receiver ID from QR
- BU is transferred automatically
- Receiver gets notification

---

### 3. **Via Phone Number**
**How it works:**
- Your username is your phone number (e.g., +2348012345678)
- Others can search for you by **Phone Number ONLY**
- When found, they can send BU directly
- You receive it automatically

**Backend Flow:**
- Sender searches via `GET /api/users/search?q=phone_or_name`
- Finds your user ID
- Sends BU using your ID
- You receive automatically

---

### 4. **At Events (Via Gateway QR)**
**How it works:**
- When guests scan vendor's gateway QR at your event
- BU is sent directly to your event wallet
- You receive notification
- BU accumulates in the event
- You can withdraw from event to main wallet later

**Backend Flow:**
- Guest scans gateway QR
- Sends BU via `POST /api/transfers/gateway-qr`
- BU goes to your event wallet (not main wallet)
- You can withdraw from event later using `POST /api/events/[id]/withdraw`

---

## 🔐 **Security Features**

### PIN Verification
- **All transfers require PIN verification**
- 4-digit PIN set during registration
- PIN is hashed with bcrypt (never stored in plain text)
- PIN must be entered for every transfer

### Balance Validation
- System checks sender has sufficient balance
- Transfer fails if insufficient funds
- Error message displayed to user

### Transaction Integrity
- All transfers are atomic (all-or-nothing)
- If any step fails, transaction is rolled back
- Both wallets updated simultaneously
- Transfer record created only on success

---

## 📊 **Transfer Types**

1. **`transfer`** - Regular peer-to-peer transfer
2. **`tip`** - Tip transfer (same as transfer but marked as tip)
3. **`gateway_qr`** - Event-based transfer via gateway QR

---

## 🔔 **Notifications**

### When Sending BU:
- You receive: "ɃU Sent" notification
- Recipient receives: "ɃU Received" notification

### When Receiving BU:
- You receive: "ɃU Received" notification with sender details
- Sender receives: "ɃU Sent" notification

### At Events:
- Celebrant receives: "ɃU Received from Event" notification
- Guest receives: "ɃU Sent" notification
- Vendor receives: "New BU Transfer from Guest" notification

---

## 💰 **Wallet Updates**

### Sender Wallet:
- Balance deducted immediately
- Transaction recorded
- Updated in real-time

### Receiver Wallet:
- Balance added immediately
- Transaction recorded
- Updated in real-time
- If wallet doesn't exist, it's created automatically

---

## 📱 **User Experience Flow**

### Sending BU:
1. Open app → Dashboard
2. Click "Send ɃU" button
3. Choose method:
   - Send to User (search)
   - Give Tip (QR scan)
4. Enter amount & message
5. Enter PIN
6. ✅ Transfer complete
7. See success message
8. View in history

### Receiving BU:
1. **No action needed** - BU arrives automatically
2. Receive notification
3. Check wallet balance (updated automatically)
4. View transaction in history
5. Or show QR code for others to scan

---

## 🎯 **Key Points**

✅ **All transfers require PIN verification**
✅ **All transfers are instant** (no waiting period)
✅ **Balance updates in real-time**
✅ **Notifications sent automatically**
✅ **Transaction history tracked**
✅ **Wallet created automatically** if receiver doesn't have one
✅ **Multiple ways to send** (direct, tip, event)
✅ **Multiple ways to receive** (automatic, QR, username)

---

## 🔄 **Real-Time Updates**

- Dashboard refreshes wallet balance every 5 seconds
- Notifications polled every 5 seconds
- Transfer history updates automatically
- Balance visible immediately after transfer

---

## 📝 **Summary**

**To Send BU:**
1. Search for user OR scan QR code OR scan gateway QR
2. Enter amount
3. Enter PIN
4. ✅ Done!

**To Receive BU:**
1. **Nothing!** BU arrives automatically when someone sends to you
2. Or show your QR code for others to scan
3. Or share your username/phone number

**All transfers are:**
- Instant
- Secure (PIN protected)
- Tracked
- Notified
- Real-time
