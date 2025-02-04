import { CustomRequest } from '../middlewares/TokenVerification';
import { User } from '../entity/User';

export const getAuthenticatedUser = (req: CustomRequest): User | null => {
  return req.user || null;
};
