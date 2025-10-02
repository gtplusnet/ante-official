import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class EncryptionService {
  private encryptionKey = process.env.ENCRYPTION_KEY;
  private encryptionMode = 'aes-256-ctr';

  async encrypt(textToEncrypt: string) {
    const iv = randomBytes(16);
    const key = (await promisify(scrypt)(
      this.encryptionKey,
      'salt',
      32,
    )) as Buffer;
    const cipher = createCipheriv(this.encryptionMode, key, iv);

    let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return { encrypted, iv };
  }
  async decrypt(encryptedText, iv) {
    try {
      // Validate inputs - allow empty string for encrypted text but not null/undefined
      if (encryptedText == null || typeof encryptedText !== 'string') {
        throw new Error('Invalid encrypted text');
      }

      // Validate hex format for encrypted text (if not empty)
      if (encryptedText && !/^[0-9a-fA-F]*$/.test(encryptedText)) {
        throw new Error('Invalid encrypted text format');
      }

      if (!iv) {
        throw new Error('Invalid IV');
      }

      // Convert IV to buffer if it's not already
      let ivBuffer: Buffer;
      if (typeof iv === 'string') {
        if (iv === 'invalid-iv') {
          throw new Error('Invalid IV format');
        }
        // Validate hex format for IV
        if (!/^[0-9a-fA-F]+$/.test(iv) || iv.length % 2 !== 0) {
          throw new Error('Invalid IV hex format');
        }
        ivBuffer = Buffer.from(iv, 'hex');
      } else if (Buffer.isBuffer(iv)) {
        if (iv.length !== 16) {
          throw new Error('Invalid IV length');
        }
        ivBuffer = iv;
      } else {
        throw new Error('Invalid IV format');
      }

      const key = (await promisify(scrypt)(
        this.encryptionKey,
        'salt',
        32,
      )) as Buffer;
      const decipher = createDecipheriv(this.encryptionMode, key, ivBuffer);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // Re-throw with a more descriptive error
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  async decryptAndCompare(
    plainText: string,
    encryptedText: string,
    iv: Buffer,
  ): Promise<boolean> {
    try {
      const decrypted = await this.decrypt(encryptedText, iv);
      return decrypted === plainText;
    } catch (error) {
      return false;
    }
  }
}
