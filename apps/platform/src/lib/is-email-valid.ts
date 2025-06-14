import { z } from 'zod'
import { isEmptyString } from './is-empty-string'

/**
 * Checks if the provided string is a valid email address.
 *
 * @param value - The string to validate as an email address.
 * @returns `true` if the input is a valid email address, otherwise `false`.
 */
export function isEmailValid(value: string | null | undefined): boolean {
  if (isEmptyString(value)) {
    return false
  }
  const { success } = z.string().email().safeParse(value)
  return success
}
