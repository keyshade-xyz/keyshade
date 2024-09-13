import { Response } from 'express'

export default function removeCookie(response: Response) {
  response.cookie('token', '', {
    expires: new Date()
  })
  response.clearCookie('token')
}
