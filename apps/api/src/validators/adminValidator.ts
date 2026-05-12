import { body, param, query } from 'express-validator';

export const smtpCreateValidator = [
  body('name').notEmpty().isString().isLength({ max: 255 }),
  body('host').notEmpty().isString().isLength({ max: 255 }),
  body('port').notEmpty().isInt({ min: 1, max: 65535 }),
  body('secure').isBoolean(),
  body('username').notEmpty().isString(),
  body('password').notEmpty().isString(),
  body('from_email').notEmpty().isEmail(),
  body('from_name').optional({ nullable: true }).isString(),
  body('retry_attempts').optional().isInt({ min: 0, max: 10 }),
  body('rate_limit_per_hour').optional({ nullable: true }).isInt({ min: 1 }),
  body('is_active').optional().isBoolean(),
  body('ignore_tls_errors').optional().isBoolean(),
];

export const smtpUpdateValidator = [
  body('name').optional().isString().isLength({ max: 255 }),
  body('host').optional().isString().isLength({ max: 255 }),
  body('port').optional().isInt({ min: 1, max: 65535 }),
  body('secure').optional().isBoolean(),
  body('username').optional().isString(),
  body('password').optional().isString(),
  body('from_email').optional().isEmail(),
  body('from_name').optional({ nullable: true }).isString(),
  body('retry_attempts').optional().isInt({ min: 0, max: 10 }),
  body('rate_limit_per_hour').optional({ nullable: true }).isInt({ min: 1 }),
  body('is_active').optional().isBoolean(),
  body('ignore_tls_errors').optional().isBoolean(),
];

export const smtpTestValidator = [
  body('host').notEmpty().isString().isLength({ max: 255 }),
  body('port').notEmpty().isInt({ min: 1, max: 65535 }),
  body('secure').isBoolean(),
  body('username').notEmpty().isString(),
  body('password').notEmpty().isString(),
  body('ignore_tls_errors').optional().isBoolean(),
];

export const apiKeyCreateValidator = [
  body('name').notEmpty().isString().isLength({ max: 255 }),
  body('rate_limit_per_hour').optional({ nullable: true }).isInt({ min: 1 }),
  body('is_active').optional().isBoolean(),
];

export const apiKeyUpdateValidator = [
  body('name').optional().isString().isLength({ max: 255 }),
  body('rate_limit_per_hour').optional({ nullable: true }).isInt({ min: 1 }),
  body('is_active').optional().isBoolean(),
];

export const assignPermissionValidator = [
  body('smtp_account_id').notEmpty().isUUID(),
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
