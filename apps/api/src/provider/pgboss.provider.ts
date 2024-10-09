// pgboss.provider.ts
import { Provider } from '@nestjs/common'
import PgBoss from 'pg-boss'

export const PG_BOSS = 'PG_BOSS'

export const PgBossProvider: Provider = {
  provide: PG_BOSS,
  useFactory: async () => {
    const connectionString = process.env.DATABASE_CONNECTION_STRING
    const boss = new PgBoss(connectionString)
    await boss.start()
    return boss
  }
}
