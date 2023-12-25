import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrimsaRepository } from '../prisma/prisma.repository';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UserAuthenticatedResponse } from './auth.types';
import { IResendService, RESEND_SERVICE } from '../resend/services/resend.service.interface';

@Injectable()
export class AuthService {
    private readonly OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
    constructor(
        private repository: PrimsaRepository,
        @Inject(RESEND_SERVICE) private resend: IResendService,
        private jwt: JwtService
    ) {}

    async sendOtp(email: string): Promise<void> {
        if (!email || !email.includes('@')) {
            console.error(`Invalid email address: ${email}`);
            throw new HttpException('Please enter a valid email address', HttpStatus.BAD_REQUEST);
        }

        // We need to create the user if it doesn't exist yet
        if (!await this.repository.findUserByEmail(email)) {
            await this.repository.createUser(email);
        }

        const otp = await this.repository.createOtp(
            email, 
            randomUUID().slice(0, 6).toUpperCase(), 
            this.OTP_EXPIRY);

        await this.resend.sendOtp(email, otp.code);
        console.info(`Login code sent to ${email}: ${otp.code}`);
    }

    async validateOtp(email: string, otp: string): Promise<UserAuthenticatedResponse> {
        const user = await this.repository.findUserByEmail(email);
        if (!user) {
            console.error(`User not found: ${email}`);
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        if (!await this.repository.isOtpValid(email, otp)) {
            console.error(`Invalid login code for ${email}: ${otp}`);
            throw new HttpException('Invalid login code', HttpStatus.UNAUTHORIZED);
        }

        await this.repository.deleteOtp(email, otp);

        return {
            ...user,
            token: await this.jwt.signAsync({ id: user.id, email: user.email })
        };
    }
}
