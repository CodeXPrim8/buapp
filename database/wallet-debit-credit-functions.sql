-- Atomic debit/credit for main BU balance
-- Run in Supabase SQL Editor to enable professional wallet deduction logic.

-- Debit: subtract BU from user's main balance (and naira_balance in sync).
-- Returns: success, new_balance, balance_before, error_message
-- Uses row lock (FOR UPDATE) to prevent race conditions.
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS TABLE(
  success boolean,
  new_balance numeric,
  balance_before numeric,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_naira numeric;
  v_new_balance numeric;
  v_new_naira numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT false, NULL::numeric, NULL::numeric, 'Amount must be positive'::text;
    RETURN;
  END IF;

  SELECT w.balance, w.naira_balance INTO v_balance, v_naira
  FROM wallets w
  WHERE w.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::numeric, NULL::numeric, 'Wallet not found'::text;
    RETURN;
  END IF;

  IF v_balance < p_amount THEN
    RETURN QUERY SELECT false, NULL::numeric, v_balance, 'Insufficient balance'::text;
    RETURN;
  END IF;

  v_new_balance := ROUND((v_balance - p_amount)::numeric, 2);
  v_new_naira := ROUND((v_naira - p_amount)::numeric, 2);

  UPDATE wallets
  SET balance = v_new_balance, naira_balance = v_new_naira, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, v_new_balance, v_balance, NULL::text;
END;
$$;

-- Credit: add BU to user's main balance (and naira_balance in sync).
-- Creates wallet if it does not exist (e.g. super admin).
-- Returns: success, new_balance, balance_before, error_message
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS TABLE(
  success boolean,
  new_balance numeric,
  balance_before numeric,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_naira numeric;
  v_new_balance numeric;
  v_new_naira numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT false, NULL::numeric, NULL::numeric, 'Amount must be positive'::text;
    RETURN;
  END IF;

  INSERT INTO wallets (user_id, balance, naira_balance)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT w.balance, w.naira_balance INTO v_balance, v_naira
  FROM wallets w
  WHERE w.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::numeric, NULL::numeric, 'Wallet not found'::text;
    RETURN;
  END IF;

  v_new_balance := ROUND((v_balance + p_amount)::numeric, 2);
  v_new_naira := ROUND((v_naira + p_amount)::numeric, 2);

  UPDATE wallets
  SET balance = v_new_balance, naira_balance = v_new_naira, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, v_new_balance, v_balance, NULL::text;
END;
$$;

-- Grant execute to authenticated and service role (for API)
GRANT EXECUTE ON FUNCTION debit_wallet(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION debit_wallet(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION credit_wallet(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION credit_wallet(UUID, NUMERIC) TO service_role;
