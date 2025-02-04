import { RequestHandler } from "express";
import { IUser, UserService } from "./../service/userService";
import { ICreateUser, ILogin, IUpateUser, IVerifyOtp, IResetPassword } from "../types";
import { CustomRequest } from "../middlewares/TokenVerification";

export class UserController {
  user: IUser = new UserService();

  constructor() {}

  Login: RequestHandler = async (req, res) => {
    const body = req.body as ILogin;
    console.log(body);
    const response = await this.user.Login(body);
    res.status(200).json(response);
  };

  CreateUser: RequestHandler = async (req, res) => {
    console.log(`Controller for creating user`, req.body)
    const body = req.body as ICreateUser;
    const response = await this.user.CreateUser(body);
    res.status(200).json(response);
  };

  VerifyOtp: RequestHandler = async (req, res) => {
    const body = req.body as IVerifyOtp;
    const response = await this.user.VerifyOtp(body);
    res.status(200).json(response);
  };

  GetUser: RequestHandler = async (req: CustomRequest, res) => {
    const userId = req.user?.id; // Access user ID from request object
    const response = await this.user.GetUser(userId);
    res.status(response.status).json(response);
  };

  GetAllUsers: RequestHandler = async (req, res) => {
    const response = await this.user.GetAllUsers();
    res.status(200).json(response);
  };

  UpdateUser: RequestHandler = async (req: CustomRequest, res) => {
    const body = req.body as IUpateUser;
    const response = await this.user.UpdateUser(body);
    res.status(200).json(response);
  };

  DeleteUser: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const response = await this.user.DeleteUser(id);
    res.status(200).json(response);
  };

  sendPasswordResetMail: RequestHandler = async (req, res) => {
    const { email } = req.body;
    const response = await this.user.SendPasswordResetMail(email);
    res.status(200).json(response);
  };

  resetPassword: RequestHandler = async (req, res) => {
    const body = req.body as IResetPassword;
    const response = await this.user.ResetPassword(body);
    res.status(200).json(response);
  };
}
