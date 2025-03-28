import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsGateway } from './channels.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Chat } from './entities/chat.entity';
import { ChannelController } from './channel.controller';
import { Message } from './entities/message.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/enum/service.enums';

@Module({
  providers: [ChannelsGateway, ChannelsService],
  controllers: [ChannelController],
  imports: [
    TypeOrmModule.forFeature(
      [Channel, Chat, Message],
    ),
    ClientsModule.register([
      {
        name: NATS_SERVICE.NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          url: 'nats://localhost:4222',
        },
      },
    ]),
  ],
})
export class ChannelsModule {}
