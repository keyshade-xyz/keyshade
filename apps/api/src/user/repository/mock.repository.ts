/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from '@prisma/client'
import { IUserRepository } from './interface.repository'
import { users } from '../../common/mock-data/users'
import { CreateUserDto } from '../dto/create.user/create.user'

export class MockUserRepository implements IUserRepository {
  findUserByEmail(email: string): Promise<User> {
    throw new Error('Method not implemented.')
  }

  findUserById(id: string): Promise<User> {
    throw new Error('Method not implemented.')
  }

  async findUsers(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<User[]> {
    let user_data = [...users]
    user_data.sort((a, b) => {
      const comparison = a[sort].localeCompare(b[sort])
      return order === 'desc' ? -comparison : comparison
    })

    if (search.trim() !== '') {
      user_data = user_data.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    const start_idx = (page - 1) * limit
    const end_idx = start_idx + limit
    user_data = user_data.slice(start_idx, end_idx)

    return Promise.resolve(user_data)
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

  async createUserByAdmin(user: CreateUserDto): Promise<User> {
    return Promise.resolve({
      id: '1',
      ...user
    })
  }
}
