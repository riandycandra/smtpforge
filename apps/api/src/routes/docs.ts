import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SMTP Forge Public API',
    version: '1.0.0',
    description: 'Public API for sending email through SMTP Forge and discovering SMTP accounts available to an API key.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current API server',
    },
  ],
  tags: [
    {
      name: 'Emails',
      description: 'Queue outbound email for delivery.',
    },
    {
      name: 'SMTP Accounts',
      description: 'Discover SMTP accounts available to your API key.',
    },
  ],
  components: {
    securitySchemes: {
      MailerApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Mailer-Api-Key',
        description: 'Public API key generated from the SMTP Forge dashboard.',
      },
      MailerApiKeyQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'api_key',
        description: 'Public API key passed as a query parameter (useful for EventSource / browser SSE).',
      },
    },
    schemas: {
      Attachment: {
        type: 'object',
        required: ['filename', 'url'],
        properties: {
          filename: {
            type: 'string',
            example: 'invoice.pdf',
          },
          url: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/files/invoice.pdf',
          },
        },
      },
      SendEmailRequest: {
        type: 'object',
        required: ['to', 'subject', 'html'],
        properties: {
          to: {
            oneOf: [
              {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
              },
              {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'string',
                  format: 'email',
                },
                example: ['user@example.com', 'ops@example.com'],
              },
            ],
          },
          cc: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email',
            },
            example: ['manager@example.com'],
          },
          bcc: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email',
            },
            example: ['audit@example.com'],
          },
          subject: {
            type: 'string',
            maxLength: 500,
            example: 'Welcome to SMTP Forge',
          },
          html: {
            type: 'string',
            description: 'HTML body for the email.',
            example: '<h1>Hello from SMTP Forge</h1>',
          },
          text: {
            type: 'string',
            description: 'Optional plain text fallback.',
            example: 'Hello from SMTP Forge',
          },
          attachments: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Attachment',
            },
          },
          smtp_account: {
            type: 'string',
            format: 'uuid',
            description: 'Optional SMTP account ID. If omitted, SMTP Forge auto-selects an active account.',
            example: 'b2fe839c-0f7f-48fe-872f-9dc37d51af65',
          },
        },
      },
      SendEmailAccepted: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Email queued successfully',
              },
              job_id: {
                type: 'string',
                example: 'bullet-job-123',
              },
              status: {
                type: 'string',
                example: 'queued',
              },
            },
          },
        },
      },
      SmtpAccount: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'b2fe839c-0f7f-48fe-872f-9dc37d51af65',
          },
          name: {
            type: 'string',
            example: 'Marketing SMTP',
          },
          host: {
            type: 'string',
            example: 'smtp.sendgrid.net',
          },
          port: {
            type: 'integer',
            example: 587,
          },
          from_email: {
            type: 'string',
            format: 'email',
            example: 'marketing@example.com',
          },
          from_name: {
            type: 'string',
            example: 'Marketing Team',
          },
        },
      },
      EmailProgressEvent: {
        type: 'object',
        properties: {
          job_id: { type: 'string', example: '12' },
          email_job_id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-4a6c-9c3f-98f5b84c8a5b' },
          status: { type: 'string', enum: ['queued', 'processing', 'retrying', 'sent', 'failed'], example: 'processing' },
          step: { type: 'string', enum: ['queued', 'preparing', 'connecting_smtp', 'sending', 'delivered', 'retrying', 'failed'], example: 'connecting_smtp' },
          percentage: { type: 'integer', example: 50 },
          message: { type: 'string', example: 'Connecting to SMTP server and transmitting message' },
          latency_ms: { type: 'integer', nullable: true, example: 320 },
          smtp_response: { type: 'string', nullable: true, example: '250 2.0.0 OK' },
          error: { type: 'string', nullable: true },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Missing or invalid X-Mailer-Api-Key header',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
    },
  },
  security: [
    {
      MailerApiKey: [],
    },
    {
      MailerApiKeyQuery: [],
    },
  ],
  paths: {
    '/emails': {
      post: {
        tags: ['Emails'],
        summary: 'Send an email',
        description: 'Queues an outbound email for delivery. Attachments must be referenced by a publicly reachable URL.',
        operationId: 'sendEmail',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SendEmailRequest',
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Email accepted and queued for delivery.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SendEmailAccepted',
                },
              },
            },
          },
          '400': {
            description: 'Validation failed.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'Missing or invalid API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '503': {
            description: 'No active SMTP account is available.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/emails/{job_id}/progress': {
      get: {
        tags: ['Emails'],
        summary: 'Stream email delivery progress (SSE)',
        description: 'Subscribes to real-time Server-Sent Events (SSE) tracking the status and step transitions of a queued email. Closes automatically upon reaching terminal status (sent or failed). Supports authentication via X-Mailer-Api-Key header or api_key query parameter for browser EventSource compatibility.',
        operationId: 'streamEmailProgress',
        parameters: [
          {
            name: 'job_id',
            in: 'path',
            required: true,
            description: 'The job_id returned when the email was queued, or the internal database UUID.',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'api_key',
            in: 'query',
            required: false,
            description: 'API key for browser EventSource clients that cannot send custom request headers.',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Server-Sent Events stream. Emits named events: progress, completed, and failed.',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  example: 'event: progress\ndata: {"job_id":"12","status":"processing","step":"connecting_smtp","percentage":50,"message":"Connecting to SMTP server and transmitting message","timestamp":"2026-09-21T13:50:00.000Z"}\n\n',
                },
              },
            },
          },
          '401': {
            description: 'Missing or invalid API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Email job not found or unauthorized.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/smtp-accounts': {
      get: {
        tags: ['SMTP Accounts'],
        summary: 'List SMTP accounts',
        description: 'Returns SMTP accounts the current API key may use. If no specific permissions are configured, all active accounts are returned.',
        operationId: 'listSmtpAccounts',
        responses: {
          '200': {
            description: 'Available SMTP accounts.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/SmtpAccount',
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Missing or invalid API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const docsRouter = Router();

docsRouter.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

docsRouter.use('/', swaggerUi.serve);
docsRouter.get('/', swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'SMTP Forge API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));
