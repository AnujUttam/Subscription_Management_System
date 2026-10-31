const Notification = require('../models/Notification');

/**
 * Create a business notification safely without blocking or breaking main requests
 */
const createNotification = async (payload) => {
  try {
    const notification = await Notification.create({
      title: payload.title,
      message: payload.message,
      type: payload.type || 'system',
      level: payload.level || 'info',
      link: payload.link || '',
      recipientRole: payload.recipientRole || 'all',
      recipientId: payload.recipientId || null,
      metadata: payload.metadata || {}
    });
    return notification;
  } catch (error) {
    console.error('[NotificationService.createNotification] Failed:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
