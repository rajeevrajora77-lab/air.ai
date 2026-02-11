import { authService } from '../services/auth.service';
import { db } from '../database/postgres';
import { AuthenticationError, ConflictError } from '../utils/errors';

describe('AuthService', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test@1234',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register(testUser);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(testUser.email.toLowerCase());
      expect(result.user.firstname).toBe(testUser.firstName);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw ConflictError for duplicate email', async () => {
      await authService.register(testUser);

      await expect(authService.register(testUser)).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const result = await authService.login(testUser.email, testUser.password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(testUser.email.toLowerCase());
    });

    it('should throw AuthenticationError for invalid password', async () => {
      await expect(
        authService.login(testUser.email, 'wrongpassword')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      await expect(
        authService.login('nonexistent@example.com', testUser.password)
      ).rejects.toThrow(AuthenticationError);
    });
  });
});