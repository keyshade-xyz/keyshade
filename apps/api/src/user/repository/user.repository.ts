import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { User } from '@prisma/client'
import { IUserRepository } from './interface.repository'
import { ICreateUserDto } from '../dto/create.user/create.user'

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: User['email']): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        email
      }
    })
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        id
      }
    })
  }

  async findUsers(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<User[]> {
    return await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },
      where: {
        OR: [
          {
            name: {
              contains: search
            }
          },
          {
            email: {
              contains: search
            }
          }
        ]
      }
    })
  }

  async createUser(email: User['email']): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email
      }
    })
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await this.prisma.user.update({
      where: {
        id
      },
      data
    })
  }

  async deleteUser(id: string): Promise<User> {
    return await this.prisma.user.delete({
      where: {
        id
      }
    })
  }

  async createUserByAdmin(data: ICreateUserDto): Promise<User> {
    return await this.prisma.user.create({
      data: {
        ...data
      }
    })
  }
}
