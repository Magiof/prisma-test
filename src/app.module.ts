import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './db/prisma/prisma.module';
import { MeetingsModule } from './modules/meetings/meetings.module';

@Module({
  imports: [UsersModule, PrismaModule, MeetingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
