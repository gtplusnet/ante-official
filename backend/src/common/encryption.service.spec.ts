import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { randomBytes } from 'crypto';

describe('EncryptionService', () => {
  let service: EncryptionService;

  // Mock environment variable
  const mockEncryptionKey = 'test-encryption-key-for-testing';

  beforeEach(async () => {
    // Set up environment variable for testing
    process.env.ENCRYPTION_KEY = mockEncryptionKey;

    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    it('should encrypt text and return encrypted data with iv', async () => {
      const testText = 'Hello, World!';

      const result = await service.encrypt(testText);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encrypted).toBe('string');
      expect(result.iv).toBeInstanceOf(Buffer);
      expect(result.encrypted).not.toBe(testText);
    });

    it('should produce different encrypted results for same text (due to random IV)', async () => {
      const testText = 'Same text';

      const result1 = await service.encrypt(testText);
      const result2 = await service.encrypt(testText);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toEqual(result2.iv);
    });

    it('should handle empty string encryption', async () => {
      const testText = '';

      const result = await service.encrypt(testText);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encrypted).toBe('string');
    });

    it('should handle special characters and unicode', async () => {
      const testText = '🔐 Special chars: !@#$%^&*()_+{}[]|\\:";\'<>?,./ 中文';

      const result = await service.encrypt(testText);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result.encrypted).not.toBe(testText);
    });

    it('should handle long text encryption', async () => {
      const testText = 'A'.repeat(10000);

      const result = await service.encrypt(testText);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result.encrypted).not.toBe(testText);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text back to original', async () => {
      const testText = 'Hello, World!';

      const encrypted = await service.encrypt(testText);
      const decrypted = await service.decrypt(
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(decrypted).toBe(testText);
    });

    it('should handle empty string decryption', async () => {
      const testText = '';

      const encrypted = await service.encrypt(testText);
      const decrypted = await service.decrypt(
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(decrypted).toBe(testText);
    });

    it('should handle special characters and unicode decryption', async () => {
      const testText = '🔐 Special chars: !@#$%^&*()_+{}[]|\\:";\'<>?,./ 中文';

      const encrypted = await service.encrypt(testText);
      const decrypted = await service.decrypt(
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(decrypted).toBe(testText);
    });

    it('should handle long text decryption', async () => {
      const testText = 'A'.repeat(10000);

      const encrypted = await service.encrypt(testText);
      const decrypted = await service.decrypt(
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(decrypted).toBe(testText);
    });

    it('should throw error for invalid encrypted text', async () => {
      const invalidEncrypted = 'invalid-encrypted-text';
      const validIv = randomBytes(16);

      await expect(
        service.decrypt(invalidEncrypted, validIv),
      ).rejects.toThrow();
    });

    it('should throw error for invalid IV', async () => {
      const testText = 'Hello, World!';
      const encrypted = await service.encrypt(testText);
      const invalidIv = 'invalid-iv';

      await expect(
        service.decrypt(encrypted.encrypted, invalidIv),
      ).rejects.toThrow();
    });

    it('should produce different result with wrong IV', async () => {
      const testText = 'Hello, World!';
      const encrypted = await service.encrypt(testText);
      const wrongIv = randomBytes(16); // Different IV

      const decrypted = await service.decrypt(encrypted.encrypted, wrongIv);
      expect(decrypted).not.toBe(testText);
    });
  });

  describe('decryptAndCompare', () => {
    it('should return true for matching plain text', async () => {
      const testText = 'Hello, World!';

      const encrypted = await service.encrypt(testText);
      const result = await service.decryptAndCompare(
        testText,
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(result).toBe(true);
    });

    it('should return false for non-matching plain text', async () => {
      const testText = 'Hello, World!';
      const differentText = 'Goodbye, World!';

      const encrypted = await service.encrypt(testText);
      const result = await service.decryptAndCompare(
        differentText,
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(result).toBe(false);
    });

    it('should return false for invalid encrypted text', async () => {
      const testText = 'Hello, World!';
      const invalidEncrypted = 'invalid-encrypted-text';
      const validIv = randomBytes(16);

      const result = await service.decryptAndCompare(
        testText,
        invalidEncrypted,
        validIv,
      );

      expect(result).toBe(false);
    });

    it('should return false for invalid IV', async () => {
      const testText = 'Hello, World!';
      const encrypted = await service.encrypt(testText);
      const invalidIv = 'invalid-iv' as any;

      const result = await service.decryptAndCompare(
        testText,
        encrypted.encrypted,
        invalidIv,
      );

      expect(result).toBe(false);
    });

    it('should handle empty strings correctly', async () => {
      const testText = '';

      const encrypted = await service.encrypt(testText);
      const result = await service.decryptAndCompare(
        testText,
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(result).toBe(true);
    });

    it('should handle special characters correctly', async () => {
      const testText = '🔐 Special chars: !@#$%^&*()_+{}[]|\\:";\'<>?,./ 中文';

      const encrypted = await service.encrypt(testText);
      const result = await service.decryptAndCompare(
        testText,
        encrypted.encrypted,
        encrypted.iv,
      );

      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined encryption key gracefully', async () => {
      delete process.env.ENCRYPTION_KEY;

      const newService = new EncryptionService();
      const testText = 'Hello, World!';

      // Should still work but with undefined key (crypto will handle it)
      await expect(newService.encrypt(testText)).rejects.toThrow();
    });

    it('should consistently encrypt and decrypt multiple times', async () => {
      const testText = 'Consistency test';

      for (let i = 0; i < 10; i++) {
        const encrypted = await service.encrypt(testText);
        const decrypted = await service.decrypt(
          encrypted.encrypted,
          encrypted.iv,
        );
        expect(decrypted).toBe(testText);
      }
    });

    it('should handle null values gracefully', async () => {
      await expect(service.encrypt(null as any)).rejects.toThrow();
    });

    it('should handle undefined values gracefully', async () => {
      await expect(service.encrypt(undefined as any)).rejects.toThrow();
    });
  });

  describe('security considerations', () => {
    it('should use different IVs for each encryption', async () => {
      const testText = 'Security test';
      const ivs = new Set();

      // Generate 100 encryptions and check IV uniqueness
      for (let i = 0; i < 100; i++) {
        const encrypted = await service.encrypt(testText);
        const ivHex = encrypted.iv.toString('hex');
        expect(ivs.has(ivHex)).toBe(false);
        ivs.add(ivHex);
      }
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const testText = 'Same plaintext';
      const ciphertexts = new Set();

      // Generate 100 encryptions and check ciphertext uniqueness
      for (let i = 0; i < 100; i++) {
        const encrypted = await service.encrypt(testText);
        expect(ciphertexts.has(encrypted.encrypted)).toBe(false);
        ciphertexts.add(encrypted.encrypted);
      }
    });

    it('should use the correct IV length (16 bytes)', async () => {
      const testText = 'IV length test';

      const encrypted = await service.encrypt(testText);

      expect(encrypted.iv.length).toBe(16);
    });
  });
});
