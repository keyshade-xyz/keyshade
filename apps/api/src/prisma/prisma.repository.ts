import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Otp, User } from "@prisma/client";

@Injectable()
export class PrimsaRepository {
    constructor(
        private prisma: PrismaService
    ) {}

    /**
     * Find a user by email
     * @param email the email to search for
     * @returns the user if found, null otherwise
     */
    async findUserByEmail(email: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: {
                email
            }
        });
    }

    /**
     * Find a user by the user id
     * @param id The id of the user to find
     * @returns the user if found, null otherwise
     */
    async findUserById(id: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: {
                id
            }
        });
    }

    /**
     * Create a user with the given email. The onboarding process
     * will aim at updating the user further.
     * @param email The email of the user to create
     * @returns 
     */
    async createUser(email: string): Promise<User> {
        return await this.prisma.user.create({
            data: {
                email
            }
        });
    }

    /**
     * Update an existing user
     * @param id ID of the user to update 
     * @param data The data to update (can not update email or id)
     * @returns The updated user
     */
    async updateUser(id: string, data: Partial<User>): Promise<User> {
        delete data.email;
        delete data.id;
        return await this.prisma.user.update({
            where: {
                id
            },
            data
        });
    }

    /**
     * Delete a user by id
     * @param id The id of the user to delete
     * @returns The deleted user
     */
    async deleteUser(id: string): Promise<User> {
        return await this.prisma.user.delete({
            where: {
                id
            }
        });
    }

    /**
     * An OTP is valid if it exists, is not expired, and is associated with the given email
     * @param email the email against which to check the OTP
     * @param otp the OTP code to check
     * @returns returns true if the OTP is valid, false otherwise  
     */
    async isOtpValid(email: string, otp: string): Promise<boolean> {
        const timeNow = new Date();
        return await this.prisma.otp.count({
            where: {
                code: otp,
                user: {
                    email
                },
                expiresAt: {
                    gt: timeNow
                }
            }
        }) > 0;
    }

    async createOtp(email: string, otp: string, expiresAfter: number): Promise<Otp> {
        const timeNow = new Date();
        return await this.prisma.otp.create({
            data: {
                code: otp,
                expiresAt: new Date(timeNow.getTime() + expiresAfter),
                user: {
                    connect: {
                        email
                    }
                }
            }
        });
    }

    async deleteOtp(email: string, otp: string): Promise<void> {
        await this.prisma.otp.delete({
            where: {
                code: otp,
                AND: {
                    user: {
                        email
                    }
                }
            }
        });
    }
}