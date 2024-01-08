import { IsBoolean, IsString } from "class-validator";

export class ICrateUserDTO {
    @IsString()
    name: string;
    @IsString()
    email: string;
    @IsString()
    profilePictureUrl: string;
    @IsBoolean()
    isActive: boolean;
    @IsBoolean()
    isOnboardingFinished: boolean;
    @IsBoolean()
    isAdmin: boolean;
}