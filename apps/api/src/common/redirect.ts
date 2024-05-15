import { User } from '@prisma/client'
import { Response } from 'express'

const platformFrontendUrl = process.env.PLATFORM_FRONTEND_URL
const platformOAuthSuccessRedirectPath =
  process.env.PLATFORM_OAUTH_SUCCESS_REDIRECT_PATH
const platformOAuthFailureRedirectPath =
  process.env.PLATFORM_OAUTH_FAILURE_REDIRECT_PATH
const platformOAuthSuccessRedirectUrl = `${platformFrontendUrl}${platformOAuthSuccessRedirectPath}`
const platformOAuthFailureRedirectUrl = `${platformFrontendUrl}${platformOAuthFailureRedirectPath}`

/* istanbul ignore next */
export function sendOAuthFailureRedirect(response: Response, reason: string) {
  response
    .status(302)
    .redirect(`${platformOAuthSuccessRedirectUrl}?reason=${reason}`)
}

/* istanbul ignore next */
export function sendOAuthSuccessRedirect(response: Response, user: User) {
  response
    .status(302)
    .redirect(
      `${platformOAuthFailureRedirectUrl}?data=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    )
}
