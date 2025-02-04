import { Entity, ManyToOne } from "typeorm";
import { Event } from "./Event";
import { User } from "./User";
import { BaseModel } from "./BaseModel";

@Entity()
export class WaitingList extends BaseModel {
  @ManyToOne(() => User, (user) => user.waitingListEntries, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => Event)
  event: Event;
}
