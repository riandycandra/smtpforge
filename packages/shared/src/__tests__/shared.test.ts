import { describe, it, expect, vi } from 'vitest';
import { EMAIL_STATUS, NOTIFICATION_TYPE, QUEUE_NAME_EMAIL_DELIVERY, logger } from '../index';

describe('Shared Constants & Utils', () => {
  it('should define stable email lifecycle statuses', () => {
    expect(EMAIL_STATUS.QUEUED).toBe('queued');
    expect(EMAIL_STATUS.PROCESSING).toBe('processing');
    expect(EMAIL_STATUS.SENT).toBe('sent');
    expect(EMAIL_STATUS.FAILED).toBe('failed');
    expect(EMAIL_STATUS.RETRYING).toBe('retrying');
  });

  it('should define valid notification types', () => {
    expect(NOTIFICATION_TYPE.TEAMS).toBe('teams');
    expect(NOTIFICATION_TYPE.TELEGRAM).toBe('telegram');
    expect(NOTIFICATION_TYPE.SLACK).toBe('slack');
    expect(NOTIFICATION_TYPE.EMAIL).toBe('email');
  });

  it('should define email queue name', () => {
    expect(QUEUE_NAME_EMAIL_DELIVERY).toBe('email-delivery');
  });

  it('should log structured messages with timestamp and level', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Test info message');

    expect(consoleSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.level).toBe('info');
    expect(logged.message).toBe('Test info message');
    expect(logged.timestamp).toBeDefined();

    consoleSpy.mockRestore();
  });
});
