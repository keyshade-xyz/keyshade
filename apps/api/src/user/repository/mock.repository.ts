/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from '@prisma/client'
import { IUserRepository } from './interface.repository'

export class MockUserRepository implements IUserRepository {
  findUserByEmail(email: string): Promise<User> {
    throw new Error('Method not implemented.')
  }
  findUserById(id: string): Promise<User> {
    throw new Error('Method not implemented.')
  }
  findUsers(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<User[]> {
    throw new Error('Method not implemented.')
  }
  createUser(email: string): Promise<User> {
    throw new Error('Method not implemented.')
  }
  deleteUser(id: string): Promise<User> {
    throw new Error('Method not implemented.')
  }
  async updateUser(id: string, data: User): Promise<User> {
    return Promise.resolve({
      id,
      ...data
    })
  }
}
