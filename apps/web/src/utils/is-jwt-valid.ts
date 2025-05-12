interface JWTPayload {
  exp?: number
}
export function isActiveJWT(token: string): boolean {
  if (!token) {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  const payload = parts[1]
  const decodedPayload = JSON.parse(atob(payload)) as JWTPayload

  // Check if the token is expired
  if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
    return false
  }

  return true
}
