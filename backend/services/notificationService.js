const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

/**
 * Send push notification to a specific user by userId
 */
async function sendPushNotificationToUser(userId, { title, body, data }) {
  try {
    if (!userId) return;
    const user = await User.findById(userId).select('pushTokens notifications');
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return;
    }

    // Check if user has ticketUpdates enabled (default is true)
    if (user.notifications && user.notifications.ticketUpdates === false) {
      return;
    }

    const messages = [];
    for (const pushToken of user.pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`[Push] Invalid Expo push token: ${pushToken}`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'complaint-updates',
      });
    }

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        ticketChunk.forEach(async (ticket, index) => {
          if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            const badToken = chunk[index].to;
            await User.findByIdAndUpdate(userId, { $pull: { pushTokens: badToken } });
          }
        });
      } catch (error) {
        console.error('[Push] Error sending push chunk:', error);
      }
    }
  } catch (error) {
    console.error('[Push] Failed to send push notification:', error.message);
  }
}

/**
 * Notify creator that complaint was registered successfully
 */
async function notifyComplaintRegistered(complaint) {
  try {
    const creatorId = complaint.createdBy?._id || complaint.createdBy;
    await sendPushNotificationToUser(creatorId, {
      title: 'Ticket Registered',
      body: 'Your complaint has been registered successfully.',
      data: {
        complaintId: String(complaint._id),
        type: 'COMPLAINT_CREATED',
        status: complaint.status || 'Pending',
      },
    });
  } catch (err) {
    console.error('[Push] Error in notifyComplaintRegistered:', err.message);
  }
}

/**
 * Notify creator and staff member when complaint is assigned
 */
async function notifyComplaintAssigned(complaint, assignedStaff) {
  try {
    const creatorId = complaint.createdBy?._id || complaint.createdBy;
    const staffName = assignedStaff?.username || 'assigned staff';

    // Notify creator
    await sendPushNotificationToUser(creatorId, {
      title: 'Staff Assigned',
      body: `Your complaint has been assigned to ${staffName}.`,
      data: {
        complaintId: String(complaint._id),
        type: 'COMPLAINT_ASSIGNED',
        status: 'Assigned',
      },
    });

    // Notify staff
    const staffId = assignedStaff?._id || assignedStaff;
    if (staffId && String(staffId) !== String(creatorId)) {
      await sendPushNotificationToUser(staffId, {
        title: 'New Ticket Assigned',
        body: `A new complaint #${String(complaint._id).slice(-6)} has been assigned to you.`,
        data: {
          complaintId: String(complaint._id),
          type: 'COMPLAINT_ASSIGNED',
          status: 'Assigned',
        },
      });
    }
  } catch (err) {
    console.error('[Push] Error in notifyComplaintAssigned:', err.message);
  }
}

/**
 * Notify creator when status changes or complaint is resolved
 */
async function notifyComplaintStatusChanged(complaint, newStatus, previousStatus) {
  try {
    // Prevent duplicate notifications if status hasn't changed
    if (newStatus === previousStatus) return;

    const creatorId = complaint.createdBy?._id || complaint.createdBy;
    const isResolved = newStatus === 'Completed' || newStatus === 'Resolved';

    if (isResolved) {
      await sendPushNotificationToUser(creatorId, {
        title: 'Ticket Resolved',
        body: 'Your complaint has been resolved successfully.',
        data: {
          complaintId: String(complaint._id),
          type: 'COMPLAINT_RESOLVED',
          status: newStatus,
        },
      });
    } else {
      const displayStatus = newStatus === 'In-Progress' ? 'In Progress' : newStatus;
      await sendPushNotificationToUser(creatorId, {
        title: 'Status Updated',
        body: `Your complaint is now ${displayStatus}.`,
        data: {
          complaintId: String(complaint._id),
          type: 'COMPLAINT_STATUS_UPDATED',
          status: newStatus,
        },
      });
    }
  } catch (err) {
    console.error('[Push] Error in notifyComplaintStatusChanged:', err.message);
  }
}

module.exports = {
  sendPushNotificationToUser,
  notifyComplaintRegistered,
  notifyComplaintAssigned,
  notifyComplaintStatusChanged,
};
