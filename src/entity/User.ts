import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany} from "typeorm";
import { BaseModel } from "./BaseModel";
import { Ticket } from "./Ticket";
import { WaitingList } from "./WaitingList";

export enum UserType {
  Admin = "Admin",
  Basic = "Basic",
}

@Entity('user')
export class User extends BaseModel {
  @Column({ nullable: false })
  @IsNotEmpty({ message: "first_name is required" })
  first_name!: string;

  @Column({ nullable: false })
  @IsNotEmpty({ message: "last_name is required" })
  last_name!: string;

  @Column({ unique: true, nullable: false })
  @IsNotEmpty({ message: "username is required" })
  username!: string;

  @Column({ unique: true, nullable: false })
  @IsNotEmpty({ message: "email is required" })
  email!: string;

  @Column({ unique: true, nullable: true})
  phone_number!: string;

  @Column({ nullable: false })
  @IsNotEmpty({ message: "password is required" })
  password!: string;

  @Column({ type: "enum", enum: UserType, default: UserType.Basic })
  user_type!: UserType;

  @Column({ default: false })
  is_verified!: boolean;

  @Column({ type: 'uuid', nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date | null;

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets: Ticket[];

  @OneToMany(() => WaitingList, (waitingList) => waitingList.user)
  waitingListEntries: WaitingList[];
  events: any;
}



