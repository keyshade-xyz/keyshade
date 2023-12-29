import { User } from '@prisma/client'
import { PrismaRepository } from '../prisma/prisma.repository'
import { users } from '../mock-data/users'

export const fakeRepository: Partial<PrismaRepository> = {
  async excludeFields<T, K extends keyof T>(
    key: T,
    ...fields: K[]
  ): Promise<Partial<T>> {
    return Object.fromEntries(
      Object.entries(key).filter(([k]) => !fields.includes(k as K))
    ) as Partial<T>
  },

  async updateUser(id: string, data: User): Promise<User> {
    return Promise.resolve({
      id,
      ...data
    })
  },

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
}
