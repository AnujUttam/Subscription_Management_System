const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');

/**
 * Scan for real-time background events (approaching expiry, overdue invoices)
 * without creating duplicate notifications within a 24-hour window.
 */
const scanBackgroundAlerts = async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Subscriptions approaching expiry (active and currentPeriodEnd <= 3 days)
    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      currentPeriodEnd: { $gte: now, $lte: threeDaysFromNow }
    }).populate('customerId', 'name email').populate('planId', 'name').limit(5);

    for (const sub of expiringSubscriptions) {
      const existingNotif = await Notification.findOne({
        type: 'subscription',
        'metadata.subscriptionId': sub._id.toString(),
        'metadata.alertType': 'expiry_approaching',
        createdAt: { $gte: oneDayAgo }
      });

      if (!existingNotif) {
        const customerName = sub.customerId?.name || 'Customer';
        const planName = sub.planId?.name || 'Plan';
        await Notification.create({
          title: 'Subscription Approaching Expiry',
          message: `${customerName}'s ${planName} subscription expires on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}.`,
          type: 'subscription',
          level: 'warning',
          link: '/subscriptions',
          metadata: {
            subscriptionId: sub._id.toString(),
            alertType: 'expiry_approaching'
          }
        });
      }
    }

    // 2. Invoices overdue (status 'pending' or 'open' and dueDate < now)
    const overdueInvoices = await Invoice.find({
      status: { $in: ['pending', 'open'] },
      dueDate: { $lt: now }
    }).populate('customerId', 'name email').limit(5);

    for (const inv of overdueInvoices) {
      const existingNotif = await Notification.findOne({
        type: 'invoice',
        'metadata.invoiceId': inv._id.toString(),
        'metadata.alertType': 'invoice_overdue',
        createdAt: { $gte: oneDayAgo }
      });

      if (!existingNotif) {
        const customerName = inv.customerId?.name || 'Customer';
        await Notification.create({
          title: 'Invoice Overdue',
          message: `Invoice ${inv.invoiceNumber} for ${customerName} (₹${inv.totalAmount}) is past its due date.`,
          type: 'invoice',
          level: 'error',
          link: '/invoices',
          metadata: {
            invoiceId: inv._id.toString(),
            alertType: 'invoice_overdue'
          }
        });
      }
    }
  } catch (err) {
    console.error('[NotificationController.scanBackgroundAlerts] Error:', err.message);
  }
};

/**
 * GET /api/notifications
 * Fetch notifications for current authenticated user
 */
const getNotifications = async (req, res) => {
  try {
    const role = req.user?.role || 'staff';
    const userId = req.user?._id;

    // Trigger non-blocking background check
    await scanBackgroundAlerts();

    const query = {
      $or: [
        { recipientRole: 'all' },
        { recipientRole: role },
        { recipientId: userId }
      ]
    };

    if (req.query.unreadOnly === 'true') {
      query.isRead = false;
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ ...query, isRead: false })
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('[NotificationController.getNotifications] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve notifications.' }
    });
  }
};

/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const role = req.user?.role || 'staff';
    const userId = req.user?._id;

    const unreadCount = await Notification.countDocuments({
      isRead: false,
      $or: [
        { recipientRole: 'all' },
        { recipientRole: role },
        { recipientId: userId }
      ]
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('[NotificationController.getUnreadCount] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve unread notification count.' }
    });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        $set: { isRead: true },
        $addToSet: { readBy: req.user?._id }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found.' }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification
    });
  } catch (error) {
    console.error('[NotificationController.markAsRead] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update notification status.' }
    });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all visible notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const role = req.user?.role || 'staff';
    const userId = req.user?._id;

    const query = {
      isRead: false,
      $or: [
        { recipientRole: 'all' },
        { recipientRole: role },
        { recipientId: userId }
      ]
    };

    await Notification.updateMany(query, {
      $set: { isRead: true },
      $addToSet: { readBy: userId }
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('[NotificationController.markAllAsRead] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to mark all notifications as read.' }
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
