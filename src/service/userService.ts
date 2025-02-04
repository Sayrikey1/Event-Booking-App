import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../data-source";
import {
  ICreateUser,
  ILogin,
  IUpateUser,
  IVerifyOtp,
  VerifyOtpResponse,
  IResetPassword,
} from "../types";
import { User } from "../entity/User";
import { mailer } from "../config/Mailer";
import { Otp, OtpType } from "../entity/Otp";
import generateOtp from "../utils/otpGenerator";
import { MoreThan } from "typeorm";
import { StatusCodes } from "http-status-codes"; // Using the status-code package
import { handleError, updateEntity } from "../utils/serviceUtils";
import logger from "../config/logger";  // Import the logger

dotenv.config();

export interface IUser {
  Login: (load: ILogin) => Promise<any>;
  CreateUser: (load: ICreateUser) => Promise<any>;
  VerifyOtp: (load: IVerifyOtp) => Promise<VerifyOtpResponse>;
  GetUser: (id: string) => Promise<any>;
  GetAllUsers: () => Promise<any>;
  UpdateUser: (user: IUpateUser) => Promise<any>;
  DeleteUser: (id: string) => Promise<any>;
  SendPasswordResetMail: (email: string) => Promise<any>;
  ResetPassword: (load: IResetPassword) => Promise<any>;
}

export class UserService implements IUser {
  // ----------------------
  // Helper Methods
  // ----------------------
  private getUserRepo() {
    return AppDataSource.getRepository(User);
  }

  private getOtpRepo() {
    return AppDataSource.getRepository(Otp);
  }

  // ----------------------
  // Service Methods
  // ----------------------

  async Login(load: ILogin) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOneBy({ email: load.email });
      if (!user) {
        logger.warn(`Login failed: User with email ${load.email} not found`);
        return {
          status: StatusCodes.NOT_FOUND,
          message: "User not found",
          id: "",
          token: "",
        };
      }

