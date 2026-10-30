import { describe, it, expect } from 'vitest';
import { classifyError, RetryClassification } from '../services/retry-classifier.service';

describe('Worker Retry Classifier', () => {
  it('should classify fatal 5xx SMTP responses as NON_RETRYABLE', () => {
    expect(classifyError({ responseCode: 550, message: 'User unknown' }))
      .toBe(RetryClassification.NON_RETRYABLE);

    expect(classifyError({ responseCode: 554, message: 'Transaction failed' }))
      .toBe(RetryClassification.NON_RETRYABLE);
  });

  it('should classify 503 and 504 temporary codes as RETRYABLE', () => {
    expect(classifyError({ responseCode: 503, message: 'Bad sequence of commands' }))
      .toBe(RetryClassification.RETRYABLE);

    expect(classifyError({ responseCode: 504, message: 'Command parameter not implemented' }))
      .toBe(RetryClassification.RETRYABLE);
  });

  it('should classify authentication errors as NON_RETRYABLE', () => {
    expect(classifyError({ code: 'EAUTH', message: 'Invalid credentials' }))
      .toBe(RetryClassification.NON_RETRYABLE);

    expect(classifyError({ message: 'Authentication required' }))
      .toBe(RetryClassification.NON_RETRYABLE);
  });

  it('should classify network dropouts, rate-limits, and timeouts as RETRYABLE', () => {
    expect(classifyError({ code: 'ETIMEDOUT', message: 'Connection timed out' }))
      .toBe(RetryClassification.RETRYABLE);

    expect(classifyError({ code: 'ECONNRESET', message: 'Socket hung up' }))
      .toBe(RetryClassification.RETRYABLE);

    expect(classifyError({ responseCode: 421, message: 'Service not available, closing transmission channel' }))
      .toBe(RetryClassification.RETRYABLE);

    expect(classifyError({ responseCode: 450, message: 'Requested mail action not taken: mailbox busy' }))
      .toBe(RetryClassification.RETRYABLE);
  });
});

