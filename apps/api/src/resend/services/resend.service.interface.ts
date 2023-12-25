export const RESEND_SERVICE = 'RESEND_SERVICE';

export interface IResendService {
    sendOtp(email: string, otp: string): Promise<void>;
}