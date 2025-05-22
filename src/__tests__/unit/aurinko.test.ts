/**
 * @jest-environment node
 */

import axios from 'axios';
import * as aurinko from '@/lib/aurinko';
import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import { getSubscriptionStatus } from '@/lib/stripe-actions';

jest.mock('axios');
jest.mock('@/server/db');
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/stripe-actions');

describe('aurinko.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getAurinkoAuthorizationUrl', () => {
    it('should return authorization url when user is subscribed and under limit', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user1' });
      (db.user.findUnique as jest.Mock).mockResolvedValue({ role: 'user' });
      (getSubscriptionStatus as jest.Mock).mockResolvedValue(true);
      (db.account.count as jest.Mock).mockResolvedValue(1);

      const url = await aurinko.getAurinkoAuthorizationUrl('Google');
      expect(url).toContain('https://api.aurinko.io/v1/auth/authorize?');
      expect(url).toContain('serviceType=Google');
    });

    it('should throw error if no userId', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: null });
      await expect(aurinko.getAurinkoAuthorizationUrl('Google')).rejects.toThrow('User not found');
    });

    it('should throw error if user role exceeds account limits (free)', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user1' });
      (db.user.findUnique as jest.Mock).mockResolvedValue({ role: 'user' });
      (getSubscriptionStatus as jest.Mock).mockResolvedValue(false);
      (db.account.count as jest.Mock).mockResolvedValue(aurinko.FREE_ACCOUNTS_PER_USER);

      await expect(aurinko.getAurinkoAuthorizationUrl('Office365')).rejects.toThrow(
        'You have reached the maximum number of accounts for your subscription'
      );
    });
  });

  describe('getAurinkoToken', () => {
    it('should return token data on success', async () => {
      const mockData = {
        accountId: 123,
        accessToken: 'token',
        userId: 'user1',
        userSession: 'session1',
      };
      (axios.post as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await aurinko.getAurinkoToken('code123');
      expect(result).toEqual(mockData);
    });

    it('should log error on axios failure', async () => {
      const error = { response: { data: 'error' }, isAxiosError: true };
      (axios.post as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await aurinko.getAurinkoToken('code123');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getAccountDetails', () => {
    it('should return account details on success', async () => {
      const mockResponse = { email: 'test@example.com', name: 'Test User' };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await aurinko.getAccountDetails('token123');
      expect(result).toEqual(mockResponse);
    });

    it('should throw and log error on failure', async () => {
      const error = { response: { data: 'error' }, isAxiosError: true };
      (axios.get as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(aurinko.getAccountDetails('token123')).rejects.toEqual(error);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getEmailDetails', () => {
    it('should return email details on success', async () => {
      const mockEmail = { id: 'email1', subject: 'Hello' };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockEmail });

      const result = await aurinko.getEmailDetails('token123', 'email1');
      expect(result).toEqual(mockEmail);
    });

    it('should throw and log error on failure', async () => {
      const error = { response: { data: 'error' }, isAxiosError: true };
      (axios.get as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(aurinko.getEmailDetails('token123', 'email1')).rejects.toEqual(error);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