      const isPasswordValid = await bcrypt.compare(load.password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Login failed: Invalid password for email ${load.email}`);
        return {
          status: StatusCodes.UNAUTHORIZED,
          message: "Invalid password",
          id: "",
          token: "",
        };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, user_type: user.user_type },
        process.env.SECRET_KEY!,
        { expiresIn: "1h" }
      );
      logger.info(`User ${user.email} logged in successfully`);
      return {
        status: StatusCodes.OK,
        message: `Welcome ${user.username}`,
        id: user.id,
        token,
      };
    } catch (err: any) {
      logger.error(`Login error for email ${load.email}: ${err.message}`);
      return handleError(err);
    }
  }

  async CreateUser(load: ICreateUser) {
    let createdUser: User | null = null;
    try {
      const userRepository = this.getUserRepo();
      const hashedPassword = await bcrypt.hash(load.password, 10);
      const user = userRepository.create({
        ...load,
        password: hashedPassword,
      });

      createdUser = await userRepository.save(user);
      logger.info(`User created: ${createdUser.email}`);

      // Generate and save OTP
      const otpCode = generateOtp();
      const otpRepository = this.getOtpRepo();
      const otp = otpRepository.create({
        user: createdUser,
        otp_code: otpCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // OTP expires in 15 minutes
        otp_type: OtpType.UserVerification,
      });
      await otpRepository.save(otp);
      logger.info(`OTP generated and saved for user: ${createdUser.email}`);

      // Send OTP to user email
      await mailer({
        mail: createdUser.email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otpCode}. It will expire in 15 minutes.`,
      });
      logger.info(`OTP email sent to ${createdUser.email}`);

      return { status: StatusCodes.CREATED, message: "User created successfully" };
    } catch (err: any) {
      logger.error(`Error creating user: ${err.message}`);
      if (createdUser) {
        await this.DeleteUser(createdUser.id);
      }
      return handleError(err);
    }
  }

  async VerifyOtp(load: IVerifyOtp): Promise<VerifyOtpResponse> {
    try {
      const userRepository = this.getUserRepo();
      const otpRepository = this.getOtpRepo();

      const user = await userRepository.findOneBy({ email: load.email });
      if (!user) {
        logger.warn(`Verify OTP failed: User with email ${load.email} not found`);
        return { status: StatusCodes.NOT_FOUND, message: "User not found" };
      }

      if (user.is_verified) {
        logger.warn(`Verify OTP: User ${load.email} is already verified`);
        return { status: StatusCodes.BAD_REQUEST, message: "User is already verified" };
      }

      const otpRecord = await otpRepository.findOne({
        where: {
          user: { email: load.email },
          otp_code: load.otp,
          otp_type: OtpType.UserVerification,
        },
      });

      if (!otpRecord) {
        logger.warn(`Invalid OTP provided for user ${load.email}`);
        return { status: StatusCodes.BAD_REQUEST, message: "Invalid OTP" };
      }

      if (otpRecord.expires_at < new Date()) {
        logger.warn(`OTP expired for user ${load.email}`);
        return { status: StatusCodes.BAD_REQUEST, message: "OTP has expired" };
      }

      otpRecord.is_used = true;
      await otpRepository.save(otpRecord);
      user.is_verified = true;
      await userRepository.save(user);
      logger.info(`User ${load.email} verified successfully`);

      // Send verification email
      await mailer({
        mail: user.email,
        subject: "Account Verified",
        text: "Your account has been successfully verified.",
      });
      logger.info(`Verification email sent to ${user.email}`);

      return { status: StatusCodes.OK, message: "OTP verified successfully" };
    } catch (err: any) {
      logger.error(`Error verifying OTP for ${load.email}: ${err.message}`);
      return handleError(err);
    }
  }

  async GetUser(id: string) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        logger.warn(`GetUser: User with id ${id} not found`);
        return { status: StatusCodes.NOT_FOUND, message: "User not found" };
      }
      logger.info(`User with id ${id} retrieved successfully`);
      return { status: StatusCodes.OK, message: user };
    } catch (err: any) {
      logger.error(`Error retrieving user with id ${id}: ${err.message}`);
      return handleError(err);
    }
  }

  async GetAllUsers() {
    try {
      const userRepository = this.getUserRepo();
      const users = await userRepository.find();
      logger.info("All users retrieved successfully");
      return { status: StatusCodes.OK, message: users };
    } catch (err: any) {
      logger.error(`Error retrieving all users: ${err.message}`);
      return handleError(err);
    }
  }

  async UpdateUser(user: IUpateUser) {
    try {
      const userRepository = this.getUserRepo();
      const foundUser = await userRepository.findOne({ where: { id: user.id } });
      if (!foundUser) {
        logger.warn(`UpdateUser: User with id ${user.id} not found`);
        return { status: StatusCodes.NOT_FOUND, message: "User not found" };
      }

      // Update only the provided fields
      updateEntity(foundUser, user);
      await userRepository.save(foundUser);
      logger.info(`User with id ${user.id} updated successfully`);
      return { status: StatusCodes.OK, message: "User updated successfully" };
    } catch (err: any) {
      logger.error(`Error updating user with id ${user.id}: ${err.message}`);
      return handleError(err);
    }
  }

  async DeleteUser(id: string) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        logger.warn(`DeleteUser: User with id ${id} not found`);
        return { status: StatusCodes.NOT_FOUND, message: "User not found" };
      }
      await userRepository.delete(id);
      logger.info(`User with id ${id} deleted successfully`);
      return { status: StatusCodes.OK, message: "User deleted successfully" };
    } catch (err: any) {
      logger.error(`Error deleting user with id ${id}: ${err.message}`);
      return handleError(err);
    }
  }

  async SendPasswordResetMail(email: string) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOneBy({ email });
      if (!user) {
        logger.warn(`SendPasswordResetMail: User with email ${email} not found`);
        return { status: StatusCodes.NOT_FOUND, message: "User not found" };
      }

      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour

      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await userRepository.save(user);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await mailer({
        mail: user.email,
        subject: "Password Reset",
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
      });
      logger.info(`Password reset email sent to ${user.email}`);

      return { status: StatusCodes.OK, message: "Password reset email sent successfully" };
    } catch (err: any) {
      logger.error(`Error sending password reset email to ${email}: ${err.message}`);
      return handleError(err);
    }
  }

  async ResetPassword(load: IResetPassword) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOne({
        where: { resetToken: load.token, resetTokenExpiry: MoreThan(new Date()) },
      });

      if (!user) {
        logger.warn(`ResetPassword: Invalid or expired token ${load.token}`);
        return { status: StatusCodes.BAD_REQUEST, message: "Invalid or expired token" };
      }

      const isSamePassword = await bcrypt.compare(load.password, user.password);
      if (isSamePassword) {
        logger.warn(`ResetPassword: New password cannot be the same as the existing password for user ${user.email}`);
        return {
          status: StatusCodes.BAD_REQUEST,
          message: "New password cannot be the same as the existing password",
        };
      }

      const hashedPassword = await bcrypt.hash(load.password, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await userRepository.save(user);

      // Send email notification
      await mailer({
        mail: user.email,
        subject: "Password Updated Successfully",
        text: "Your password has been updated successfully.",
      });
      logger.info(`Password reset successfully for user ${user.email}`);

      return { status: StatusCodes.OK, message: "Password reset successfully" };
    } catch (err: any) {
      logger.error(`Error resetting password: ${err.message}`);
      return handleError(err);
    }
  }
}
