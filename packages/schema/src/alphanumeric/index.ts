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
  .email()
  .refine((val) => val.length > 0, {
    message: 'Email alphanumeric string must be a valid email'
  })
