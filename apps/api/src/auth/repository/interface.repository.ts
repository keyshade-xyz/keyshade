import { User, Otp } from '@prisma/client'

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY'

/**
 * Interface for the Auth Repository.
 */
export interface IAuthRepository {
  /**
   * Checks if an OTP is valid for the given email.
   * @param {User['email']} email - The email against which to check the OTP.
   * @param {string} otp - The OTP code to check.
   * @returns {Promise<boolean>} - A promise that resolves to true if the OTP is valid, false otherwise.
   */
  isOtpValid(email: User['email'], otp: string): Promise<boolean>

  /**
   * Creates an OTP for the given email.
   * @param {User['email']} email - The email to create the OTP for.
   * @param {string} otp - The OTP code.
   * @param {number} expiresAfter - The number of milliseconds after which the OTP expires.
   * @returns {Promise<Otp>} - A promise that resolves to the created OTP.
   */
  createOtp(
    email: User['email'],
    otp: string,
    expiresAfter: number
  ): Promise<Otp>

  /**
   * Deletes an OTP.
   * @param {User['email']} email - The email of the OTP to delete.
   * @param {string} otp - The OTP code to delete.
   * @returns {Promise<void>} - A promise that resolves when the OTP is successfully deleted.
   */
  deleteOtp(email: User['email'], otp: string): Promise<void>
}
