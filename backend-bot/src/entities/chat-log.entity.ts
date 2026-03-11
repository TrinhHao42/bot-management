import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_logs')
export class ChatLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  botId: string;

  @Column()
  userId: string;

  @Column('text')
  message: string;

  @Column({ type: 'varchar', length: 10 }) // 'user' or 'bot'
  sender: 'user' | 'bot';

  @CreateDateColumn()
  createdAt: Date;
}
