// Input sanitization utilities using DOMPurify

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated HTML content before rendering
 */
export function sanitizeHTML(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use a basic sanitization
    return dirty
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  
  // Client-side: use DOMPurify
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Sanitize HTML but allow basic formatting tags
 * Use this for rich text content where some formatting is needed
 */
export function sanitizeHTMLWithFormatting(dirty: string): string {
  if (typeof window === 'undefined') {
    return sanitizeHTML(dirty)
  }
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Sanitize text input (remove any HTML/script tags)
 * Use this for text fields that should only contain plain text
 */
export function sanitizeText(input: string): string {
  if (!input) return ''
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities
  if (typeof window !== 'undefined') {
    const div = document.createElement('div')
    div.textContent = sanitized
    sanitized = div.innerHTML
  }
  
  return sanitized.trim()
}

/**
 * Sanitize phone number input
 */
export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  // Remove any HTML/script tags and trim
  return sanitizeText(email).toLowerCase().trim()
}

/**
 * Sanitize name input (first name, last name, etc.)
 */
export function sanitizeName(name: string): string {
  // Remove HTML tags, trim, and limit length
  const sanitized = sanitizeText(name)
  return sanitized.substring(0, 100) // Limit to 100 characters
}
