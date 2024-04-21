import { Module } from '@nestjs/common'
import { EventService } from './service/event.service'
import { EventController } from './controller/event.controller'
import { CommonModule } from 'src/common/common.module'

@Module({
  imports: [CommonModule],
  providers: [EventService],
  controllers: [EventController]
})
export class EventModule {}
