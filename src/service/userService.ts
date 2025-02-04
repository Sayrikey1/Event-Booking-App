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
import { StatusCodes } from "http-status-codes"; // Importing the status code package
import { handleError, updateEntity } from "../utils/serviceUtils";

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
        return {
          status: StatusCodes.NOT_FOUND, // Using status-code package
          message: "User not found",
          id: "",
          token: "",
        };
      }

      const isPasswordValid = await bcrypt.compare(load.password, user.password);
      if (!isPasswordValid) {
        return {
          status: StatusCodes.UNAUTHORIZED, // Using status-code package
          message: "Invalid password",
          id: "",
          token: "",
        };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, user_type: user.user_type },
        process.env.SECRET_KEY!,
        {
          expiresIn: "1h",
        }
      );
      return {
        status: StatusCodes.OK, // Using status-code package
        message: `Welcome ${user.username}`,
        id: user.id,
        token,
      };
    } catch (err: any) {
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

      // Send OTP to user email
      await mailer({
        mail: createdUser.email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otpCode}. It will expire in 15 minutes.`,
      });

      return { status: StatusCodes.CREATED, message: "User created successfully" };
    } catch (err: any) {
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
        return { status: StatusCodes.NOT_FOUND, message: "User not found" }; // Using status-code package
      }

      if (user.is_verified) {
        return { status: StatusCodes.BAD_REQUEST, message: "User is already verified" }; // Using status-code package
      }

      const otpRecord = await otpRepository.findOne({
        where: {
          user: { email: load.email },
          otp_code: load.otp,
          otp_type: OtpType.UserVerification,
        },
      });

      if (!otpRecord) {
        return { status: StatusCodes.BAD_REQUEST, message: "Invalid OTP" }; // Using status-code package
      }

      if (otpRecord.expires_at < new Date()) {
        return { status: StatusCodes.BAD_REQUEST, message: "OTP has expired" }; // Using status-code package
      }

      otpRecord.is_used = true;
      await otpRepository.save(otpRecord);

      user.is_verified = true;
      await userRepository.save(user);

      // Send verification email
      await mailer({
        mail: user.email,
        subject: "Account Verified",
        text: "Your account has been successfully verified.",
      });

      return { status: StatusCodes.OK, message: "OTP verified successfully" }; // Using status-code package
    } catch (err: any) {
      return handleError(err);
    }
  }

  async GetUser(id: string) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return { status: StatusCodes.NOT_FOUND, message: "User not found" }; // Using status-code package
      }
      return { status: StatusCodes.OK, message: user }; // Using status-code package
    } catch (err: any) {
      return handleError(err);
    }
  }

  async GetAllUsers() {
    try {
      const userRepository = this.getUserRepo();
      const users = await userRepository.find();
      return { status: StatusCodes.OK, message: users }; // Using status-code package
    } catch (err: any) {
      return handleError(err);
    }
  }

  async UpdateUser(user: IUpateUser) {
    try {
      const userRepository = this.getUserRepo();
      const foundUser = await userRepository.findOne({ where: { id: user.id } });
      if (!foundUser) {
        return { status: StatusCodes.NOT_FOUND, message: "User not found" }; // Using status-code package
      }

      // Update only the provided fields
      updateEntity(foundUser, user);

      await userRepository.save(foundUser);
      return { status: StatusCodes.OK, message: "User updated successfully" }; // Using status-code package
    } catch (err: any) {
      return handleError(err);
    }
  }

  async DeleteUser(id: string) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return { status: StatusCodes.NOT_FOUND, message: "User not found" }; // Using status-code package
      }
      await userRepository.delete(id);
      return { status: StatusCodes.OK, message: "User deleted successfully" }; // Using status-code package
    } catch (err: any) {
      return handleError(err);
    }
  }

  async SendPasswordResetMail(email: string) {
    try {
      const userRepository = this.getUserRepo();
      const user = await userRepository.findOneBy({ email });
      if (!user) {
        return { status: StatusCodes.NOT_FOUND, message: "User not found" }; // Using status-code package
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

      return { status: StatusCodes.OK, message: "Password reset email sent successfully" }; // Using status-code package
    } catch (err: any) {
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
        return { status: StatusCodes.BAD_REQUEST, message: "Invalid or expired token" }; // Using status-code package
      }

      const isSamePassword = await bcrypt.compare(load.password, user.password);
      if (isSamePassword) {
        return {
          status: StatusCodes.BAD_REQUEST,
          message: "New password cannot be the same as the existing password", // Using status-code package
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

      return { status: StatusCodes.OK, message: "Password reset successfully" }; // Using status-code package
    } catch (err: any) {
      return handleError(err);
    }
  }
}
