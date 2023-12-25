import { Injectable } from "@nestjs/common";
import { IResendService } from "./resend.service.interface";
import { Resend } from "resend";

@Injectable()
export class TestResend implements IResendService {
    constructor() {
        // Check if resend is working
        new Resend('SOME KEY');
    }

    async sendOtp(email: string, otp: string): Promise<void> {
        console.info(`OTP for ${email} is ${otp}`);
    }
}