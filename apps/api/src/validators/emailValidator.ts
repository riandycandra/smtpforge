import { body } from 'express-validator';

export const sendEmailValidator = [
  body('smtp_account')
    .optional()
    .isUUID()
    .withMessage('smtp_account must be a valid UUID'),

  body('to')
    .notEmpty()
    .withMessage('to is required')
    .custom((value) => {
      if (Array.isArray(value)) {
        if (value.length === 0) throw new Error('to array must have at least one recipient');
        return value.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      }
      if (typeof value === 'string') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      return false;
    })
    .withMessage('to must be a valid email string or an array of valid email addresses'),

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
