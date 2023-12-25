import { User } from "@prisma/client";

export type UserAuthenticatedResponse = User & {
    token: string;
}