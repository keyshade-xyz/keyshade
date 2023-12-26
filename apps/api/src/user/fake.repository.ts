import { User } from '@prisma/client'
import { PrismaRepository } from '../prisma/prisma.repository'

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
  }
}
