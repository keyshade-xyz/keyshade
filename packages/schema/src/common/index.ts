import { z } from 'zod'

export const CONFIG_NAME_REGEX = /^[A-Za-z0-9_]+$/

export const CONFIG_NAME_ERROR_MESSAGE =
  'Name can only contain letters, numbers, and underscores'

export const ConfigNameSchema = z
  .string()
  .trim()
  .regex(CONFIG_NAME_REGEX, CONFIG_NAME_ERROR_MESSAGE)
