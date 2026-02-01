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
