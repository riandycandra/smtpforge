import { body } from 'express-validator';

export const sendEmailValidator = [
  body('smtp_account')
    .notEmpty()
    .withMessage('smtp_account is required')
    .isUUID()
    .withMessage('smtp_account must be a valid UUID'),
  
  body('to')
    .isArray({ min: 1 })
    .withMessage('to must be an array with at least one recipient'),
  body('to.*')
    .isEmail()
    .withMessage('All items in to array must be valid email addresses')
    .isLength({ max: 255 }),

  body('cc')
    .optional()
    .isArray()
    .withMessage('cc must be an array'),
  body('cc.*')
    .isEmail()
    .withMessage('All items in cc array must be valid email addresses')
    .isLength({ max: 255 }),

  body('bcc')
    .optional()
    .isArray()
    .withMessage('bcc must be an array'),
  body('bcc.*')
    .isEmail()
    .withMessage('All items in bcc array must be valid email addresses')
    .isLength({ max: 255 }),

  body('subject')
    .notEmpty()
    .withMessage('subject is required')
    .isString()
    .isLength({ max: 500 }),

  body('html')
    .notEmpty()
    .withMessage('html is required')
    .isString()
    .isLength({ max: 5242880 }), // 5MB max length for HTML body

  body('attachments')
    .optional()
    .isArray()
    .withMessage('attachments must be an array'),
  body('attachments.*.filename')
    .notEmpty()
    .withMessage('attachment filename is required')
    .isString()
    .isLength({ max: 255 }),
  body('attachments.*.url')
    .notEmpty()
    .withMessage('attachment url is required')
    .isURL()
    .withMessage('attachment url must be a valid URL'),
];
