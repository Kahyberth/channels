import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateChannelDto {

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    team_id: string;

    @IsString()
    user_id: string;

    @IsBoolean()
    @IsOptional()
    is_private?: boolean;

    @IsBoolean()
    @IsOptional()
    is_deleted?: boolean;

    @IsString()
    @IsOptional()
    channel_name?: string;
}
