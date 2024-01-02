/**
 * Removes fields from an object
 * @param key  The object to remove fields from
 * @param fields  The fields to remove
 * @returns The object without the removed fields
 */
export const excludeFields = <T, K extends keyof T>(
  key: T,
  ...fields: K[]
): Partial<T> =>
  Object.fromEntries(
    Object.entries(key).filter(([k]) => !fields.includes(k as K))
  ) as Partial<T>
