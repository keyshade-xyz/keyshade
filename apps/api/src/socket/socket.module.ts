import { Module } from '@nestjs/common'
import ChangeNotifier from './change-notifier.socket'

@Module({
  providers: [ChangeNotifier]
})
export class SocketModule {}
