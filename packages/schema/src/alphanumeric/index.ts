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
  .trim() // purpose(trim method): trim any sort of white space user inputs to make it easier to accurately parse email input
  .min(6, 'Minimum character length(Email): 5') // purpose(min/max): set the min/max characters based upon the IETF's RFC standards -> RFC code 3696 (64 chars for name part before @, 255 for domain name
  .max(254, 'Maximum character length(Email): 255') // purpose 2(min/max): min/max also prevent long strings of code from being submitted
  .email()
  .refine((val) => val.length > 0, {
    message: 'Email alphanumeric string cannot be empty'
  })

//purpose: add alphanumeric schema string for auth device details in order to prevent spoofed data attributes of data
export const IPAddressAlphaNumericStringSchema = z // purpose: additional .trim() and refine are a shield against spoofing attacks
  .string()
  .trim()
  .ip()
  .optional()
  .refine((val) => val !== undefined, {
    message: 'IP Address left undefined'
  })

export const EncryptedDeviceDataSchema = z
  .string()
  .trim()
  .min(44, 'Minimum character length(encryptedIpAddress): 44') // purpose: shortest possible valid encryption result
  .max(128, 'Maximum character length(encryptedIpAddress): 128') // purpose: a safe guard to prevent encrypted ip address overhead overflow and possible DoS attacks from the large processing of encrypted ip data
  .base64() // purpose: ensures the encrypted IP address is a validly encoded, further checks will look for random noise of input
  .refine((val) => !val.includes(' '), {
    message: 'Encrypted string contains internal spaces'
  })

export const OSAlphaNumericStringSchema = z
  .string()
  .min(1, 'Minimum character length(OS): 1')
  .max(512, 'Maximum character length(OS): 512') // purpose: enforces a max character limit for a majority of operating system names and prevents buffer overflow attacks
  .optional()
  .refine((val) => val !== undefined, {
    message: 'OS name left undefined'
  })

export const AgentAlphaNumericStringSchema = z
  .string()
  .min(1, 'Minimum characters(Agent): 1')
  .optional()
  .refine((val) => val !== undefined, {
    message: 'Agent name left undefined'
  })

export const CityAlphaNumericStringSchema = z
  .string()
  .min(1, 'Minimum characters(City): 1')
  .optional()
  .refine((val) => val !== undefined, {
    message: 'City name left undefined'
  })

export const CountryAlphaNumericStringSchema = z
  .string()
  .min(1, 'Minimum characters(Country): 1')
  .optional()
  .refine((val) => val !== undefined, {
    message: 'Country name left undefined'
  })

export const RegionAlphaNumericStringSchema = z
  .string()
  .min(1, 'Minimum characters(Region): 1')
  .optional()
  .refine((val) => val !== undefined, {
    message: 'Region name left undefined'
  })
