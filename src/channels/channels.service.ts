import { Injectable, Logger } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { EntityManager } from 'typeorm';
import { Chat } from './entities/chat.entity';

@Injectable()
export class ChannelsService {
  private logger = new Logger('ChannelsService');

  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    private manager: EntityManager,
  ) {}

  async createChannel(createChannelDto: CreateChannelDto) {
    try {
      const channel = await this.manager.transaction(async (manager) => {
        const channel = this.channelRepository.create({
          name: createChannelDto.name,
          description: createChannelDto.description,
          team_id: createChannelDto.team_id,
          user_id: createChannelDto.user_id,
          is_private: createChannelDto.is_private,
          is_deleted: createChannelDto.is_deleted,
        });
  
        const savedChannel = await manager.save(channel);
          
        const chat = this.chatRepository.create({
          channel_id: savedChannel.id,
          channel: savedChannel,
          name: 'General',
          description: 'General chat',
          user_id: savedChannel.user_id,
        });
  
        await manager.save(chat);
        this.logger.log(`Channel created: ${channel.id}`);
        return channel;
      });
      return channel;
    } catch (error) {
      throw new RpcException(error);
    }
  }
  

  findAll() {
    return `This action returns all channels`;
  }

  findOne(id: number) {
    return `This action returns a #${id} channel`;
  }

  update(id: number, updateChannelDto: UpdateChannelDto) {
    return `This action updates a #${id} channel`;
  }

  remove(id: number) {
    return `This action removes a #${id} channel`;
  }
}
