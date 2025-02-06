import jwt from "jsonwebtoken";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

export interface CustomRequest extends Request {
  user?: any;
}

const TokenVerification = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Token expired or invalid 002" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string);
    req.user = decoded; // Assign the decoded token to req.user
    console.log(req.user);
    next();
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Token expired or invalid" });
  }
};

export default TokenVerification as RequestHandler;

export const GetCurrentUser = async (authHeader: string) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { message: "User Not Found" };
  }
  const token = authHeader.split(" ")[1];

  try {
    // Explicitly type the callback parameters for jwt.verify
    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        process.env.SECRET_KEY as string,
        (err: Error | null, decoded: any) => {
          if (err) reject(err);
          else resolve(decoded);
        }
      );
    });

    // Example values; adjust as needed.
    const { isActive, role } = { isActive: true, role: "Admin" };
    return {
      role: role,
      isActive: isActive,
      message: "Token verified successfully",
      userStatus: true,
      error: "",
    };
  } catch (err: any) {
    return {
      role: "",
      message: "Token expired or invalid",
      userStatus: false,
      error: err.error,
    };
  }
};
