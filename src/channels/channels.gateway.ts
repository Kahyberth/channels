import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { ChannelsService } from './channels.service';
import { Server, Socket } from 'socket.io';
import { envs } from 'src/commons/envs';


@WebSocketGateway({
  cors: {
    origin: envs.ORIGIN_CORS,
    credetials: true
  }
})
export class ChannelsGateway  implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly channelsService: ChannelsService) {}
  @WebSocketServer() server: Server;
  all_participants = new Map<string, Map<string, object>>();
  participants_disconnected = new Map<string, Map<string, object>>();
  participants_connected = new Map<string, Map<string, object>>();

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const channel = client.data.channel;
    this.onLeaveChannel(client, channel);
  }



  @SubscribeMessage('leave')
  async onLeaveChannel(client: Socket, channel: string) {
    const user = client.handshake.auth.userProfile;
    if (this.participants_connected.has(channel)) {
      this.participants_connected.get(channel)?.delete(user.id);
      this.server.to(channel).emit('participants_connected', Array.from(this.participants_connected.get(channel)?.values() || []));
      this.participants_disconnected.get(channel)?.set(user.id, {
        id: user.id,
        name: user.name,
        avatar: user.profile.profile_picture,
        online: false,
      });
    }
    const participants = Array.from(this.participants_disconnected.get(channel)?.values() || []);
    console.log('participante desconectado', participants);
    client.leave(channel);
    this.server.to(channel).emit('participants_disconnected', participants);
  }

  @SubscribeMessage('participants')
  async onParticipants(client: Socket, channel: string){

    const user = client.handshake.auth.userProfile;
    client.data.channel = channel;

    if(!user) {
      console.error('No user found');
      return;
    }

    if (this.participants_disconnected.get(channel)?.get(user.id)) {
        this.participants_disconnected.get(channel)?.delete(user.id);
        this.server.to(channel).emit('participants_disconnected', Array.from(this.participants_disconnected.get(channel)?.values() || []));
    }
    this.participants_connected.get(channel)?.set(user.id, {
      id: user.id,
      name: user.name,
      avatar: user.profile.profile_picture,
      online: true,
    });
    const participants = this.participants_connected.get(channel);
    if (!participants) return;
    const participantsArray = Array.from(participants.values());
    this.server.to(channel).emit('participants_connected', participantsArray);
  }

  async handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    // Perform any necessary setup or initialization here
  }


  @SubscribeMessage('join')
  async onJoinChannel(client: Socket, channel: string){
    client.join(channel);
    client.emit('joined', channel);
    const user  = client.handshake.auth.userProfile;
    
    if (!user) {
      console.error('No user found');
      return;
    }

    if (!this.participants_connected.has(channel)) {
      this.participants_connected.set(channel, new Map());
    }

    if (!this.participants_disconnected.has(channel)) {
      this.participants_disconnected.set(channel, new Map());
    }

    if (!this.all_participants.has(channel)) {
      this.all_participants.set(channel, new Map());
    }

    this.onParticipants(client, channel);
    
    //Cargar mensajes
    
    console.log(channel);
    const messages = await this.channelsService.loadMessages(channel);
    console.log(messages);
    client.emit('messages', messages);

    

    
  }


  @SubscribeMessage('message')
  async onMessage(client: Socket, payload: { value: string; channel: string }) {
    const user = client.handshake.auth.userProfile;
    const message = await this.channelsService.sendMessage({
      value: payload.value,
      user_id: user.id,
      channel_id: payload.channel,
      avatar: user.profile.profile_picture,
      userName: user.name,
    });
    this.server.to(payload.channel).emit('messages', {
      id: message.id,
      userId: message.user_id,
      userName: message.userName,
      avatar: message.avatar,
      value: message.message,
      timestamp: message.created_at
    });
  }


  @SubscribeMessage('loadMessages')
  async onLoadMessages(client: Socket, channel: string) {
    const messages = await this.channelsService.loadMessages(channel);
    client.emit('messages', messages);
  }


  
}
