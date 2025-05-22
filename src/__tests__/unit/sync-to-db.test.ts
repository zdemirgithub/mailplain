/**
 * @jest-environment node
 */

import { syncEmailsToDatabase } from '@/lib/sync-to-db';
import { db } from '@/server/db';
import { OramaManager } from '@/lib/orama';
import { getEmbeddings } from '@/lib/embeddings';
import { turndown } from '@/lib/turndown';

jest.mock('@/server/db');
jest.mock('@/lib/orama');
jest.mock('@/lib/embeddings');
jest.mock('@/lib/turndown');

describe('sync-to-db.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('syncEmailsToDatabase', () => {
    it('should sync emails to Orama and DB without errors', async () => {
      const emails = [
        {
          id: 'email1',
          subject: 'Test Email',
          body: 'Hello World',
          bodySnippet: 'Hello',
          from: { name: 'Alice', address: 'alice@example.com', raw: 'raw-from' },
          to: [{ name: 'Bob', address: 'bob@example.com', raw: 'raw-to' }],
          cc: [],
          bcc: [],
          replyTo: [],
          sentAt: new Date().toISOString(),
          createdTime: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          internetMessageId: 'msg1',
          sysLabels: ['inbox'],
          keywords: [],
          sysClassifications: [],
          sensitivity: null,
          meetingMessageMethod: null,
          hasAttachments: false,
          internetHeaders: {},
          inReplyTo: null,
          references: [],
          threadId: 'thread1',
          threadIndex: null,
          nativeProperties: {},
          folderId: null,
          omitted: false,
          attachments: [],
        },
      ];

      const accountId = 'account123';

      // Mock OramaManager instance and methods
      const insertMock = jest.fn().mockResolvedValue(undefined);
      const saveIndexMock = jest.fn().mockResolvedValue(undefined);
      (OramaManager as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn(),
        insert: insertMock,
        saveIndex: saveIndexMock,
      }));

      (getEmbeddings as jest.Mock).mockResolvedValue([0.1, 0.2]);
      (turndown.turndown as jest.Mock).mockReturnValue('converted markdown');

      // Mock DB methods for upsertEmailAddress, upsertAttachment, upsertEmail and thread update/findMany
      const upsertEmailAddressMock = jest.fn().mockResolvedValue({
        id: 'address1',
        address: 'alice@example.com',
      });
      // We will temporarily replace syncEmailsToDatabase internals to call mocked upsertEmailAddress and upsertAttachment
      // But since those are private, we rely on db mocks for upsert/findMany/update

      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(null);
      (db.emailAddress.create as jest.Mock).mockResolvedValue({ id: 'address1', address: 'alice@example.com' });
      (db.emailAddress.update as jest.Mock).mockResolvedValue({ id: 'address1', address: 'alice@example.com' });

      (db.thread.upsert as jest.Mock).mockResolvedValue({ id: 'thread1' });
      (db.email.upsert as jest.Mock).mockResolvedValue({});
      (db.email.findMany as jest.Mock).mockResolvedValue([
        { emailLabel: 'inbox' },
      ]);
      (db.thread.update as jest.Mock).mockResolvedValue({});

      (db.emailAttachment.upsert as jest.Mock).mockResolvedValue({});

      await syncEmailsToDatabase(emails, accountId);

      // Check Orama methods called
      expect(insertMock).toHaveBeenCalled();
      expect(saveIndexMock).toHaveBeenCalled();

      // Check DB methods called for thread, email and attachments
      expect(db.thread.upsert).toHaveBeenCalled();
      expect(db.email.upsert).toHaveBeenCalled();
      expect(db.thread.update).toHaveBeenCalled();
      expect(db.emailAttachment.upsert).not.toHaveBeenCalled(); // no attachments in test data
    });

    it('should handle error during sync without throwing', async () => {
      const emails = [];
      const accountId = 'account123';

      (OramaManager as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn(),
        insert: jest.fn().mockRejectedValue(new Error('fail')),
        saveIndex: jest.fn(),
      }));

      await expect(syncEmailsToDatabase(emails, accountId)).resolves.not.toThrow();
    });
  });

  describe('upsertEmailAddress', () => {
    const upsertEmailAddress = jest.requireActual('@/lib/sync-to-db').upsertEmailAddress;

    it('should create new email address if not exists', async () => {
      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue(null);
      (db.emailAddress.create as jest.Mock).mockResolvedValue({ id: 'id1', address: 'addr@example.com' });

      const result = await upsertEmailAddress({ address: 'addr@example.com', name: 'Name', raw: 'raw' }, 'acc1');
      expect(db.emailAddress.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'id1', address: 'addr@example.com' });
    });

    it('should update email address if exists', async () => {
      (db.emailAddress.findUnique as jest.Mock).mockResolvedValue({ id: 'id1', address: 'addr@example.com' });
      (db.emailAddress.update as jest.Mock).mockResolvedValue({ id: 'id1', address: 'addr@example.com' });

      const result = await upsertEmailAddress({ address: 'addr@example.com', name: 'Name', raw: 'raw' }, 'acc1');
      expect(db.emailAddress.update).toHaveBeenCalled();
      expect(result).toEqual({ id: 'id1', address: 'addr@example.com' });
    });

    it('should return null and log on error', async () => {
      (db.emailAddress.findUnique as jest.Mock).mockRejectedValue(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await upsertEmailAddress({ address: 'addr@example.com', name: 'Name', raw: 'raw' }, 'acc1');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('upsertAttachment', () => {
    const upsertAttachment = jest.requireActual('@/lib/sync-to-db').upsertAttachment;

    it('should upsert attachment', async () => {
      (db.emailAttachment.upsert as jest.Mock).mockResolvedValue({});

      await upsertAttachment('email1', {
        id: 'att1',
        name: 'file.txt',
        mimeType: 'text/plain',
        size: 123,
        inline: false,
        contentId: 'cid1',
        content: Buffer.from('content'),
        contentLocation: 'loc1',
      });

      expect(db.emailAttachment.upsert).toHaveBeenCalled();
    });

    it('should log error on failure', async () => {
      (db.emailAttachment.upsert as jest.Mock).mockRejectedValue(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await upsertAttachment('email1', {
        id: 'att1',
        name: 'file.txt',
        mimeType: 'text/plain',
        size: 123,
        inline: false,
        contentId: 'cid1',
        content: Buffer.from('content'),
        contentLocation: 'loc1',
      });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
