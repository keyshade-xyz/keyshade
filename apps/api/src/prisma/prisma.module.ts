import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrimsaRepository } from './prisma.repository';

@Global()
@Module({
  providers: [PrismaService, PrimsaRepository],
  exports: [PrismaService, PrimsaRepository]
})
export class PrismaModule {}
