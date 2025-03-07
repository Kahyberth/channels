import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsGateway } from './channels.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Chat } from './entities/chat.entity';
import { ChannelController } from './channel.controller';

@Module({
  providers: [ChannelsGateway, ChannelsService],
  controllers: [ChannelController],
  imports: [TypeOrmModule.forFeature([Channel, Chat])],
})
export class ChannelsModule {}
