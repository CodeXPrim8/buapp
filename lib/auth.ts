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
  
  // Diagnostic: Check what phone numbers exist in database (last 4 digits match)
  if (digitsOnly.length >= 4) {
    const last4 = digitsOnly.slice(-4)
    const { data: allUsers, error: searchError } = await supabase
      .from('users')
      .select('id, phone_number, role')
      .like('phone_number', `%${last4}`)
    
    // Diagnostic: Try to get ANY users to check database access
    const { data: anyUsers, error: anyError, count } = await supabase
      .from('users')
      .select('id, phone_number, role', { count: 'exact' })
      .limit(5)
    
    // Diagnostic: Try searching for "0813" pattern (common Nigerian format)
    const { data: localFormatUsers, error: localError } = await supabase
      .from('users')
      .select('id, phone_number, role')
      .like('phone_number', '%0813%')
      .limit(10)
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
  role: 'user' | 'celebrant' | 'vendor' | 'both' | 'admin' | 'superadmin'
  pin_hash: string
}): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()

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
