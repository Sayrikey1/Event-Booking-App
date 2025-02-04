import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from "../data-source";
import { ICreateUser, ILogin, IUpateUser, IVerifyOtp, VerifyOtpResponse, IResetPassword } from "../types";
import { User } from "../entity/User";
import { mailer } from '../config/Mailer';
import { Otp, OtpType } from "../entity/Otp";
import generateOtp from "../utils/otpGenerator";
import { MoreThan } from "typeorm";


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
  async Login(load: ILogin) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ email: load.email });
      if (!user) {
        return {
          status: 404,
          message: "User not found",
          id: "",
          token: "",
        };
      }
      const isPasswordValid = await bcrypt.compare(
        load.password,
        user.password
      );
      if (!isPasswordValid) {
        return {
          status: 401,
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
        status: 200,
        message: `Welcome ${user.username}`,
        id: user.id,
        token,
      };
    } catch (err: any) {
      return {
        status: 500,
        message: err.message,
      };
    }
  }

  async CreateUser(load: ICreateUser) {
    console.log(`CreatingUserLoad-backend`, load);
    let createdUser: User | null = null;
    try {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const hashedPassword = await bcrypt.hash(load.password, 10);
        const user = userRepository.create({
          ...load,
          password: hashedPassword,
        });

        createdUser = await userRepository.save(user);

        // Generate and save OTP
        const otpCode = generateOtp();
        const otpRepository = AppDataSource.getRepository(Otp);
        const otp = otpRepository.create({
          user: createdUser,
          otp_code: otpCode,
          expires_at: new Date(Date.now() + 15 * 60 * 1000), // OTP expires in 15 minutes
          otp_type: OtpType.UserVerification,
        });
        await otpRepository.save(otp);

        // Send OTP to user email
        mailer({
          mail: createdUser.email,
          subject: 'Your OTP Code',
          text: `Your OTP code is ${otpCode}. It will expire in 15 minutes.`,
        });

        return { status: 201, message: "User created successfully" };
      } catch (e: any) {
        if (createdUser) {
          await this.DeleteUser(createdUser.id);
        }
        console.log(e.message)
        return { status: 400, message: e.message };
      }
    } catch (err: any) {
      return {
        status: 500,
        message: err.message,
      };
    }
  }

  async VerifyOtp(load: IVerifyOtp): Promise<VerifyOtpResponse> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const otpRepository = AppDataSource.getRepository(Otp);

      const user = await userRepository.findOneBy({ email: load.email });
      if (!user) {
        return { status: 404, message: 'User not found' };
      }

      if (user.is_verified) {
        return { status: 400, message: 'User is already verified' };
      }
      console.log(load.email, load.otp)
      const otpRecord = await otpRepository.findOne({
        where: { user: { email: load.email }, otp_code: load.otp, otp_type: OtpType.UserVerification },
      });

      if (!otpRecord) {
        return { status: 400, message: 'Invalid OTP' };
      }

      if (otpRecord.expires_at < new Date()) {
        return { status: 400, message: 'OTP has expired' };
      }

      otpRecord.is_used = true;
      await otpRepository.save(otpRecord);

      user.is_verified = true;
      await userRepository.save(user);

      // Send verification email
      await mailer({
        mail: user.email,
        subject: 'Account Verified',
        text: 'Your account has been successfully verified.',
      });

      return { status: 200, message: 'OTP verified successfully' };
    } catch (err: any) {
      return { status: 500, message: err.message };
    }
  }

  async GetUser(id: string) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: (id) },
      });
      if (!user) {
        return { status: 404, message: "User not found" };
      }
      return { status: 200, message: user };
    } catch (err: any) {
      return {
        status: 500,
        message: err.message,
      };
    }
  }

  async GetAllUsers() {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find();
      return { status: 200, message: users };
    } catch (err: any) {
      return {
        status: 500,
        message: err.message,
      };
    }
  }

  async UpdateUser(user: IUpateUser) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const foundUser = await userRepository.findOne({
        where: { id: user.id },
      });
      if (!foundUser) {
        return { status: 404, message: "User not found" };
      }
  
      // Update fields dynamically
      Object.keys(user).forEach((key) => {
        const typedKey = key as keyof IUpateUser;
        if (typedKey !== 'id' && user[typedKey] !== undefined && user[typedKey] !== null && user[typedKey] !== '') {
          (foundUser as any)[typedKey] = user[typedKey];
        }
      });
  
      await userRepository.save(foundUser);
      return { status: 200, message: "User updated successfully" };
    } catch (err: any) {
      return {
        status: 500,
        message: err.message,
      };
    }
  }

  async DeleteUser(id: string) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: (id) },
      });
      if (!user) {
        return { status: 404, message: "User not found" };
      }
      await userRepository.delete(id);
      return { status: 200, message: "User deleted successfully" };
    } catch (err: any) {
      return {
        staus: 500,
        message: err.message,
      };
    }
  }

  async SendPasswordResetMail(email: string) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ email });
      if (!user) {
        return { status: 404, message: "User not found" };
      }

      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour

      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await userRepository.save(user);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await mailer({
        mail: user.email,
        subject: 'Password Reset',
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
      });

      return { status: 200, message: "Password reset email sent successfully" };
    } catch (err: any) {
      return { status: 500, message: err.message };
    }
  }

  async ResetPassword(load: IResetPassword) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { resetToken: load.token, resetTokenExpiry: MoreThan(new Date()) },
      });
  
      if (!user) {
        return { status: 400, message: "Invalid or expired token" };
      }
  
      // Check if the new password is the same as the existing password
      const isSamePassword = await bcrypt.compare(load.password, user.password);
      if (isSamePassword) {
        return { status: 400, message: "New password cannot be the same as the existing password" };
      }
  
      const hashedPassword = await bcrypt.hash(load.password, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await userRepository.save(user);
  
      // Send email notification
      await mailer({
        mail: user.email,
        subject: 'Password Updated Successfully',
        text: 'Your password has been updated successfully.',
      });
  
      return { status: 200, message: "Password reset successfully" };
    } catch (err: any) {
      return { status: 500, message: err.message };
    }
  }
}