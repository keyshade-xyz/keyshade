import { TypeOf } from 'zod'
import { EnvSchema } from './env.schema'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends TypeOf<typeof EnvSchema> {}
  }
}
