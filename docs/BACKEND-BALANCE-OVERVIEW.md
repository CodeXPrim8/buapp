# Backend: BU balance & ticket purchase

Overview of the backend flow for ticket purchase with BU and how the balance is debited and returned.

---

## 1. Ticket purchase API

**Route:** `POST /api/tickets/purchase`  
**File:** `app/api/tickets/purchase/route.ts`

### Auth and user resolution

1. **JWT** from httpOnly cookie via `getAuthUser(request)` → `authUser.userId`, `authUser.phoneNumber`.
2. **User in DB:** `users` row where `id = authUser.userId`.
3. **If no row:** fallback to `x-user-phone` header → lookup `users` by `phone_number` → use `userByPhone.id` as buyer.

So the **buyer** can be:

- `dbUser.id` when JWT userId exists in `users`, or  
- `userByPhone.id` when JWT userId is missing in DB but `x-user-phone` is sent and matches a user.

### Purchase flow (high level)

| Step | Action | Where |
|------|--------|--------|
| 1 | Validate body: `event_id`, `quantity`, `pin` | route |
| 2 | Verify PIN for `buyerId` | `users.pin_hash` |
| 3 | Load event, check tickets enabled, public, availability, price | `events` |
| 4 | Resolve super admin (env or `role = 'superadmin'`) | route |
| 5 | **Debit buyer** | `debitMainBalance(supabase, buyerId, totalPrice)` |
| 6 | Credit super admin | `creditMainBalance(supabase, superAdminId, totalPrice)` |
| 7 | Insert transfer (buyer → super admin) | `transfers` |
| 8 | Insert ticket | `tickets` |
| 9 | Update event `tickets_sold`, `total_bu_received` | `events` |
| 10 | Insert notification | `notifications` |
| 11 | Return `ticket`, `transfer`, `message`, **`new_balance`** | response |

`new_balance` in the response is **always** the buyer’s balance **after** the debit (from `debitResult.newBalance`).

---

## 2. Wallet debit/credit

**File:** `lib/wallet-balance.ts`

### debitMainBalance(supabase, userId, amountBu)

- **Preferred:** Supabase RPC `debit_wallet(p_user_id, p_amount)`.
- **Fallback:** if RPC missing or error, read `wallets` for `user_id`, then `UPDATE` balance and naira_balance.

**Returns:** `{ success, newBalance, balanceBefore, errorMessage }`.

- `newBalance` = balance **after** debit (what we send to the client as `new_balance`).
- `balanceBefore` = balance before debit (used for “Insufficient balance” message).

### creditMainBalance(supabase, userId, amountBu)

- **Preferred:** RPC `credit_wallet(p_user_id, p_amount)`.
- **Fallback:** ensure wallet row exists (insert if not), then read + update balance/naira_balance.

**Returns:** `{ success, newBalance, balanceBefore, errorMessage }`.

### DB functions (Supabase)

**File:** `database/wallet-debit-credit-functions.sql`

- **debit_wallet(p_user_id UUID, p_amount NUMERIC)**  
  - Locks wallet row with `FOR UPDATE`.  
  - Checks amount & sufficient balance.  
  - Updates `balance` and `naira_balance`.  
  - Returns: `(success, new_balance, balance_before, error_message)`.

- **credit_wallet(p_user_id UUID, p_amount NUMERIC)**  
  - `INSERT ... ON CONFLICT DO NOTHING` so wallet exists.  
  - Locks row, updates balance/naira_balance.  
  - Returns same shape.

Postgres `numeric` can be returned as string in JSON; the Node code uses `Number(row.new_balance)` so the API sends a number.

---

## 3. Wallets “me” API

**Route:** `GET /api/wallets/me`  
**File:** `app/api/wallets/me/route.ts`

### User resolution (aligned with purchase)

1. `getAuthUser(request)` → `authUser.userId`, `authUser.phoneNumber`.
2. Lookup `users` where `id = authUser.userId`.
3. **If no row:** use `x-user-phone` header or `authUser.phoneNumber` → lookup by `phone_number` → use that user’s `id`.

So the same user can be resolved by JWT **or** by phone, matching the purchase route. The wallet returned is for the **same** user that would be debited on purchase.

### Response

- **Success:** `{ success: true, data: { wallet } }` with `wallet.balance` (and other wallet fields).
- **No wallet:** create one with balance 0 and return it.
- **Headers:** `Cache-Control: no-store, no-cache...` so the response is not cached.

`wallet.balance` comes from the DB; Supabase may return it as string. The frontend uses `parseFloat(wallet.balance || '0')`.

---

## 4. Data flow summary

```
Purchase:
  getAuthUser → resolve buyerId (JWT userId or phone)
  debitMainBalance(supabase, buyerId, totalPrice)
    → RPC debit_wallet or fallback UPDATE
    → returns newBalance (after debit)
  Response: { ..., new_balance: buyerNewBalance }

Wallets/me:
  getAuthUser → resolve userId (same logic: JWT then phone)
  SELECT wallets WHERE user_id = userId
  Response: { wallet: { balance, ... } }
```

- **Purchase** always returns the **post-debit** balance in `new_balance`.  
- **Wallets/me** returns the **current** wallet row for the **same** user (after user resolution).  
- If RPC is used, debit is atomic and the next read of that wallet will see the new balance. If there is replication lag, a very fast GET could theoretically see the old value; the frontend uses an 8s “don’t overwrite with getMe() after purchase” window to avoid that.

---

## 5. Things to verify in backend

1. **RPC deployed**  
   Run `database/wallet-debit-credit-functions.sql` in the Supabase SQL editor so `debit_wallet` and `credit_wallet` exist. If not, the fallback path is used (read then update; still correct but no row lock).

2. **User resolution**  
   JWT `userId` must match `users.id` for the logged-in user, or the phone fallback must be used. If the client never sends `x-user-phone`, wallets/me uses `authUser.phoneNumber` from the JWT when the userId lookup fails.

3. **Super admin**  
   Either `SUPER_ADMIN_USER_ID` env or a user with `role = 'superadmin'` must exist; otherwise purchase returns 500.

4. **Wallets table**  
   `wallets` has `user_id`, `balance`, `naira_balance` (and typically `updated_at`). RPC updates both balance columns.

5. **Auth**  
   `lib/api-helpers.ts` `getAuthUser` uses `getAuthCookie` + `verifyToken`. Ensure login sets the JWT with `userId` and `phoneNumber` so purchase and wallets/me resolve the same user.

---

## 6. File reference

| Concern | File |
|--------|------|
| Purchase route | `app/api/tickets/purchase/route.ts` |
| Debit/credit logic | `lib/wallet-balance.ts` |
| Wallets/me route | `app/api/wallets/me/route.ts` |
| Auth (JWT) | `lib/api-helpers.ts`, `lib/cookies`, `lib/jwt` |
| DB functions | `database/wallet-debit-credit-functions.sql` |
| Supabase client | `lib/supabase.ts` |
