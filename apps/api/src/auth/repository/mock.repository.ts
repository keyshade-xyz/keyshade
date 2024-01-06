/* eslint-disable @typescript-eslint/no-unused-vars */
import { IAuthRepository } from './interface.repository'

export class MockAuthRepository implements IAuthRepository {
  isOtpValid(email: string, otp: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  createOtp(
    email: string,
    otp: string,
    expiresAfter: number
  ): Promise<{
    code: string
    userId: string
    createdAt: Date
    expiresAt: Date
  }> {
    throw new Error('Method not implemented.')
  }
  deleteOtp(email: string, otp: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  deleteExpiredOtps(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
