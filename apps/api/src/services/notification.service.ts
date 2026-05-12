import { NotificationConfig } from '@mailer/database';
import { NOTIFICATION_TYPE, WORKER_STATUS, WorkerStatus } from '@mailer/shared';
import axios from 'axios';

type NotificationOptions = {
  title: string;
  message: string;
  style?: 'good' | 'attention' | 'accent' | 'warning';
  facts?: { title: string; value: string }[];
};

const dashboardUrl = process.env.WEB_URL || 'http://localhost:3001/dashboard';

const slackStyleColor: Record<NonNullable<NotificationOptions['style']>, string> = {
  good: '#2EB67D',
  attention: '#E01E5A',
  accent: '#1264A3',
  warning: '#ECB22E',
};

const formatTimestamp = () => new Date().toLocaleString();

const toSlackMarkdown = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '*$1*');

const escapeTelegramHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toTelegramHtml = (text: string) =>
  escapeTelegramHtml(text).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

const getNotificationErrorMessage = (error: any) => {
  const providerMessage =
    error.response?.data?.description ||
    error.response?.data?.error ||
    error.response?.statusText;

  if (providerMessage) {
    return `${error.message}: ${providerMessage}`;
  }

  return error.message || 'Unknown notification error';
};

const canUseTelegramDashboardButton = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return (
      ['http:', 'https:'].includes(parsedUrl.protocol) &&
      hostname !== 'localhost' &&
      hostname !== '127.0.0.1' &&
      hostname !== '0.0.0.0' &&
      hostname !== '[::1]' &&
      !hostname.endsWith('.local')
    );
  } catch {
    return false;
  }
};

const formatTelegramMessage = (options: NotificationOptions) => {
  const facts = [
    ...(options.facts || []),
    { title: 'Timestamp', value: formatTimestamp() },
    { title: 'Platform', value: 'SMTP Forge' },
  ];

  const factLines = facts
    .map((fact) => `<b>${escapeTelegramHtml(fact.title)}</b>\n${escapeTelegramHtml(fact.value)}`)
    .join('\n\n');

  return `<b>${escapeTelegramHtml(options.title)}</b>\n\n${toTelegramHtml(options.message)}\n\n${factLines}`;
};

export async function sendNotification(config: NotificationConfig, options: NotificationOptions) {
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
                  url: dashboardUrl
                }
              ]
            },
          },
        ],
      });
    }

    if (config.type === NOTIFICATION_TYPE.SLACK) {
      const { webhookUrl } = config.config;
      if (!webhookUrl) throw new Error('Slack webhookUrl is missing');

      const facts = [
        ...(options.facts || []),
        { title: 'Timestamp', value: formatTimestamp() },
        { title: 'Platform', value: 'SMTP Forge' },
      ];

      await axios.post(webhookUrl, {
        text: `${options.title}\n${toSlackMarkdown(options.message)}`,
        attachments: [
          {
            color: slackStyleColor[options.style || 'accent'],
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: options.title,
                  emoji: true,
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: toSlackMarkdown(options.message),
                },
              },
              {
                type: 'section',
                fields: facts.map((fact) => ({
                  type: 'mrkdwn',
                  text: `*${fact.title}:*\n${fact.value}`,
                })),
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'View Dashboard',
                      emoji: true,
                    },
                    url: dashboardUrl,
                    style: 'primary',
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    if (config.type === NOTIFICATION_TYPE.TELEGRAM) {
      const { botToken, chatId } = config.config;
      if (!botToken) throw new Error('Telegram botToken is missing');
      if (!chatId) throw new Error('Telegram chatId is missing');

      const payload: Record<string, unknown> = {
        chat_id: chatId,
        text: formatTelegramMessage(options),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      if (canUseTelegramDashboardButton(dashboardUrl)) {
        payload.reply_markup = {
          inline_keyboard: [
            [
              {
                text: 'View Dashboard',
                url: dashboardUrl,
              },
            ],
          ],
        };
      }

      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, payload);
    }
  } catch (error: any) {
    const message = getNotificationErrorMessage(error);
    console.error(`Failed to send notification via ${config.type}:`, message);
    throw new Error(message);
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
