import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from './chat.entity';

@Entity()
export class Channel {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 100,
    })
    name: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    description: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
    })
    team_id: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
    })
    user_id: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    created_at: Date;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updated_at: Date;

    @Column({
        type: 'timestamp',
        nullable: true,
    })
    deleted_at: Date;

    @Column({
        type: 'boolean',
        default: false,
    })
    is_private: boolean;

    @Column({
        type: 'boolean',
        default: false,
    })
    is_deleted: boolean;

    @OneToMany(() => Chat, (chat) => chat.channel)
    chats: Chat[];

    @Column({ type: 'uuid', nullable: true })
    parent_id: string;

    @ManyToOne(() => Channel, (channel) => channel.subChannels, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    parent: Channel | null;

    @OneToMany(() => Channel, (channel) => channel.parent)
    subChannels: Channel[];

}
 