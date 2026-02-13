# How to Send Naira to a User’s Bank Account

When a user requests a withdrawal, their ɃU balance is already debited. You need to send the **Naira equivalent** to the bank account (or wallet) they provided. You can do this **manually** or **via Paystack** from the admin dashboard.

---

## Option 1: Manual transfer (your bank app or USSD)

1. Open **Admin Dashboard → Withdrawals**.
2. Find the **pending** request and note:
   - **Bank name**
   - **Account number**
   - **Account name**
   - **Amount (₦)**
3. In your **bank’s app** (or USSD):
   - Choose **Transfer** or **Send money**.
   - Select the **bank** (same as “Bank name” above).
   - Enter the **account number** and confirm the **account name** matches.
   - Enter the **amount (₦)** and add a reference if you want (e.g. `BU-WD-{withdrawal-id}`).
   - Complete the transfer.
4. Back in the dashboard, click **Complete** for that withdrawal so the user gets the “Withdrawal completed” notification.

---

## Option 2: Send via Paystack (automated)

If your **Paystack** account has **Transfer** enabled and a **balance** (or linked account) to debit:

1. Open **Admin Dashboard → Withdrawals**.
2. For a **bank** withdrawal with status **Pending** or **Processing**, click **Send Naira (Paystack)**.
3. The app will:
   - Resolve the user’s bank to Paystack’s bank code.
   - Create a transfer recipient (account number + bank + account name).
   - Initiate a Paystack transfer for the withdrawal amount (in kobo).
4. If the transfer is successful, the withdrawal is marked **Completed** and the user is notified. If it fails, you’ll see an error and can use **Option 1** instead.

**Requirements:**

- **PAYSTACK_SECRET_KEY** set in the admin app’s environment (same as for payments).
- Paystack **Transfer** product enabled and **sufficient balance** (or configured funding) in your Paystack dashboard.
- User’s **bank** must be supported by Paystack (most Nigerian banks and many microfinance banks are).

**Notes:**

- Paystack uses **kobo** (₦1 = 100 kobo). The integration converts the withdrawal amount automatically.
- If the bank name from the user doesn’t match Paystack’s list exactly, “Send Naira (Paystack)” may fail; use manual transfer and then **Complete**.
- For **wallet** withdrawals (e.g. ɃU wallet), only manual or your own wallet process applies; Paystack Transfer is for **bank** payouts only.

---

## Summary

| Method              | Steps                                                                 |
|---------------------|-----------------------------------------------------------------------|
| **Manual**          | Copy details from Withdrawals → send via your bank app → click Complete. |
| **Paystack**        | Click “Send Naira (Paystack)” on a bank withdrawal → we send and mark Complete on success. |

After the user receives the Naira, always mark the withdrawal as **Complete** in the dashboard so they get the receipt and status update.
