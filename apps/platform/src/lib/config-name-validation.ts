import {
  CONFIG_NAME_ERROR_MESSAGE,
  CONFIG_NAME_REGEX
} from '@keyshade/schema/raw'

export { CONFIG_NAME_ERROR_MESSAGE }

export function isValidConfigName(name: string, minLength = 1): boolean {
  const trimmedName = name.trim()

  return (
    trimmedName.length >= minLength && CONFIG_NAME_REGEX.test(trimmedName)
  )
}
