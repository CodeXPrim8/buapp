import { NextRequest, NextResponse } from 'next/server'
import { deleteAuthCookie } from '@/lib/cookies'
import { successResponse } from '@/lib/api-helpers'

// Admin logout
export async function POST(request: NextRequest) {
  const response = successResponse({ message: 'Logged out successfully' })
  await deleteAuthCookie(response)
  return response
}
