import * as bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import { User } from './db/types'

// Hash PIN
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(pin, salt)
}

// Verify PIN
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

// Get user by phone number - handles multiple formats
export async function getUserByPhone(phoneNumber: string): Promise<User | null> {
  // Remove all non-digits first
  let digitsOnly = phoneNumber.replace(/\D/g, '')
  
  // Generate all possible formats to try
  const formatsToTry: string[] = []
  
  // Format 1: +2348012345678 (with + prefix)
  if (digitsOnly.startsWith('234')) {
    formatsToTry.push('+' + digitsOnly)
    formatsToTry.push(digitsOnly) // 2348012345678
  } else if (digitsOnly.startsWith('0')) {
    // Format 2: 08012345678 (local format)
    formatsToTry.push(digitsOnly) // 08012345678
    formatsToTry.push('234' + digitsOnly.substring(1)) // 2348012345678
    formatsToTry.push('+' + '234' + digitsOnly.substring(1)) // +2348012345678
  } else {
    // Assume it's already normalized
    formatsToTry.push(digitsOnly)
    formatsToTry.push('+' + digitsOnly)
    if (digitsOnly.length >= 10) {
      formatsToTry.push('0' + digitsOnly.slice(-10)) // Local format
    }
  }

  console.log('getUserByPhone - Input:', phoneNumber)
  console.log('getUserByPhone - Formats to try:', formatsToTry)

  // Try each format
  for (const format of formatsToTry) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', format)
      .maybeSingle()

    if (!error && data) {
      console.log('getUserByPhone - Found user with format:', format)
      return data as User
    }
  }

  // If exact match fails, try partial match (last 10 digits)
  if (digitsOnly.length >= 10) {
    const last10 = digitsOnly.slice(-10)
    const partialFormats = [
      '0' + last10,           // 08012345678
      '234' + last10,         // 2348012345678
      '+' + '234' + last10,   // +2348012345678
    ]

    console.log('getUserByPhone - Trying partial match formats:', partialFormats)

    for (const format of partialFormats) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', format)
        .maybeSingle()

      if (!error && data) {
        console.log('getUserByPhone - Found user with partial format:', format)
        return data as User
      }
    }
  }

  console.log('getUserByPhone - User not found with any format')
  return null
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as User
}

// Create user
export async function createUser(userData: {
  phone_number: string
  first_name: string
  last_name: string
  email?: string
  role: 'user' | 'celebrant' | 'vendor' | 'both'
  pin_hash: string
}): Promise<User | null> {
  // #region agent log
  if (typeof window === 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:109',message:'Before createUser insert',data:{phoneNumber:userData.phone_number?.substring(0,5)+'***',role:userData.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  }
  // #endregion agent log
  
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()

  // #region agent log
  if (typeof window === 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:120',message:'After createUser insert',data:{hasData:!!data,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,errorDetails:error?.details,errorHint:error?.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  }
  // #endregion agent log

  if (error) {
    console.error('Error creating user:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    // Throw error with details so it can be caught and returned properly
    throw new Error(`Database error: ${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`)
  }
  
  if (!data) {
    console.error('createUser: No data returned from insert')
    throw new Error('Failed to create user: No data returned from database')
  }
  return data as User
}

// Create wallet for user
export async function createWallet(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('wallets')
    .insert([{
      user_id: userId,
      balance: 0,
      naira_balance: 0,
    }])

  return !error
}
