export enum RetryClassification {
  RETRYABLE = 'RETRYABLE',
  NON_RETRYABLE = 'NON_RETRYABLE',
}

export function classifyError(error: any): RetryClassification {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code?.toLowerCase() || '';
  const response = error?.responseCode || 0;

  // Non-retryable SMTP error codes (e.g., 550 Mailbox unavailable, 535 Authentication failed)
  if (response >= 500 && response < 600 && response !== 503 && response !== 504 && response !== 530) {
    // 503/504 are often temporary, others are permanent
    return RetryClassification.NON_RETRYABLE;
  }

  // Common authentication failures
  if (message.includes('auth') || code === 'eauth') {
    return RetryClassification.NON_RETRYABLE;
  }

  // Invalid recipient
  if (message.includes('invalid recipient') || code === 'eenvelope') {
    return RetryClassification.NON_RETRYABLE;
  }

  // Attachment errors
  if (message.includes('attachment') && (message.includes('invalid') || message.includes('blocked'))) {
    return RetryClassification.NON_RETRYABLE;
  }

  // Default to retryable (Network errors, timeouts, etc)
  return RetryClassification.RETRYABLE;
}
