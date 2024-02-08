import { Module } from '@nestjs/common'
import { EventService } from './service/event.service'
import { EventController } from './controller/event.controller'

@Module({
  providers: [EventService],
  controllers: [EventController]
})
export class EventModule {}
