import { User } from '@prisma/client'
import { Response } from 'express'

/* istanbul ignore next */
export function sendOAuthFailureRedirect(response: Response, reason: string) {
  response
    .status(302)
    .redirect(
      `${process.env.PLATFORM_FRONTEND_URL}${process.env.PLATFORM_OAUTH_FAILURE_REDIRECT_PATH}?reason=${reason}`
    )
}

/* istanbul ignore next */
export function sendOAuthSuccessRedirect(response: Response, user: User) {
  response
    .status(302)
    .redirect(
      `${process.env.PLATFORM_FRONTEND_URL}${process.env.PLATFORM_OAUTH_SUCCESS_REDIRECT_PATH}?data=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    )
}
