import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Event } from "./Event";
import { User } from "./User";
import { BaseModel } from "./BaseModel";

@Entity()
export class WaitingList extends BaseModel {
  @ManyToOne(() => User, (user) => user.waitingListEntries, { onDelete: "CASCADE" })
  @JoinColumn({name: "user_id"})
  user: User;

  @ManyToOne(() => Event)
  @JoinColumn({ name: "event_id" })  // Explicitly define the column mapping
  event: Event;

  @Column({ type: "integer" })
  ticket_count: number;
}
