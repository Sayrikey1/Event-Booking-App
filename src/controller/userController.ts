import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { IUser, UserService } from "./../service/userService";
import { ICreateUser, ILogin, IUpateUser, IVerifyOtp, IResetPassword } from "../types";
import { CustomRequest } from "../middlewares/TokenVerification";

export class UserController {
  user: IUser = new UserService();

  constructor() {}

  Login: RequestHandler = async (req, res) => {
    const body = req.body as ILogin;
    const response = await this.user.Login(body);
    res.status(response.status || StatusCodes.OK).json(response);
  };

  CreateUser: RequestHandler = async (req, res) => {
    const body = req.body as ICreateUser;
    const response = await this.user.CreateUser(body);
    res.status(response.status || StatusCodes.CREATED).json(response);
  };

  VerifyOtp: RequestHandler = async (req, res) => {
    const body = req.body as IVerifyOtp;
    const response = await this.user.VerifyOtp(body);
    res.status(response.status || StatusCodes.OK).json(response);
  };

  ResendOtp: RequestHandler = async (req, res) => {
    const {email} = req.body;
    const response = await this.user.ResendOtp(email);
    res.status(response.status || StatusCodes.OK).json(response)
  }

  GetUser: RequestHandler = async (req: CustomRequest, res) => {
    const userId = req.user?.id; // Access user ID from request object
    const response = await this.user.GetUser(userId);
    res.status(response.status || StatusCodes.OK).json(response);
  };

  GetAllUsers: RequestHandler = async (req, res) => {
    const response = await this.user.GetAllUsers();
    res.status(response.status || StatusCodes.OK).json(response);
  };

  UpdateUser: RequestHandler = async (req: CustomRequest, res) => {
    const body = req.body as IUpateUser;
    const response = await this.user.UpdateUser(body);
    res.status(response.status || StatusCodes.OK).json(response);
  };

  DeleteUser: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const response = await this.user.DeleteUser(id);
    res.status(response.status || StatusCodes.OK).json(response);
  };

  sendPasswordResetMail: RequestHandler = async (req, res) => {
    const { email } = req.body;
    const response = await this.user.SendPasswordResetMail(email);
    res.status(response.status || StatusCodes.OK).json(response);
  };

  resetPassword: RequestHandler = async (req, res) => {
    const body = req.body as IResetPassword;
    const response = await this.user.ResetPassword(body);
    res.status(response.status || StatusCodes.OK).json(response);
  };
}
