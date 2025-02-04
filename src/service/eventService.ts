import dotenv from "dotenv";
import { ICreateEvent } from "src/types";

dotenv.config();

export interface IEvent {
    CreateEvent: (load: ICreateEvent) => Promise<any>;
    GetEvent: (id: string) => Promise<any>;
    GetAllEvents: () => Promise<any>;
    UpdateEvent: (load: IUpdateEvent) => Promise<any>;
    DeleteEvent: (id: string) => Promise<any>;
    }