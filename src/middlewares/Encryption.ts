import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV as string, 'hex');

function encrypt(text: string): string {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

function encryptObject(obj: any): any {
    if (typeof obj === 'string') {
        return encrypt(obj);
    } else if (typeof obj === 'object' && obj !== null) {
        const encryptedObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const encryptedKey = encrypt(key);
                encryptedObj[encryptedKey] = encryptObject(obj[key]);
            }
        }
        return encryptedObj;
    }
    return obj;
}

function decryptObject(obj: any): any {
    if (typeof obj === 'string') {
        return decrypt(obj);
    } else if (typeof obj === 'object' && obj !== null) {
        const decryptedObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const decryptedKey = decrypt(key);
                decryptedObj[decryptedKey] = decryptObject(obj[key]);
            }
        }
        return decryptedObj;
    }
    return obj;
}

export const encryptionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.ENCRYPTION === 'TRUE') {
        // Decrypt request body
        if (req.body) {
            try {
                if (typeof req.body === 'string') {
                    req.body = decryptObject(JSON.parse(req.body)); // Handle stringified JSON
                } else if (typeof req.body === 'object') {
                    req.body = decryptObject(req.body);
                }
            } catch (err) {
                console.error('Decryption failed:', err.message);
                res.status(400).send({ error: 'Invalid encrypted request body' });
            }
        }

        // Encrypt response body
        const originalSend = res.send;

        res.send = function (body: any) {
            try {
                // Ensure body is stringified before encryption
                let encryptedBody: any;
                if (typeof body === 'object') {
                    console.log('Encrypting JSON response:', body);
                    encryptedBody = encryptObject(body); // Encrypt JSON objects
                } else {
                    console.log('Encrypting non-object response:', body);
                    encryptedBody = encryptObject(JSON.parse(body)); // Wrap non-objects for encryption
                }

                res.setHeader('X-Encrypted', 'true');
                return originalSend.call(this, JSON.stringify(encryptedBody));
            } catch (err) {
                console.error('Response encryption failed:', err.message);
                return originalSend.call(this, body); // Fallback to original response
            }
        };
    }
    next();
};
