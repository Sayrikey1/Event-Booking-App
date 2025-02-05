import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { IEvent, EventService } from "./../service/eventService";
import { ICreateEvent, IUpdateEvent } from "../types";
import { CustomRequest } from "../middlewares/TokenVerification";
import { getAuthenticatedUser } from "../utils/authUtils";

export class EventController {
    event: IEvent = new EventService();
    
    constructor() {}
    
    CreateEvent: RequestHandler = async (req, res) => {
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }        
        const body = req.body as ICreateEvent;
        const response = await this.event.CreateEvent(authenticatedUser.id, body);
        res.status(response.status || StatusCodes.CREATED).json(response);
    };
    
    GetEvent: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const response = await this.event.GetEvent(id);
        res.status(response.status || StatusCodes.OK).json(response);
    };
    
    GetAllEvents: RequestHandler = async (req, res) => {
        const response = await this.event.GetAllEvents();
        res.status(response.status || StatusCodes.OK).json(response);
    };
    
    UpdateEvent: RequestHandler = async (req: CustomRequest, res): Promise<void> => {
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }
        const body = req.body as IUpdateEvent;
        const response = await this.event.UpdateEvent(authenticatedUser.id, body);
        res.status(response.status || StatusCodes.OK).json(response);
    };
    
    DeleteEvent: RequestHandler = async (req: CustomRequest, res): Promise<void> => {
        const { id } = req.params;
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }

        const response = await this.event.DeleteEvent(authenticatedUser.id, id); 
        res.status(response.status || StatusCodes.OK).json(response);
    };
}
