import { describe, it, expect, vi } from 'vitest';
import nodemailer, { type Transporter } from 'nodemailer';

describe('Nodemailer Transporter Contract', () => {
  it('should create an active transport instance with options', () => {
    const transporter: Transporter = nodemailer.createTransport({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'securepassword',
      },
    });

    expect(transporter).toBeDefined();
    expect(typeof transporter.sendMail).toBe('function');
  });

  it('should deliver email and return a messageId and response string', async () => {
    const mockTransporter: Transporter = nodemailer.createTransport({
      name: 'mock',
      version: '1.0.0',
      send: (mail, callback) => {
        callback(null, {
          messageId: '<test-message-123@smtpforge.local>',
          response: '250 2.0.0 OK: queued as 12345',
          envelope: mail.message.getEnvelope(),
          accepted: ['recipient@example.com'],
          rejected: [],
          pending: [],
        });
      },
    } as any);

    const result = await mockTransporter.sendMail({
      from: '"SMTP Forge" <sender@smtpforge.local>',
      to: 'recipient@example.com',
      subject: 'Regression Test Subject',
      html: '<p>Regression test body</p>',
    });

    expect(result.messageId).toBe('<test-message-123@smtpforge.local>');
    expect(result.response).toContain('250');
    expect(result.accepted).toContain('recipient@example.com');
  });

  it('should correctly reject when SMTP server errors occur', async () => {
    const mockTransporter: Transporter = nodemailer.createTransport({
      name: 'mock-fail',
      version: '1.0.0',
      send: (mail, callback) => {
        const error: any = new Error('Invalid login: 535 5.7.8 Authentication failed');
        error.responseCode = 535;
        callback(error);
      },
    } as any);

    await expect(mockTransporter.sendMail({
      from: 'sender@smtpforge.local',
      to: 'recipient@example.com',
      subject: 'Fail Test',
    })).rejects.toThrow('Authentication failed');
  });
});

