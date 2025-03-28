import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { ChannelsService } from "./channels.service";
import { CreateChannelDto } from "./dto/create-channel.dto";


@Controller()
export class ChannelController {

    constructor(
        private readonly channelService: ChannelsService
    ){}


    @MessagePattern('channel.create.channel')
    create(data: any) {
        return this.channelService.createChannel(data);
    }

    @MessagePattern('channel.create.child.channel')
    createChild(payload: any) {
        console.log(payload);
        return this.channelService.createChannel(payload, payload.parentChannelId);
    }
    
    @MessagePattern('channel.load.channels')
    loadChannels(team_id: string) {
        return this.channelService.loadChannels(team_id);
    }

    @MessagePattern('channel.load.messages')
    loadMessages(channel_id: string) {
        return this.channelService.loadMessages(channel_id);
    }





    // @MessagePattern('find_all_channels')
    // findAll() {
    //     return `This action returns all channels`;
    // }
    
    // @MessagePattern('find_channel')
    // findOne(id: number) {
    //     return `This action returns a #${id} channel`;
    // }
    
    // @MessagePattern('update_channel')
    // update(data: any) {
    //     return `This action updates a #${data.id} channel`;
    // }
    
    // @MessagePattern('remove_channel')
    // remove(id: number) {
    //     return `This action removes a #${id} channel`;
    // }
}