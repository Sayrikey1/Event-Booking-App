import express from 'express';
import { UserController } from '../controller/userController';
import TokenVerification from '../middlewares/TokenVerification';
import IsOwner from '../middlewares/IsOwner';

const userRouter = express.Router();
const userController = new UserController();

/**
 * @openapi
 * '/api/login':
 *  post:
 *     tags:
 *     - User
 *     summary: Login to get access token
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              password:
 *                type: string
 *     responses:
 *      200:
 *        description: Login successful
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 *      404:
 *        description: Not Found
 */
userRouter.post("/api/login", userController.Login);

/**
 * @openapi
 * /api/create:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               user_type:
 *                 type: string
 *                 enum: [Basic, Admin]
 *             required:
 *               - first_name
 *               - last_name
 *               - username
 *               - email
 *               - password
 *               - user_type
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
userRouter.post("/api/create", userController.CreateUser);

/**
 * @openapi
 * '/api/verify-otp':
 *  post:
 *     tags:
 *     - User
 *     summary: Verify OTP
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              otp:
 *                type: string
 *     responses:
 *      200:
 *        description: OTP verified successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 */
userRouter.post("/api/verify-otp", userController.VerifyOtp);

/**
 * @openapi
 * '/api/resend-otp':
 *   post:
 *     tags:
 *       - User
 *     summary: Resend OTP code for user verification.
 *     description: |
 *       Deletes any existing unused OTP for the user and generates a new OTP for account verification.
 *       The new OTP is then sent to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user for whom the OTP will be resent.
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: OTP resent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: OTP resent successfully
 *       400:
 *         description: User already verified or a bad request.
 *       404:
 *         description: User not found.
 */
userRouter.post("/api/resend-otp", userController.ResendOtp);

/**
 * @openapi
 * '/api/user':
 *  get:
 *     tags:
 *     - User
 *     summary: Get the current authorized user
 *     responses:
 *      200:
 *        description: User fetched successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 *                user:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      format: uuid
 *                    email:
 *                      type: string
 *                    user_type:
 *                      type: string
 *      401:
 *        description: Unauthorized
 *      404:
 *        description: User not found
 */
userRouter.get("/api/user", TokenVerification, userController.GetUser);

/**
 * @openapi
 * '/api/users':
 *  get:
 *     tags:
 *     - User
 *     summary: Get all users
 *     responses:
 *      200:
 *        description: List of users
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 */
userRouter.get("/api/users", userController.GetAllUsers);

/**
 * @openapi
 * '/api/update':
 *  patch:
 *     tags:
 *     - User
 *     summary: Update user information
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                format: uuid
 *              username:
 *                type: string
 *              address:
 *                type: string
 *            required:
 *              - id
 *     responses:
 *      200:
 *        description: User updated successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 *      400:
 *        description: Bad request
 *      403:
 *        description: Forbidden
 *      404:
 *        description: User not found
 */
userRouter.patch("/api/update", TokenVerification, IsOwner, userController.UpdateUser);

/**
 * @openapi
 * '/api/delete/{id}':
 *  delete:
 *     tags:
 *     - User
 *     summary: Delete a user by ID
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *          format: uuid
 *     responses:
 *      200:
 *        description: User deleted successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 *      404:
 *        description: User not found
 */
userRouter.delete("/api/delete/:id", TokenVerification, IsOwner, userController.DeleteUser);

/**
 * @openapi
 * '/api/forget-password':
 *  post:
 *     tags:
 *     - User
 *     summary: Send password reset mail
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *     responses:
 *      200:
 *        description: Password reset mail sent successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 */
userRouter.post("/api/forget-password", userController.sendPasswordResetMail);

/**
 * @openapi
 * '/api/reset-password':
 *  post:
 *     tags:
 *     - User
 *     summary: Reset password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              password:
 *                type: string
 *              token:
 *                type: string
 *                format: uuid
 *     responses:
 *      200:
 *        description: Password reset successful
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: number
 *                message:
 *                  type: string
 *      400:
 *        description: Invalid or expired token
 */
userRouter.post("/api/reset-password", userController.resetPassword);

export default userRouter;
