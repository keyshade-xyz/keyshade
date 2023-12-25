import { Controller, Param, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserAuthenticatedResponse } from './auth.types';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) {}

    @Post('send-otp/:email')
    async sendOtp(@Param('email') email: string): Promise<void> {
        await this.authService.sendOtp(email);
    }

    @Post('validate-otp')
    async validateOtp(
        @Query('email') email: string, 
        @Query('otp') otp: string)
        : Promise<UserAuthenticatedResponse> {
        return await this.authService.validateOtp(email, otp);
    }
}
