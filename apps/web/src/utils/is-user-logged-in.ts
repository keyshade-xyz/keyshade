import Cookies from 'js-cookie'
import { isActiveJWT } from './is-jwt-valid'

export function isUserLoggedIn(): boolean {
  if (typeof document === 'undefined') {
    return false
  }
  const token = Cookies.get('token')

  if (!token) {
    return false
  }

  if (!isActiveJWT(token.split(' ')[1])) {
    Cookies.remove('token')
    Cookies.remove('isOnboardingFinished')
    return false
  }

  return token.length > 0
}
