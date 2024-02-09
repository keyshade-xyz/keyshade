export const addHoursToDate = (hours?: string): Date | undefined => {
  if (!hours || hours === 'never') return undefined

  const date = new Date()
  date.setHours(date.getHours() + +hours)
  return date
}
