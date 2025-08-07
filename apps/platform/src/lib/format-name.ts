/**
 * Formats a given string by capitalizing the first character and converting the rest to lowercase.
 *
 * @param text - The input string to format.
 * @returns The formatted string with the first letter capitalized and the rest in lowercase.
 */
export const formatName = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
