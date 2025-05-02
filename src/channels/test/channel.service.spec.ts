import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from '../channels.service';
import { EntityManager } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Channel } from '../entities/channel.entity';
import { Chat } from '../entities/chat.entity';
import { Message } from '../entities/message.entity';
import { of } from 'rxjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NATS_SERVICE } from '../../enum/service.enums';

import { Repository as TypeOrmRepository } from 'typeorm';

describe('ChannelsService', () => {
  let service: ChannelsService;

  const channelRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmRepository<Channel>>;

  const chatRepo = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmRepository<Chat>>;

  const messageRepo = {
    create: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmRepository<Message>>;

  const manager: any = {
    transaction: jest.fn(),
  };

  const client = {
    send: jest.fn(),
  } as unknown as jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: EntityManager, useValue: manager },
        { provide: getRepositoryToken(Channel), useValue: channelRepo },
        { provide: getRepositoryToken(Chat), useValue: chatRepo },
        { provide: getRepositoryToken(Message), useValue: messageRepo },
        { provide: NATS_SERVICE.NATS_SERVICE, useValue: client },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    jest.clearAllMocks();
  });

  describe('createChannel', () => {
    const dto = {
      name: 'General',
      description: 'Desc',
      team_id: 't1',
      user_id: 'u1',
      is_deleted: false,
      is_private: false,
      channel_name: '',
    } as any;

    it('creates a new channel without parent', async () => {
      const saved = { id: 'c1', ...dto } as Channel;
      // simulate transaction with callback manager
      manager.transaction.mockImplementation(
        async (fn: any) =>
          await fn({
            findOne: () => null,
            save: jest.fn().mockResolvedValue(saved),
          }),
      );

      channelRepo.create.mockReturnValue(saved);
      chatRepo.create.mockReturnValue({ id: 'chat1' } as Chat);

      const result = await service.createChannel(dto);
      expect(result).toEqual(saved);
      expect(channelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: dto.name }),
      );
      expect(chatRepo.create).toHaveBeenCalled();
    });

    it('throws if parentChannelId not found', async () => {
      manager.transaction.mockImplementation(
        async (fn: any) => await fn({ findOne: () => Promise.resolve(null) }),
      );
      await expect(
        service.createChannel(dto, 'nonexistent'),
      ).rejects.toBeInstanceOf(RpcException);
    });
  });

  describe('sendMessage', () => {
    const payload = {
      value: 'hi',
      user_id: 'u1',
      channel_id: 'c1',
      avatar: 'a',
      userName: 'Joe',
    };

    it('throws if chat not found', async () => {
      chatRepo.findOne.mockResolvedValue(null);
      await expect(service.sendMessage(payload as any)).rejects.toBeInstanceOf(
        RpcException,
      );
    });

    it('saves message when chat exists', async () => {
      const chat = { id: 'chat1' } as Chat;
      chatRepo.findOne.mockResolvedValue(chat);
      const msg = { id: 'm1', ...payload, chat } as unknown as Message;
      messageRepo.create.mockReturnValue(msg);
      messageRepo.save.mockResolvedValue(msg);

      const res = await service.sendMessage(payload as any);
      expect(res).toEqual(msg);
      expect(messageRepo.save).toHaveBeenCalledWith(msg);
    });
  });

  describe('loadMessages', () => {
    it('returns mapped messages', async () => {
      const messages = [
        {
          id: 'm1',
          user_id: 'u1',
          message: 'yo',
          created_at: new Date(),
          avatar: 'a',
          userName: 'Joe',
          chat: { channel_id: 'c1' },
        },
      ] as any;
      messageRepo.find.mockResolvedValue(messages);

      const res = await service.loadMessages('c1');
      expect(res).toEqual([
        {
          id: 'm1',
          user_id: 'u1',
          value: 'yo',
          timestamp: messages[0].created_at,
          avatar: 'a',
          userName: 'Joe',
        },
      ]);
    });

    it('throws on repository error', async () => {
      messageRepo.find.mockRejectedValue(new Error('fail'));
      await expect(service.loadMessages('c1')).rejects.toBeInstanceOf(
        RpcException,
      );
    });
  });

  describe('loadChannels', () => {
    it('loads channels and maps data', async () => {
      const channels = [
        {
          id: 'c1',
          name: 'Gen',
          description: 'D',
          team_id: 't1',
          is_deleted: false,
          is_private: true,
        },
      ] as any;
      channelRepo.find.mockResolvedValue(channels);

      const members = [{ member: { id: 'u1', name: 'Joe' } }];
      client.send.mockReturnValueOnce(of(members));
      client.send.mockReturnValueOnce(of({ id: 't1', name: 'Team' }));

      const res = await service.loadChannels('t1');
      expect(res[0]).toMatchObject({
        id: 'c1',
        name: 'Gen',
        members: expect.any(Array),
      });
    });

    it('throws when client errors', async () => {
      channelRepo.find.mockResolvedValue([]);
      client.send.mockReturnValueOnce(of(null).pipe());
      await expect(service.loadChannels('t1')).rejects.toBeInstanceOf(
        RpcException,
      );
    });
  });
});
