import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { EntityManager } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { Channels, Status } from '../interfaces/channel.interface';
import { NATS_SERVICE } from '../enum/service.enums';
import { catchError, firstValueFrom } from 'rxjs';
import { Members } from '../interfaces/members.interface';
import { Teams } from '../interfaces/teams.interface';

@Injectable()
export class ChannelsService {
  private logger = new Logger('ChannelsService');

  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    private manager: EntityManager,
    @Inject(NATS_SERVICE.NATS_SERVICE) private readonly client: ClientProxy,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createChannel(createChannelDto: CreateChannelDto, parentChannelId?: string) {
    try {
      const channel = await this.manager.transaction(async (manager) => {
        
        let parentChannel: Channel | null = null;
        if (parentChannelId) {
          parentChannel = await manager.findOne(Channel, { where: { id: parentChannelId } });
          if (!parentChannel) {
            throw new RpcException('Parent channel not found');
          }
        }
  
        
        const newChannel = this.channelRepository.create({
          name: createChannelDto.name,
          description: createChannelDto.description,
          team_id: createChannelDto.team_id,
          user_id: createChannelDto.user_id,
          is_deleted: createChannelDto.is_deleted,
          is_private: createChannelDto.is_private,
          parent: parentChannel,
          parent_id: parentChannelId,
        });
  
        const savedChannel = await manager.save(newChannel);
        
        let chat: Chat;

        if (parentChannel) {
          chat = this.chatRepository.create({
            channel_id: savedChannel.id,
            channel: savedChannel,
            name: createChannelDto.channel_name,
            description: `Chat de ${createChannelDto.name}`,
            user_id: savedChannel.user_id,
          });
        } else {
          chat = this.chatRepository.create({
            channel_id: savedChannel.id,
            channel: savedChannel,
            name: createChannelDto.name,
            description: createChannelDto.description,
            user_id: savedChannel.user_id,
          });
        }

        await manager.save(chat);
  
        this.logger.log(`Channel created: ${savedChannel.id}`);
  
        return savedChannel;
      });
      return channel;
    } catch (error) {
      throw new RpcException(error);
    }
  }
  

  async sendMessage(payload: {
    value: string;
    user_id: string;
    channel_id: string;
    avatar: string;
    userName: string;
  }) {
    const chat = await this.chatRepository.findOne({
      where: { channel_id: payload.channel_id },
    });

    if (!chat) {
      throw new RpcException('Chat not found');
    }

    const message = this.messageRepository.create({
      avatar: payload.avatar,
      userName: payload.userName,
      message: payload.value,
      user_id: payload.user_id,
      chat,
    });

    try {
      await this.messageRepository.save(message);
    } catch (error) {
      throw new RpcException(error);
    }
    return message;
  }

  async loadMessages(channel_id: string) {

    try {
      const messages = await this.messageRepository.find({
        where: { chat: { channel_id } },
        relations: ['chat'],
      });

      return messages.map((message) => {
        return {
          id: message.id,
          user_id: message.user_id,
          value: message.message,
          timestamp: message.created_at,
          avatar: message.avatar,
          userName: message.userName,
        };
      });
    } catch (error) {
      throw new RpcException(error);
    }

  }


  async loadChannels(team_id: string) {
    try {
      console.log('Loading channels');
      console.log(team_id);
      const channels = await this.channelRepository.find({
        where: { team_id, is_deleted: false },
        relations: ['parent', 'chats', 'subChannels'],
      });



      const result: Members[] = await firstValueFrom(
        this.client.send('teams.members.by.team',  team_id ).pipe(
          catchError(() => {
            throw new RpcException('Error loading members');
          }),
        ),
      );


      const teams: Teams = await firstValueFrom(
        this.client.send('teams.by.id', team_id).pipe(
          catchError(() => {
            throw new RpcException('Error loading teams');
          }),
        ),
      );


      const members = result.map((member) => {
        return {
          id: member.member.id,
          name: member.member.name,
          avatar: 'https://cdn.pixabay.com/photo/2025/01/12/15/25/tortoise-9328571_1280.jpg', 
          initials: member.member.name.charAt(0).toUpperCase(),
          status: Status.Online,
        };
      });
      
      const data: Channels[] = channels.map((channel) => {
        return {
          id: channel.id,
          name: channel.name,
          description: channel.description,
          initials: channel.name.charAt(0).toUpperCase(),
          isDirectMessage: channel.is_private,
          members,
          unreadCount: 0,
          lastMessage: {
            content: '',
            timestamp: '',
          },
        };
      });


      return data;


    } catch (error) {
      throw new RpcException(error);
    }
  }


}
