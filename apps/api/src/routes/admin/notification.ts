import { Router } from 'express';
import { NotificationConfig } from '@mailer/database';
import { logger } from '../../utils/logger';

export const adminNotificationsRouter = Router();

// Get all notification configs
adminNotificationsRouter.get('/', async (req, res) => {
  try {
    const configs = await NotificationConfig.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json(configs);
  } catch (error: any) {
    logger.error('Failed to fetch notification configs', error);
    res.status(500).json({ error: 'Failed to fetch notification configs' });
  }
});

// Create notification config
adminNotificationsRouter.post('/', async (req, res) => {
  try {
    const { name, type, config, is_enabled } = req.body;
    
    if (!name || !type || !config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newConfig = await NotificationConfig.create({
      name,
      type,
      config,
      is_enabled: is_enabled ?? true,
    });

    res.status(201).json(newConfig);
  } catch (error: any) {
    logger.error('Failed to create notification config', error);
    res.status(500).json({ error: 'Failed to create notification config' });
  }
});

// Update notification config
adminNotificationsRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, config, is_enabled } = req.body;

    const notificationConfig = await NotificationConfig.findByPk(id);
    if (!notificationConfig) {
      return res.status(404).json({ error: 'Notification config not found' });
    }

    await notificationConfig.update({
      name: name ?? notificationConfig.name,
      type: type ?? notificationConfig.type,
      config: config ?? notificationConfig.config,
      is_enabled: is_enabled ?? notificationConfig.is_enabled,
    });

    res.json(notificationConfig);
  } catch (error: any) {
    logger.error('Failed to update notification config', error);
    res.status(500).json({ error: 'Failed to update notification config' });
  }
});

// Delete notification config
adminNotificationsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notificationConfig = await NotificationConfig.findByPk(id);
    
    if (!notificationConfig) {
      return res.status(404).json({ error: 'Notification config not found' });
    }

    await notificationConfig.destroy();
    res.status(204).send();
  } catch (error: any) {
    logger.error('Failed to delete notification config', error);
    res.status(500).json({ error: 'Failed to delete notification config' });
  }
});

// Test notification config
adminNotificationsRouter.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const notificationConfig = await NotificationConfig.findByPk(id);
    
    if (!notificationConfig) {
      return res.status(404).json({ error: 'Notification config not found' });
    }

    const { sendNotification } = await import('../../services/notification.service');
    await sendNotification(notificationConfig, {
      title: '🔔 Test Notification',
      message: 'This is a **test notification** from SMTP Forge. Your webhook configuration is working correctly and the service is ready to alert you on status changes.',
      style: 'accent',
      facts: [
        { title: 'Status', value: 'TEST' },
        { title: 'Source', value: 'Dashboard Test Button' }
      ]
    });

    res.json({ message: 'Test notification sent successfully' });
  } catch (error: any) {
    logger.error('Failed to send test notification', error);
    res.status(500).json({ error: error.message || 'Failed to send test notification' });
  }
});
