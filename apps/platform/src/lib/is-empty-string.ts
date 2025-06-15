/**
 * Determines whether the provided string is empty or contains only whitespace characters.
 *
 * @param str - The string to check.
 * @returns `true` if the string is empty or consists solely of whitespace; otherwise, `false`.
 */
export function isEmptyString(str: string | null | undefined): boolean {
  if (str === null || str === undefined) {
    return true
  }
  return str.trim().length === 0
}
