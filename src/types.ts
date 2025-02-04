import { UserType } from "./entity/User";

export interface ILogin {
  email: string;
  password: string;
}

export interface ICreateUser {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  user_type: UserType;
}

export interface IUpateUser {
  id: string;
  username: string;
  address:string;
}

export interface IVerifyOtp {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  status: number;
  message: string;
}

export interface IResetPassword {
  password: string;
  token: string;
}

//-----------------------------------------------

export interface ICreateEvent {
    name: string;
    description: string;
    date: Date;
    location: string;
    totalTickets: number;
    ticket_price: number;
    }

export interface IUpdateEvent {
    id: string;
    date: Date;
    totalTickets: number;
    ticket_price: number;
    }
