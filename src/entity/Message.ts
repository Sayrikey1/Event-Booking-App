import { Entity, Column } from "typeorm";
import { BaseModel } from "./BaseModel";

export enum MessageType {
  Text = "Text",
  Image = "Image",
  Document = "Document",
}

@Entity()
export class Message extends BaseModel {
  @Column()
  room_id!: string;

  @Column()
  appeal_id!: string;

  @Column()
  sender_user_id!: string;

  @Column()
  message_text!: string;

  @Column({ type: "enum", enum: MessageType })
  message_type!: MessageType;

  @Column()
  sent_at!: Date;
}
