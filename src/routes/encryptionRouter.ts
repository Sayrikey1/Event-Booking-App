import express from 'express';
import { EncryptionController } from '../controller/encryptionController';

const encryptionRouter = express.Router();
const encryptionController = new EncryptionController();

/**
 * @openapi
 * '/api/encrypt':
 *  post:
 *     tags:
 *     - Encryption
 *     summary: Encrypt a given object
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              data:
 *                type: object
 *     responses:
 *      200:
 *        description: Object encrypted successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                encryptedData:
 *                  type: object
 */
encryptionRouter.post("/api/encrypt", encryptionController.Encrypt);

/**
 * @openapi
 * '/api/decrypt':
 *  post:
 *     tags:
 *     - Encryption
 *     summary: Decrypt a given object
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              encryptedData:
 *                type: object
 *     responses:
 *      200:
 *        description: Object decrypted successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                decryptedData:
 *                  type: object
 */
encryptionRouter.post("/api/decrypt", encryptionController.Decrypt);

export default encryptionRouter;