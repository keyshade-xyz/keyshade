import { TypeOf, z } from 'zod'
import { EnvSchema, EnvSchemaType } from './env.schema'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaType {}
  }
}
