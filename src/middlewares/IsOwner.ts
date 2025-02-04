import { Request, Response, NextFunction, RequestHandler } from 'express';
import { CustomRequest } from './TokenVerification';

const IsOwner = async (req: CustomRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const authenticatedUserId = req.user?.id;
    const userIdInParams = req.params.id;
    const userIdInBody = req.body?.id;

    if (!authenticatedUserId) {
      return res.status(400).json({ message: "Authenticated user ID is missing in the request" });
    }

    if (userIdInParams) {
      if (authenticatedUserId !== userIdInParams) {
        return res.status(403).json({ message: "Authenticated user does not match the user ID in the parameters" });
      }
    } else if (userIdInBody) {
      if (authenticatedUserId !== userIdInBody) {
        return res.status(403).json({ message: "Authenticated user does not match the user ID in the body" });
      }
    } else {
      return res.status(400).json({ message: "User ID is missing in the request" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export default IsOwner as RequestHandler;