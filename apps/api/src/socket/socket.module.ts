import { Module } from '@nestjs/common'
import ChangeNotifier from './change-notifier.socket'
import { CommonModule } from 'src/common/common.module'

@Module({
  imports: [CommonModule],
  providers: [ChangeNotifier]
})
export class SocketModule {}
