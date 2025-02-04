import { RequestHandler } from "express";
import * as crypto from 'crypto';
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

// Encryption and decryption controllers
export class EncryptionController {
  Encrypt: RequestHandler = async (req, res) => {
    const { data } = req.body;
    const encryptedData = encryptObject(data);
    res.status(200).json({ encryptedData });
  };

  Decrypt: RequestHandler = async (req, res) => {
    const { encryptedData } = req.body;
    const decryptedData = decryptObject(encryptedData);
    res.status(200).json({ decryptedData });
  };
}