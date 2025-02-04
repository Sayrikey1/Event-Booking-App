import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel } from "./BaseModel";
import { User } from "./User";

export enum OtpType {
  UserVerification = "user_verification",
  AccountDeletion = "account_deletion",
}

@Entity()
export class Otp extends BaseModel {
  @ManyToOne(() => User, (user) => user.email, { onDelete: "CASCADE" }) // Foreign key relationship
  @JoinColumn({ name: "user_email", referencedColumnName: "email" }) // Maps this column to the `email` in User
  user!: User;

  @Column({ nullable: false })
  otp_code!: string;

  @Column({ type: "timestamp", nullable: false })
  expires_at!: Date;

  @Column({ default: false })
  is_used!: boolean;

  @Column({ type: "enum", enum: OtpType, nullable: false })
  otp_type!: OtpType;
}