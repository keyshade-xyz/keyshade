import { z } from 'zod'

export const AlphaNumericStringSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]+$/)
  .refine((val) => val.length > 0, {
    message: 'Alphanumeric string cannot be empty'
  })

// This is a string that can only contain alphanumeric characters and underscores
export const VariableAlphaNumericStringSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]+$/)
  .refine((val) => val.length > 0, {
    message: 'Variable alphanumeric string cannot be empty'
  })

export const ExtendedAlphaNumericStringSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .refine((val) => val.length > 0, {
    message: 'Extended alphanumeric string cannot be empty'
  })

export const ColorCodeAlphaNumericStringSchema = z
  .string()
  .refine((val) => val.length === 6, {
    message: 'Color code alphanumeric string must be 6 characters long'
  })
  .refine((val) => /^[0-9A-F]+$/.test(val), {
    message: 'Color code alphanumeric string must be a valid hex color code'
  })

export const EmailAlphaNumericStringSchema = z
  .string()
  .trim() // purpose: trim any sort of white space user inputs for get all characters
  // purpose: set the min/max characters based upon the IETF's RFC standards -> RFC code 3696 (64 chars for name part before @, 255 for domain name
  // purpose: min/max also prevent long strings of code from being submitted
  .min(6, 'Minimum character length: 5')
  .max(254, 'Maximum character length: 255')
  .email()
  .refine((val) => val.length > 0, {
    message: 'Email alphanumeric string must be a valid email'
  })
