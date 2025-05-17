/**
 * Mock för NotificationService
 */

export const mockNotificationService = {
  sendNotification: jest.fn().mockResolvedValue({ success: true, id: 'notification-123' }),
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPush: jest.fn().mockResolvedValue({ success: true }),
  listNotifications: jest.fn().mockResolvedValue([
    { id: 'notification-1', type: 'info', title: 'Test notification', message: 'Test message', read: false },
    { id: 'notification-2', type: 'warning', title: 'Test warning', message: 'Warning message', read: true },
  ]),
  markAsRead: jest.fn().mockResolvedValue({ success: true }),
  clearAll: jest.fn().mockResolvedValue({ success: true }),
  getUnreadCount: jest.fn().mockResolvedValue(3),
  registerDeviceToken: jest.fn().mockResolvedValue({ success: true }),
  unregisterDeviceToken: jest.fn().mockResolvedValue({ success: true }),
};

export default mockNotificationService; 