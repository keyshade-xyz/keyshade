import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsOptional()
    name: string;
    @IsString()
    email: string;
    @IsString()
    @IsOptional()
    profilePictureUrl: string;
    @IsBoolean()
    isActive: boolean;
    @IsBoolean()
    isOnboardingFinished: boolean;
    @IsBoolean()
    isAdmin: boolean;
}