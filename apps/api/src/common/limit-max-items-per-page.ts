export function limitMaxItemsPerPage(
  limit: number,
  maxlimit: number = 30
): number {
  return Math.min(limit, maxlimit)
}
