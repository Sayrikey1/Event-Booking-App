import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { IBooking, BookingService } from "./../service/bookingService";
import { ICreateBooking, IUpdateBooking } from "../types";
import { CustomRequest } from "../middlewares/TokenVerification";
import { getAuthenticatedUser } from "../utils/authUtils";

export class BookingController {
    booking: IBooking = new BookingService();
    
    constructor() {}
    
    CreateBooking: RequestHandler = async (req, res) => {
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }
        const body = req.body as ICreateBooking;
        const response = await this.booking.CreateBooking(authenticatedUser.id ,body);
        res.status(response.status || StatusCodes.CREATED).json(response);
    };
    
    GetBooking: RequestHandler = async (req, res) => {
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }
        const { id } = req.params;
        const response = await this.booking.GetBooking(authenticatedUser.id ,id);
        res.status(response.status || StatusCodes.OK).json(response);
    };
    
    GetAllBookings: RequestHandler = async (req, res) => {
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }
        const response = await this.booking.GetAllBookings(authenticatedUser.id);
        res.status(response.status || StatusCodes.OK).json(response);
    };
    
    DeleteBooking: RequestHandler = async (req: CustomRequest, res): Promise<void> => {
        const { id } = req.params;
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }

        const response = await this.booking.DeleteBooking(authenticatedUser.id, id); 
        res.status(response.status || StatusCodes.OK).json(response);
    };

    DeleteAllBookings: RequestHandler = async (req: CustomRequest, res): Promise<void> => {
        const authenticatedUser = getAuthenticatedUser(req); 
        if (!authenticatedUser) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not authenticated" });
            return;
        }
        const { event_id } = req.params;
        const response = await this.booking.DeleteAllBookings(authenticatedUser.id, event_id);
        res.status(response.status || StatusCodes.OK).json(response);
    }
}