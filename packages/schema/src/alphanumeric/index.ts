import { z } from 'zod'

export const AlphaNumericStringSchema = z
  .string()
  .refine((val) => val.length > 0, {
    message: 'Alphanumeric string cannot be empty'
  })
  .regex(/^[a-zA-Z0-9]+$/)

// This is a string that can only contain alphanumeric characters and underscores
export const VariableAlphaNumericStringSchema = z
  .string()
  .refine((val) => val.length > 0, {
    message: 'Variable alphanumeric string cannot be empty'
  })
  .regex(/^[a-zA-Z0-9_]+$/)

export const ExtendedAlphaNumericStringSchema = z
  .string()
  .refine((val) => val.length > 0, {
    message: 'Extended alphanumeric string cannot be empty'
  })
  .regex(/^[a-zA-Z0-9_-]+$/)

export const ColorCodeAlphaNumericStringSchema = z
  .string()
  .refine((val) => val.length === 6, {
    message: 'Color code alphanumeric string must be 6 characters long'
  })
  .refine((val) => /^[0-9A-F]+$/.test(val), {
    message: 'Color code alphanumeric string must be a valid hex color code'
  })
