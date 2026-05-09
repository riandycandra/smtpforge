import { NotificationConfig } from '@mailer/database';
import { NOTIFICATION_TYPE, WORKER_STATUS, WorkerStatus } from '@mailer/shared';
import axios from 'axios';

export async function sendNotification(config: NotificationConfig, options: { title: string; message: string; style?: 'good' | 'attention' | 'accent' | 'warning'; facts?: { title: string; value: string }[] }) {
  try {
    if (config.type === NOTIFICATION_TYPE.TEAMS) {
      const { webhookUrl } = config.config;
      if (!webhookUrl) throw new Error('Teams webhookUrl is missing');

      await axios.post(webhookUrl, {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
              version: '1.4',
              body: [
                {
                  type: 'Container',
                  style: options.style || 'accent',
                  items: [
                    {
                      type: 'TextBlock',
                      size: 'Large',
                      weight: 'Bolder',
                      text: options.title,
                      color: 'Default'
                    }
                  ],
                  bleed: true
                },
                {
                  type: 'Container',
                  items: [
                    {
                      type: 'TextBlock',
                      text: options.message,
                      wrap: true,
                      spacing: 'Medium'
                    },
                    {
                      type: 'FactSet',
                      facts: [
                        ...(options.facts || []),
                        {
                          title: 'Timestamp',
                          value: new Date().toLocaleString()
                        },
                        {
                          title: 'Platform',
                          value: 'SMTP Forge'
                        }
                      ],
                      spacing: 'Medium'
                    }
                  ]
                }
              ],
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: 'View Dashboard',
                  url: process.env.WEB_URL || 'http://localhost:3001/dashboard'
                }
              ]
            },
          },
        ],
      });
    }
  } catch (error: any) {
    console.error(`Failed to send notification via ${config.type}:`, error.message);
  }
}

export async function notifyWorkerStatusChange(config: NotificationConfig, newStatus: WorkerStatus) {
  const isUp = newStatus === WORKER_STATUS.UP;
  const statusEmoji = isUp ? '✅' : '❌';
  const statusText = isUp ? 'Service Operational' : 'Service Disruption Detected';

  await sendNotification(config, {
    title: `${statusEmoji} ${statusText}`,
    message: isUp
      ? 'The background email worker service has recovered and is now processing the queue normally.'
      : 'The background email worker service is currently unavailable. Email delivery is paused until the service is restored.',
    style: isUp ? 'good' : 'attention',
    facts: [
      { title: 'Status', value: isUp ? 'UP' : 'DOWN' },
      { title: 'Monitor', value: 'Worker Health Check' }
    ]
  });
}
